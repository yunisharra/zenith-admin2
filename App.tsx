
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import { PageType, Employee, Shift, LeaveHistory, BotAlias, LeaveConfig, BotSettings } from './types';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Shifts from './pages/Shifts';
import History from './pages/History';
import BotIntelligence from './pages/BotIntelligence';
import Settings from './pages/Settings';
import Respon from './pages/Respon';
import Simulator from './pages/Simulator';
import BotConnection from './pages/BotConnection';
import Deployment from './pages/Deployment';
import Login from './pages/Login';
import { createClient } from '@supabase/supabase-js';
import { 
  ShieldCheck, RefreshCw, AlertTriangle, Cloud, Loader2, 
  DatabaseZap, CheckCircle2, XCircle, UploadCloud, DownloadCloud, 
  Database, Zap, Lock, WifiOff, ServerCrash, ZapOff
} from 'lucide-react';
import { MOCK_BOT_ALIASES, MOCK_LEAVE_CONFIGS, MOCK_SHIFTS } from './constants';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('zenith_active_session'));
  const [userEmail, setUserEmail] = useState<string>(() => localStorage.getItem('zenith_active_session') || '');
  const [activePage, setActivePage] = useState<PageType>('dashboard');
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });
  
  const hasInitialPullDone = useRef(false);
  const lastSyncHash = useRef<string>('');
  const supabaseInstance = useRef<any>(null);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>(MOCK_SHIFTS);
  const [history, setHistory] = useState<LeaveHistory[]>([]);
  const [configs, setConfigs] = useState<LeaveConfig[]>(MOCK_LEAVE_CONFIGS);
  const [aliases, setAliases] = useState<BotAlias[]>(MOCK_BOT_ALIASES);
  
  const [botSettings, setBotSettings] = useState<BotSettings>(() => {
    const email = localStorage.getItem('zenith_active_session') || '';
    const emailKey = email.replace(/[@.]/g, '_');
    const saved = localStorage.getItem(`zenith_bot_settings_${emailKey}`);
    return saved ? JSON.parse(saved) : {
      botToken: '', groupId: '', botUsername: '@ZenithBot', isOnline: false, serverUrl: '', 
      supabaseUrl: localStorage.getItem(`zenith_cloud_url_${emailKey}`) || '', 
      supabaseKey: localStorage.getItem(`zenith_cloud_key_${emailKey}`) || ''
    };
  });

  const getSupabase = useCallback(() => {
    if (supabaseInstance.current) return supabaseInstance.current;
    const emailKey = userEmail.replace(/[@.]/g, '_');
    const sUrl = localStorage.getItem(`zenith_cloud_url_${emailKey}`) || botSettings.supabaseUrl;
    const sKey = localStorage.getItem(`zenith_cloud_key_${emailKey}`) || botSettings.supabaseKey;
    if (!sUrl || !sKey) return null;
    supabaseInstance.current = createClient(sUrl, sKey);
    return supabaseInstance.current;
  }, [userEmail, botSettings.supabaseUrl, botSettings.supabaseKey]);

  // --- TURBO PULL (Background Mode) ---
  const pullEverything = useCallback(async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) return;

    setIsSyncing(true);
    setSyncStatus('syncing');

    try {
      // Menggunakan allSettled agar tidak "hang" jika ada satu tabel yang bermasalah
      const results = await Promise.allSettled([
        supabase.from('profiles').select('*').eq('email', email).maybeSingle(),
        supabase.from('employees').select('*').eq('owner_email', email),
        supabase.from('shifts').select('*').eq('owner_email', email),
        supabase.from('configs').select('*').eq('owner_email', email)
      ]);

      results.forEach((res, index) => {
        if (res.status === 'fulfilled' && !res.value.error) {
          const data = res.value.data;
          if (!data) return;

          if (index === 0) setBotSettings(p => ({...p, botToken: data.bot_token || p.botToken, botUsername: data.bot_username || p.botUsername}));
          if (index === 1) setEmployees(data.map((d: any) => ({id: d.id, name: d.name, username: d.username, telegramId: d.telegram_id, role: d.role, shiftId: d.shift_id, status: d.status})));
          if (index === 2 && data.length > 0) setShifts(data.map((d: any) => ({id: d.id, name: d.name, startTime: d.start_time, endTime: d.end_time, category: d.category, description: d.description})));
          if (index === 3 && data.length > 0) setConfigs(data.map((d: any) => ({type: d.type, maxMinutes: d.max_minutes, maxPerDay: d.max_per_day, responseTemplate: d.response_template, warningTemplate: d.warning_template})));
        }
      });

      setSyncStatus('synced');
      hasInitialPullDone.current = true;
      setIsSyncing(false);
      setIsAppReady(true); // Memastikan Dashboard terbuka
    } catch (e) {
      setSyncStatus('error');
      setIsSyncing(false);
      setIsAppReady(true); // Tetap buka app meski sync background error
    }
  }, [getSupabase]);

  const handleLogin = (email: string, url?: string, key?: string) => {
    const emailKey = email.replace(/[@.]/g, '_');
    localStorage.setItem('zenith_active_session', email);
    if (url && key) {
      localStorage.setItem(`zenith_cloud_url_${emailKey}`, url);
      localStorage.setItem(`zenith_cloud_key_${emailKey}`, key);
      const known = JSON.parse(localStorage.getItem('zenith_known_users') || '[]');
      if (!known.includes(email)) localStorage.setItem('zenith_known_users', JSON.stringify([...known, email]));
    }
    setUserEmail(email);
    setIsAuthenticated(true);
    setIsAppReady(true); // INSTANT ENTRY
    pullEverything(email); // Jalankan sync di background
  };

  useEffect(() => {
    if (isAuthenticated && !hasInitialPullDone.current) {
      setIsAppReady(true); 
      pullEverything(userEmail);
    }
  }, [isAuthenticated, userEmail, pullEverything]);

  const handleLogout = () => {
    localStorage.removeItem('zenith_active_session');
    setIsAuthenticated(false);
    window.location.reload();
  };

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;
  
  return (
    <div className="flex min-h-screen bg-[#f8f9fd] font-sans transition-opacity duration-300">
      <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={handleLogout} />
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        
        {/* Sync Indicator - Kecil & Elegan */}
        {isSyncing && (
          <div className="fixed bottom-8 right-8 z-[9999] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
             <RefreshCw size={14} className="animate-spin text-indigo-400" />
             <span className="text-[10px] font-black uppercase tracking-widest">Updating Cloud Data...</span>
          </div>
        )}

        <div className="bg-white px-12 py-5 border-b border-slate-200/60 flex justify-between items-center z-20">
           <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border ${syncStatus === 'syncing' ? 'bg-indigo-50 text-indigo-500' : 'bg-emerald-50 text-emerald-600'}`}>
              <Database size={14} /> <span className="text-[10px] font-black uppercase tracking-widest">{syncStatus === 'syncing' ? 'SYNCING...' : 'CLOUD READY'}</span>
           </div>
           <div className="flex items-center gap-6">
              <button onClick={() => pullEverything(userEmail)} className="text-slate-400 hover:text-indigo-600 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-colors"><RefreshCw size={14} /> Force Sync</button>
              <div className="flex items-center gap-4 pl-6 border-l border-slate-100 text-right">
                 <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Admin</p><p className="text-[12px] font-bold text-slate-800">{userEmail}</p></div>
                 <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-sm font-black shadow-lg shadow-indigo-200">{userEmail.charAt(0).toUpperCase()}</div>
              </div>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <div className="max-w-[1500px] mx-auto">
            {activePage === 'dashboard' && <Dashboard employees={employees} history={history} shifts={shifts} setHistory={setHistory} configs={configs} />}
            {activePage === 'karyawan' && <Employees employees={employees} setEmployees={setEmployees} shifts={shifts} />}
            {activePage === 'shift' && <Shifts shifts={shifts} setShifts={setShifts} employees={employees} setEmployees={setEmployees} setHistory={setHistory} />}
            {activePage === 'histori' && <History history={history} setHistory={setHistory} />}
            {activePage === 'bot-intelligence' && <BotIntelligence aliases={aliases} setAliases={setAliases} />}
            {activePage === 'respon' && <Respon configs={configs} setConfigs={setConfigs} />}
            {activePage === 'koneksi' && <BotConnection settings={botSettings} setSettings={setBotSettings} onForcePush={() => {}} onForcePull={() => pullEverything(userEmail)} configs={configs} employees={employees} aliases={aliases} />}
            {activePage === 'simulator' && <Simulator employees={employees} shifts={shifts} history={history} setHistory={setHistory} configs={configs} aliases={aliases} botSettings={botSettings} />}
            {activePage === 'deployment' && <Deployment />}
            {activePage === 'pengaturan' && <Settings configs={configs} setConfigs={setConfigs} userEmail={userEmail} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
