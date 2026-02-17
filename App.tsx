
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
  Database, Zap, Lock
} from 'lucide-react';
import { MOCK_BOT_ALIASES, MOCK_LEAVE_CONFIGS, MOCK_SHIFTS } from './constants';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('zenith_active_session'));
  const [userEmail, setUserEmail] = useState<string>(() => localStorage.getItem('zenith_active_session') || '');
  const [activePage, setActivePage] = useState<PageType>('dashboard');
  
  // SYNC STATES
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [syncStep, setSyncStep] = useState('');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });
  
  const hasInitialPullDone = useRef(false);
  const lastSyncHash = useRef<string>('');

  // --- STATE DATA ---
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>(MOCK_SHIFTS);
  const [history, setHistory] = useState<LeaveHistory[]>([]);
  const [configs, setConfigs] = useState<LeaveConfig[]>(MOCK_LEAVE_CONFIGS);
  const [aliases, setAliases] = useState<BotAlias[]>(MOCK_BOT_ALIASES);
  const [botSettings, setBotSettings] = useState<BotSettings>(() => {
    const saved = localStorage.getItem(`zenith_bot_settings_${userEmail.replace(/[@.]/g, '_')}`);
    return saved ? JSON.parse(saved) : {
      botToken: '', groupId: '', botUsername: '@ZenithBot', isOnline: false, serverUrl: '', supabaseUrl: '', supabaseKey: ''
    };
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: null }), 3000);
  };

  const getSupabase = useCallback(() => {
    const sUrl = botSettings.supabaseUrl || localStorage.getItem(`zenith_cloud_url_${userEmail.replace(/[@.]/g, '_')}`);
    const sKey = botSettings.supabaseKey || localStorage.getItem(`zenith_cloud_key_${userEmail.replace(/[@.]/g, '_')}`);
    if (!sUrl || !sKey) return null;
    return createClient(sUrl, sKey);
  }, [botSettings.supabaseUrl, botSettings.supabaseKey, userEmail]);

  // --- ENGINE: PULL (TARIK DATA) ---
  const pullEverything = useCallback(async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) {
      setIsAppReady(true);
      return;
    }

    setIsSyncing(true);
    setSyncStatus('syncing');
    setSyncStep('Cloud Handshake...');

    try {
      setSyncStep('Sync Profil Bot...');
      const { data: prof } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
      if (prof) {
        setBotSettings(prev => ({
          ...prev,
          botToken: prof.bot_token || prev.botToken,
          botUsername: prof.bot_username || prev.botUsername,
        }));
      }

      setSyncStep('Sync Database Karyawan...');
      const { data: emp } = await supabase.from('employees').select('*').eq('owner_email', email);
      if (emp) {
        setEmployees(emp.map(d => ({
          id: d.id, name: d.name, username: d.username, telegramId: d.telegram_id,
          role: d.role, shiftId: d.shift_id, status: d.status
        })));
      }

      setSyncStep('Sync Jadwal Shift...');
      const { data: shft } = await supabase.from('shifts').select('*').eq('owner_email', email);
      if (shft && shft.length > 0) {
        setShifts(shft.map(d => ({
          id: d.id, name: d.name, startTime: d.start_time, endTime: d.end_time,
          category: d.category, description: d.description
        })));
      }

      setSyncStep('Sync Konfigurasi Izin...');
      const { data: cfgs } = await supabase.from('configs').select('*').eq('owner_email', email);
      if (cfgs && cfgs.length > 0) {
        setConfigs(cfgs.map(d => ({
          type: d.type, maxMinutes: d.max_minutes, maxPerDay: d.max_per_day,
          responseTemplate: d.response_template, warningTemplate: d.warning_template
        })));
      }

      setSyncStatus('synced');
      setSyncStep('Semua Sistem Siap!');
      lastSyncHash.current = JSON.stringify({ employees, shifts, configs });
      hasInitialPullDone.current = true;
      setTimeout(() => {
        setIsSyncing(false);
        setIsAppReady(true);
      }, 1000);
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
      setIsSyncing(false);
      setIsAppReady(true);
      showToast("Gagal terhubung ke Cloud. Gunakan Offline Mode.", "error");
    }
  }, [getSupabase, employees, shifts, configs]);

  // --- ENGINE: PUSH (SIMPAN DATA) ---
  const pushEverything = useCallback(async (isManual = false) => {
    const supabase = getSupabase();
    if (!supabase) return;

    if (isManual) {
      setIsSyncing(true);
      setSyncStep('Manual Cloud Push...');
    }
    setSyncStatus('syncing');

    try {
      // 1. Profile
      await supabase.from('profiles').upsert({
        email: userEmail,
        bot_token: botSettings.botToken,
        bot_username: botSettings.botUsername,
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' });

      // 2. Employees
      if (employees.length > 0) {
        await supabase.from('employees').upsert(
          employees.map(e => ({
            id: e.id, name: e.name, username: e.username, telegram_id: e.telegramId,
            role: e.role, shift_id: e.shiftId, status: e.status, owner_email: userEmail
          })), { onConflict: 'id' }
        );
      }

      // 3. Shifts
      await supabase.from('shifts').upsert(
        shifts.map(s => ({
          id: s.id, name: s.name, start_time: s.startTime, end_time: s.endTime,
          category: s.category, description: s.description, owner_email: userEmail
        })), { onConflict: 'id' }
      );

      // 4. Configs
      await supabase.from('configs').upsert(
        configs.map(c => ({
          type: c.type, max_minutes: c.maxMinutes, max_per_day: c.maxPerDay,
          response_template: c.responseTemplate, warning_template: c.warningTemplate, owner_email: userEmail
        })), { onConflict: 'type,owner_email' }
      );

      setSyncStatus('synced');
      lastSyncHash.current = JSON.stringify({ employees, shifts, configs });
      if (isManual) {
        setSyncStep('Database Teramankan!');
        showToast("Database Sinkron ke Cloud!", "success");
        setTimeout(() => setIsSyncing(false), 1000);
      }
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
      if (isManual) setIsSyncing(false);
    }
  }, [getSupabase, employees, shifts, configs, botSettings, userEmail]);

  // --- AUTO SYNC LOGIC ---
  useEffect(() => {
    if (!isAuthenticated || !hasInitialPullDone.current) return;
    
    const currentHash = JSON.stringify({ employees, shifts, configs });
    if (currentHash === lastSyncHash.current) return;

    const timeout = setTimeout(() => {
      pushEverything(false);
    }, 2000); // Auto-push 2 detik setelah perubahan

    return () => clearTimeout(timeout);
  }, [employees, shifts, configs, isAuthenticated, pushEverything]);

  // Initial Sync on Mount
  useEffect(() => {
    if (isAuthenticated && !hasInitialPullDone.current) {
      pullEverything(userEmail);
    }
  }, [isAuthenticated, userEmail, pullEverything]);

  const handleLogin = (email: string, url?: string, key?: string) => {
    setUserEmail(email);
    setIsAuthenticated(true);
    localStorage.setItem('zenith_active_session', email);
    if (url && key) {
      localStorage.setItem(`zenith_cloud_url_${email.replace(/[@.]/g, '_')}`, url);
      localStorage.setItem(`zenith_cloud_key_${email.replace(/[@.]/g, '_')}`, key);
      setBotSettings(p => ({ ...p, supabaseUrl: url, supabaseKey: key }));
    }
    // Pull will be triggered by useEffect
  };

  const handleLogout = () => {
    localStorage.removeItem('zenith_active_session');
    setIsAuthenticated(false);
    window.location.reload();
  };

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;
  
  // SINKRONISASI WAJIB SAAT STARTUP
  if (!isAppReady && isSyncing) {
    return (
      <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center p-8 z-[9999]">
         <div className="bg-white/5 p-20 rounded-[4rem] border border-white/10 flex flex-col items-center gap-12 max-w-lg w-full backdrop-blur-3xl shadow-2xl">
            <div className="relative">
               <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20" />
               <div className="relative w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[3rem] flex items-center justify-center shadow-2xl border border-white/20">
                  <DatabaseZap size={56} className="text-white animate-bounce" />
               </div>
            </div>
            <div className="text-center space-y-4">
               <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Connecting to Cloud</h3>
               <p className="text-[12px] font-bold text-indigo-400 uppercase tracking-[0.4em] animate-pulse">{syncStep}</p>
            </div>
            <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
               <div className="h-full bg-indigo-500 animate-progress" />
            </div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic">Zenith Cloud-v4 Handshake</p>
         </div>
         <style>{`
          @keyframes progress { 0% { width: 0%; } 50% { width: 70%; } 100% { width: 100%; } }
          .animate-progress { animation: progress 3s infinite ease-in-out; }
         `}</style>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fd] font-sans">
      <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={handleLogout} />
      
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        
        {/* TOAST SYSTEM */}
        {toast.type && (
          <div className="fixed top-28 right-12 z-[1000] animate-in slide-in-from-right-10 duration-500">
             <div className={`px-8 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-4 border ${
               toast.type === 'success' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-rose-600 border-rose-400 text-white'
             }`}>
                {toast.type === 'success' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                <p className="text-xs font-black italic uppercase tracking-widest">{toast.message}</p>
             </div>
          </div>
        )}

        {/* OVERLAY SYNC SAAT MANUAL PUSH/PULL */}
        {isSyncing && isAppReady && (
          <div className="fixed inset-0 bg-indigo-900/40 backdrop-blur-sm z-[999] flex items-center justify-center animate-in fade-in duration-300">
             <div className="bg-white p-12 rounded-[3rem] shadow-2xl flex items-center gap-6 border border-indigo-100">
                <RefreshCw size={24} className="text-indigo-600 animate-spin" />
                <span className="text-sm font-black text-slate-800 uppercase tracking-widest">{syncStep}</span>
             </div>
          </div>
        )}

        {/* GLOBAL HEADER */}
        <div className="bg-white px-12 py-5 border-b border-slate-200/60 flex justify-between items-center shadow-sm z-20">
           <div className="flex items-center gap-4">
              <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all duration-700 ${
                syncStatus === 'syncing' ? 'bg-indigo-50 border-indigo-200 text-indigo-500' : 
                syncStatus === 'error' ? 'bg-rose-50 border-rose-200 text-rose-500' : 
                'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-lg shadow-emerald-500/10'
              }`}>
                 {syncStatus === 'syncing' ? <RefreshCw size={14} className="animate-spin" /> : syncStatus === 'error' ? <AlertTriangle size={14} /> : <Database size={14} />}
                 <span className="text-[10px] font-black uppercase tracking-widest">
                   {syncStatus === 'syncing' ? 'SYNCING...' : syncStatus === 'error' ? 'CLOUD ERROR' : 'CLOUD CONNECTED'}
                 </span>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 mr-4">
                 <button 
                  onClick={() => pullEverything(userEmail)}
                  className="p-3 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-xl transition-all flex items-center gap-2 text-[9px] font-black uppercase tracking-widest"
                 >
                    <DownloadCloud size={16} /> <span className="hidden xl:inline">Refresh Data</span>
                 </button>
                 <div className="w-px h-6 bg-slate-200 mx-1" />
                 <button 
                  onClick={() => pushEverything(true)}
                  className="p-3 bg-[#0f172a] text-white rounded-xl transition-all flex items-center gap-2 text-[9px] font-black uppercase tracking-widest hover:bg-black shadow-lg shadow-slate-900/20"
                 >
                    <UploadCloud size={16} /> <span className="hidden xl:inline">Save to Cloud</span>
                 </button>
              </div>

              <div className="flex items-center gap-4 pl-6 border-l border-slate-100">
                 <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Cloud Admin</p>
                    <p className="text-[12px] font-bold text-slate-800 mt-1.5">{userEmail}</p>
                 </div>
                 <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-sm font-black shadow-xl">
                    {userEmail.charAt(0).toUpperCase()}
                 </div>
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
            {activePage === 'koneksi' && <BotConnection settings={botSettings} setSettings={setBotSettings} onForcePush={() => pushEverything(true)} onForcePull={() => pullEverything(userEmail)} configs={configs} employees={employees} aliases={aliases} />}
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
