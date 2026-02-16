
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
import { Cloud, Loader2, ShieldCheck, Database, UploadCloud, RefreshCw, HardDrive, CheckCircle2 } from 'lucide-react';
import { MOCK_BOT_ALIASES, MOCK_LEAVE_CONFIGS, MOCK_SHIFTS } from './constants';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [activePage, setActivePage] = useState<PageType>('dashboard');
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>(MOCK_SHIFTS);
  const [history, setHistory] = useState<LeaveHistory[]>([]);
  const [aliases, setAliases] = useState<BotAlias[]>(MOCK_BOT_ALIASES);
  const [configs, setConfigs] = useState<LeaveConfig[]>(MOCK_LEAVE_CONFIGS);
  const [botSettings, setBotSettings] = useState<BotSettings>({
    botToken: '',
    groupId: '',
    botUsername: '@ZenithBot',
    isOnline: false,
    serverUrl: '',
    supabaseUrl: '',
    supabaseKey: ''
  });

  const isInitialMount = useRef(true);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const getSupabase = (url?: string, key?: string) => {
    const sUrl = url || botSettings.supabaseUrl;
    const sKey = key || botSettings.supabaseKey;
    if (!sUrl || !sKey) return null;
    return createClient(sUrl, sKey);
  };

  // --- SINKRONISASI OTOMATIS KE CLOUD ---
  const syncAllToCloud = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !isAuthenticated || isCloudLoading) return;

    setSyncStatus('syncing');
    try {
      // Upsert Profil & Settings
      await supabase.from('profiles').upsert({
        email: userEmail,
        bot_token: botSettings.botToken,
        bot_username: botSettings.botUsername,
        updated_at: new Date().toISOString()
      });

      // Sinkronisasi Karyawan (Hanya jika ada data)
      if (employees.length > 0) {
        await supabase.from('employees').upsert(
          employees.map(e => ({
            id: e.id, name: e.name, username: e.username, telegram_id: e.telegramId,
            role: e.role, shift_id: e.shiftId, status: e.status, owner_email: userEmail
          }))
        );
      }

      // Sinkronisasi Shift
      await supabase.from('shifts').upsert(
        shifts.map(s => ({
          id: s.id, name: s.name, start_time: s.startTime, end_time: s.endTime,
          category: s.category, description: s.description, owner_email: userEmail
        }))
      );

      // Sinkronisasi Config
      await supabase.from('configs').upsert(
        configs.map(c => ({
          type: c.type, max_minutes: c.maxMinutes, max_per_day: c.maxPerDay,
          response_template: c.responseTemplate, warning_template: c.warningTemplate, owner_email: userEmail
        }))
      );

      setSyncStatus('synced');
    } catch (err) {
      console.error("Auto-sync failed:", err);
      setSyncStatus('error');
    }
  }, [employees, shifts, configs, botSettings, userEmail, isAuthenticated, isCloudLoading]);

  // Debounced Auto-Sync: Setiap kali state berubah, simpan ke cloud otomatis setelah 2 detik diam
  useEffect(() => {
    if (isInitialMount.current || isCloudLoading) {
      isInitialMount.current = false;
      return;
    }

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      syncAllToCloud();
    }, 2000);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [employees, shifts, configs, botSettings, syncAllToCloud, isCloudLoading]);

  // --- PENARIKAN DATA WAJIB (STARTUP) ---
  const pullEverything = useCallback(async (email: string, settings: BotSettings) => {
    const supabase = getSupabase(settings.supabaseUrl, settings.supabaseKey);
    if (!supabase) return;

    setIsCloudLoading(true);
    setSyncStatus('syncing');

    try {
      const { data: prof } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
      if (prof) {
        setBotSettings(prev => ({
          ...prev,
          botToken: prof.bot_token || '',
          botUsername: prof.bot_username || '@ZenithBot',
          supabaseUrl: settings.supabaseUrl,
          supabaseKey: settings.supabaseKey
        }));
      }

      const { data: emp } = await supabase.from('employees').select('*').eq('owner_email', email);
      if (emp && emp.length > 0) {
        setEmployees(emp.map(d => ({
          id: d.id, name: d.name, username: d.username, telegramId: d.telegram_id,
          role: d.role, shiftId: d.shift_id, status: d.status
        })));
      }

      const { data: shft } = await supabase.from('shifts').select('*').eq('owner_email', email);
      if (shft && shft.length > 0) {
        setShifts(shft.map(d => ({
          id: d.id, name: d.name, startTime: d.start_time, endTime: d.end_time,
          category: d.category, description: d.description
        })));
      }

      const { data: cfgs } = await supabase.from('configs').select('*').eq('owner_email', email);
      if (cfgs && cfgs.length > 0) {
        setConfigs(cfgs.map(d => ({
          type: d.type, maxMinutes: d.max_minutes, maxPerDay: d.max_per_day,
          responseTemplate: d.response_template, warningTemplate: d.warning_template
        })));
      }

      setSyncStatus('synced');
    } catch (err) {
      console.error("Initial pull failed:", err);
      setSyncStatus('error');
    } finally {
      setIsCloudLoading(false);
    }
  }, []);

  const handleLogin = (email: string) => {
    setUserEmail(email);
    setIsAuthenticated(true);
    
    const storageKey = `zenith_cloud_key_${email.replace(/[@.]/g, '_')}`;
    const savedKeys = localStorage.getItem(storageKey);
    
    if (savedKeys) {
      const keys = JSON.parse(savedKeys);
      setBotSettings(prev => ({ ...prev, ...keys }));
      pullEverything(email, keys);
    } else {
      setActivePage('koneksi');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('zenith_active_session');
    setIsAuthenticated(false);
    setUserEmail('');
    window.location.reload();
  };

  useEffect(() => {
    const savedEmail = localStorage.getItem('zenith_active_session');
    if (savedEmail) {
      handleLogin(savedEmail);
    }
  }, []);

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  if (isCloudLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6">
        <div className="w-24 h-24 bg-indigo-600/20 rounded-full flex items-center justify-center mb-8 relative">
           <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20" />
           <RefreshCw size={40} className="text-indigo-500 animate-spin" />
        </div>
        <h2 className="text-white text-xl font-black uppercase tracking-widest mb-2 italic">Menyinkronkan Data...</h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">Mohon tunggu, menarik identitas dari cloud</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fd]">
      <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={handleLogout} />
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <div className="bg-white px-12 py-4 border-b border-slate-200/60 flex justify-between items-center shadow-sm z-20">
           <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${syncStatus === 'syncing' ? 'bg-indigo-50 border-indigo-100 text-indigo-500' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                 {syncStatus === 'syncing' ? <RefreshCw size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                 <span className="text-[9px] font-black uppercase tracking-widest">
                   {syncStatus === 'syncing' ? 'LIVE SYNCING...' : 'CLOUD PROTECTED'}
                 </span>
              </div>
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                 ID: {userEmail.split('@')[0]}
              </div>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Status: Global Online</p>
                  <p className="text-[11px] font-bold text-slate-700 mt-1.5">{userEmail}</p>
              </div>
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-lg">
                  {userEmail.charAt(0).toUpperCase()}
              </div>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <div className="max-w-[1400px] mx-auto">
            {activePage === 'dashboard' && <Dashboard employees={employees} history={history} shifts={shifts} setHistory={setHistory} configs={configs} />}
            {activePage === 'karyawan' && <Employees employees={employees} setEmployees={setEmployees} shifts={shifts} />}
            {activePage === 'shift' && <Shifts shifts={shifts} setShifts={setShifts} employees={employees} setEmployees={setEmployees} setHistory={setHistory} />}
            {activePage === 'histori' && <History history={history} setHistory={setHistory} />}
            {activePage === 'bot-intelligence' && <BotIntelligence aliases={aliases} setAliases={setAliases} />}
            {activePage === 'respon' && <Respon configs={configs} setConfigs={setConfigs} />}
            {activePage === 'koneksi' && <BotConnection settings={botSettings} setSettings={setBotSettings} onForcePush={syncAllToCloud} onForcePull={() => pullEverything(userEmail, botSettings)} configs={configs} employees={employees} aliases={aliases} />}
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
