
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
import { Cloud, Loader2, ShieldCheck, Database, UploadCloud, RefreshCw, HardDrive, CheckCircle2, AlertTriangle, CloudOff } from 'lucide-react';
import { MOCK_BOT_ALIASES, MOCK_LEAVE_CONFIGS, MOCK_SHIFTS } from './constants';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [activePage, setActivePage] = useState<PageType>('dashboard');
  const [isCloudLoading, setIsCloudLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'offline'>('synced');
  
  // LOCKS
  const [isDataReady, setIsDataReady] = useState(false); // Sudah tarik dari Cloud?
  const hasPulledRef = useRef(false); // Flag permanen pull pertama selesai

  // Helper untuk key storage yang konsisten
  const getStorageKey = (email: string, key: string) => `zenith_v2.5_${email.replace(/[@.]/g, '_')}_${key}`;

  // --- INITIAL STATE LOAD (LOCAL FIRST) ---
  // Kita ambil dari localStorage dulu supaya tidak kosong saat render pertama
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>(MOCK_SHIFTS);
  const [history, setHistory] = useState<LeaveHistory[]>([]);
  const [configs, setConfigs] = useState<LeaveConfig[]>(MOCK_LEAVE_CONFIGS);
  const [aliases, setAliases] = useState<BotAlias[]>(MOCK_BOT_ALIASES);
  const [botSettings, setBotSettings] = useState<BotSettings>({
    botToken: '', groupId: '', botUsername: '@ZenithBot', isOnline: false, serverUrl: '', supabaseUrl: '', supabaseKey: ''
  });

  // Fix: Replaced NodeJS.Timeout with ReturnType<typeof setTimeout> to resolve "Cannot find namespace 'NodeJS'" in browser environments.
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getSupabase = (url?: string, key?: string) => {
    const sUrl = url || botSettings.supabaseUrl;
    const sKey = key || botSettings.supabaseKey;
    if (!sUrl || !sKey) return null;
    return createClient(sUrl, sKey);
  };

  // --- PULL LOGIC (AMBIL DARI CLOUD) ---
  const pullEverything = useCallback(async (email: string, settings: BotSettings) => {
    const supabase = getSupabase(settings.supabaseUrl, settings.supabaseKey);
    if (!supabase) {
      setIsDataReady(true);
      hasPulledRef.current = true;
      return;
    }

    setIsCloudLoading(true);
    setSyncStatus('syncing');

    try {
      // 1. Ambil Profil
      const { data: prof } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
      if (prof) {
        setBotSettings(prev => ({
          ...prev,
          botToken: prof.bot_token || prev.botToken,
          botUsername: prof.bot_username || prev.botUsername,
          supabaseUrl: settings.supabaseUrl,
          supabaseKey: settings.supabaseKey
        }));
      }

      // 2. Ambil Karyawan
      const { data: emp } = await supabase.from('employees').select('*').eq('owner_email', email);
      if (emp && emp.length > 0) {
        setEmployees(emp.map(d => ({
          id: d.id, name: d.name, username: d.username, telegramId: d.telegram_id,
          role: d.role, shiftId: d.shift_id, status: d.status
        })));
      }

      // 3. Ambil Shift
      const { data: shft } = await supabase.from('shifts').select('*').eq('owner_email', email);
      if (shft && shft.length > 0) {
        setShifts(shft.map(d => ({
          id: d.id, name: d.name, startTime: d.start_time, endTime: d.end_time,
          category: d.category, description: d.description
        })));
      }

      // 4. Ambil Config
      const { data: cfgs } = await supabase.from('configs').select('*').eq('owner_email', email);
      if (cfgs && cfgs.length > 0) {
        setConfigs(cfgs.map(d => ({
          type: d.type, maxMinutes: d.max_minutes, maxPerDay: d.max_per_day,
          responseTemplate: d.response_template, warning_template: d.warning_template
        })));
      }

      setSyncStatus('synced');
      hasPulledRef.current = true;
      setIsDataReady(true); // LOCK DIBUKA: Sekarang boleh save ke Cloud
    } catch (err) {
      console.error("Cloud Pull Error:", err);
      setSyncStatus('error');
      // Jika gagal cloud, paksa buka lock agar user bisa kerja offline
      setIsDataReady(true);
      hasPulledRef.current = true;
    } finally {
      setIsCloudLoading(false);
    }
  }, [botSettings]);

  // --- PUSH LOGIC (SIMPAN KE CLOUD) ---
  const syncAllToCloud = useCallback(async () => {
    // PROTEKSI: Jangan pernah push jika pull belum selesai atau data belum ready
    if (!isDataReady || !hasPulledRef.current || !isAuthenticated) return;

    const supabase = getSupabase();
    if (!supabase) return;

    setSyncStatus('syncing');
    try {
      // Simpan Profil
      await supabase.from('profiles').upsert({
        email: userEmail,
        bot_token: botSettings.botToken,
        bot_username: botSettings.botUsername,
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' });

      // Simpan Karyawan (Jika ada)
      if (employees.length > 0) {
        await supabase.from('employees').upsert(
          employees.map(e => ({
            id: e.id, name: e.name, username: e.username, telegram_id: e.telegramId,
            role: e.role, shift_id: e.shiftId, status: e.status, owner_email: userEmail
          })), { onConflict: 'id' }
        );
      }

      // Simpan Shift
      await supabase.from('shifts').upsert(
        shifts.map(s => ({
          id: s.id, name: s.name, start_time: s.startTime, end_time: s.endTime,
          category: s.category, description: s.description, owner_email: userEmail
        })), { onConflict: 'id' }
      );

      // Simpan Config
      await supabase.from('configs').upsert(
        configs.map(c => ({
          type: c.type, max_minutes: c.maxMinutes, max_per_day: c.maxPerDay,
          response_template: c.responseTemplate, warning_template: c.warningTemplate, owner_email: userEmail
        })), { onConflict: 'type,owner_email' }
      );

      // BACKUP KE LOCALSTORAGE (SUPAYA REFRESH TIDAK BLANK)
      localStorage.setItem(getStorageKey(userEmail, 'employees'), JSON.stringify(employees));
      localStorage.setItem(getStorageKey(userEmail, 'shifts'), JSON.stringify(shifts));
      localStorage.setItem(getStorageKey(userEmail, 'configs'), JSON.stringify(configs));
      localStorage.setItem(getStorageKey(userEmail, 'bot_settings'), JSON.stringify(botSettings));

      setSyncStatus('synced');
    } catch (err) {
      console.error("Cloud Push Error:", err);
      setSyncStatus('error');
    }
  }, [employees, shifts, configs, botSettings, userEmail, isAuthenticated, isDataReady]);

  // Debounced Auto-Sync (Setiap 5 detik setelah perubahan)
  useEffect(() => {
    if (!isDataReady) return;

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => {
      syncAllToCloud();
    }, 5000);

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [employees, shifts, configs, botSettings, syncAllToCloud, isDataReady]);

  const handleLogin = (email: string) => {
    setUserEmail(email);
    setIsAuthenticated(true);
    
    // Langsung muat data lokal dulu (Pre-load)
    const localEmp = localStorage.getItem(getStorageKey(email, 'employees'));
    const localShift = localStorage.getItem(getStorageKey(email, 'shifts'));
    const localConfigs = localStorage.getItem(getStorageKey(email, 'configs'));
    const localSettings = localStorage.getItem(getStorageKey(email, 'bot_settings'));

    if (localEmp) setEmployees(JSON.parse(localEmp));
    if (localShift) setShifts(JSON.parse(localShift));
    if (localConfigs) setConfigs(JSON.parse(localConfigs));
    
    const keyPrefix = `zenith_cloud_key_${email.replace(/[@.]/g, '_')}`;
    const savedKeys = localStorage.getItem(keyPrefix);
    
    if (savedKeys) {
      const keys = JSON.parse(savedKeys);
      setBotSettings(prev => ({ ...prev, ...keys, ...(localSettings ? JSON.parse(localSettings) : {}) }));
      pullEverything(email, keys);
    } else {
      setIsDataReady(true);
      hasPulledRef.current = true;
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

  return (
    <div className="flex min-h-screen bg-[#f8f9fd]">
      <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={handleLogout} />
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        
        {/* Loading Overlay saat Pulling Data */}
        {isCloudLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-md z-[100] flex flex-col items-center justify-center animate-in fade-in">
             <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col items-center gap-6">
                <RefreshCw size={48} className="text-indigo-600 animate-spin" />
                <div className="text-center">
                   <h3 className="text-xl font-black text-slate-900 uppercase italic">Sinkronisasi Cloud...</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Mencegah data tertimpa, mohon tunggu sebentar</p>
                </div>
             </div>
          </div>
        )}

        <div className="bg-white px-12 py-4 border-b border-slate-200/60 flex justify-between items-center shadow-sm z-20">
           <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                syncStatus === 'syncing' ? 'bg-indigo-50 border-indigo-100 text-indigo-500' : 
                syncStatus === 'error' ? 'bg-rose-50 border-rose-100 text-rose-500' : 
                'bg-emerald-50 border-emerald-100 text-emerald-600'
              }`}>
                 {syncStatus === 'syncing' ? <RefreshCw size={12} className="animate-spin" /> : syncStatus === 'error' ? <AlertTriangle size={12} /> : <ShieldCheck size={12} />}
                 <span className="text-[9px] font-black uppercase tracking-widest">
                   {syncStatus === 'syncing' ? 'PROTECTING DATA...' : syncStatus === 'error' ? 'SYNC ERROR' : 'CLOUD ENCRYPTED'}
                 </span>
              </div>
              <div className="w-px h-6 bg-slate-100 mx-2" />
              <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                 MODE: {isDataReady ? 'LIVE SESSIONS' : 'INITIALIZING...'}
              </div>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Global Identity</p>
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
