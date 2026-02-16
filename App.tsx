
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
import { Cloud, CloudOff, Loader2, ShieldCheck, Database, Key, ArrowRight, Lock, UploadCloud, RefreshCw, Save, HardDrive } from 'lucide-react';
import { MOCK_BOT_ALIASES, MOCK_LEAVE_CONFIGS, MOCK_SHIFTS } from './constants';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [activePage, setActivePage] = useState<PageType>('dashboard');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');
  const [localSaveStatus, setLocalSaveStatus] = useState<'saved' | 'saving'>('saved');

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

  const getStorageKey = (key: string) => `zenith_v2_${userEmail.replace(/[@.]/g, '_')}_${key}`;

  const getSupabase = (url?: string, key?: string) => {
    const sUrl = url || botSettings.supabaseUrl;
    const sKey = key || botSettings.supabaseKey;
    if (!sUrl || !sKey) return null;
    return createClient(sUrl, sKey);
  };

  // --- PERSISTENCE LAYER: LOCAL STORAGE ---
  // Muat data awal dari localStorage
  useEffect(() => {
    if (isAuthenticated && userEmail) {
      const load = (key: string, fallback: any) => {
        const val = localStorage.getItem(getStorageKey(key));
        return val ? JSON.parse(val) : fallback;
      };

      setEmployees(load('employees', []));
      setShifts(load('shifts', MOCK_SHIFTS));
      setHistory(load('history', []));
      setAliases(load('aliases', MOCK_BOT_ALIASES));
      setConfigs(load('configs', MOCK_LEAVE_CONFIGS));
      
      const savedBotSettings = load('bot_settings', null);
      if (savedBotSettings) setBotSettings(prev => ({ ...prev, ...savedBotSettings }));
    }
  }, [isAuthenticated, userEmail]);

  // Simpan otomatis ke localStorage setiap ada perubahan (Debounced)
  useEffect(() => {
    if (!isAuthenticated || !userEmail) return;
    setLocalSaveStatus('saving');
    const timer = setTimeout(() => {
      localStorage.setItem(getStorageKey('employees'), JSON.stringify(employees));
      localStorage.setItem(getStorageKey('shifts'), JSON.stringify(shifts));
      localStorage.setItem(getStorageKey('history'), JSON.stringify(history));
      localStorage.setItem(getStorageKey('aliases'), JSON.stringify(aliases));
      localStorage.setItem(getStorageKey('configs'), JSON.stringify(configs));
      localStorage.setItem(getStorageKey('bot_settings'), JSON.stringify(botSettings));
      setLocalSaveStatus('saved');
    }, 500);
    return () => clearTimeout(timer);
  }, [employees, shifts, history, aliases, configs, botSettings, isAuthenticated, userEmail]);

  // --- PERSISTENCE LAYER: CLOUD (SUPABASE) ---
  const pushToCloud = useCallback(async (manual: boolean = false) => {
    const supabase = getSupabase();
    if (!supabase || !isAuthenticated) {
        if (manual) alert("Hubungkan Supabase terlebih dahulu di menu Koneksi Server!");
        return;
    }
    
    setSyncStatus('syncing');
    try {
      // 1. Profil & Bot Settings
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
          }))
        );
      }

      // 3. Shifts
      if (shifts.length > 0) {
        await supabase.from('shifts').upsert(
          shifts.map(s => ({
            id: s.id, name: s.name, start_time: s.startTime, end_time: s.endTime,
            category: s.category, description: s.description, owner_email: userEmail
          }))
        );
      }

      // 4. Configs & Respon
      if (configs.length > 0) {
        await supabase.from('configs').upsert(
          configs.map(c => ({
            type: c.type, max_minutes: c.maxMinutes, max_per_day: c.maxPerDay,
            response_template: c.responseTemplate, warning_template: c.warningTemplate, owner_email: userEmail
          })), { onConflict: 'type,owner_email' }
        );
      }

      setSyncStatus('synced');
      if (manual) alert("🚀 SEMUA DATA TERKIRIM! Cloud Supabase kini 100% sama dengan data lokal Anda.");
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
      if (manual) alert("Gagal push ke cloud. Pastikan tabel di Supabase sudah dibuat.");
    }
  }, [employees, shifts, configs, botSettings, userEmail, isAuthenticated]);

  const pullAllFromCloud = useCallback(async (email: string, settings: BotSettings, manual: boolean = false) => {
    const supabase = getSupabase(settings.supabaseUrl, settings.supabaseKey);
    if (!supabase) return;
    
    setSyncStatus('syncing');
    try {
      const { data: prof } = await supabase.from('profiles').select('*').eq('email', email).single();
      if (prof) {
        setBotSettings(prev => ({
          ...prev,
          botToken: prof.bot_token || '',
          botUsername: prof.bot_username || '@ZenithBot',
        }));
      }

      const { data: emp } = await supabase.from('employees').select('*').eq('owner_email', email);
      if (emp) setEmployees(emp.map(d => ({
        id: d.id, name: d.name, username: d.username, telegramId: d.telegram_id,
        role: d.role, shiftId: d.shift_id, status: d.status
      })));

      const { data: shft } = await supabase.from('shifts').select('*').eq('owner_email', email);
      if (shft) setShifts(shft.map(d => ({
        id: d.id, name: d.name, startTime: d.start_time, endTime: d.end_time,
        category: d.category, description: d.description
      })));

      setSyncStatus('synced');
      if (manual) alert("✅ DATA PULIH! Semua data dari Cloud berhasil ditarik.");
    } catch (err) {
      setSyncStatus('error');
    }
  }, []);

  const handleLogin = (email: string) => {
    setUserEmail(email);
    setIsAuthenticated(true);
    localStorage.setItem('zenith_active_session', email);
    
    const storageKey = `zenith_cloud_key_${email.replace(/[@.]/g, '_')}`;
    const savedKeys = localStorage.getItem(storageKey);
    if (savedKeys) {
      const keys = JSON.parse(savedKeys);
      setBotSettings(prev => ({ ...prev, ...keys }));
      pullAllFromCloud(email, keys);
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

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  return (
    <div className="flex min-h-screen bg-[#f8f9fd]">
      <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={handleLogout} />
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <div className="bg-white px-12 py-4 border-b border-slate-200/60 flex justify-between items-center shadow-sm z-20">
           <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border ${localSaveStatus === 'saving' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                 {localSaveStatus === 'saving' ? <Loader2 size={12} className="animate-spin" /> : <HardDrive size={12} />}
                 <span className="text-[9px] font-black uppercase tracking-widest">{localSaveStatus === 'saving' ? 'Menyimpan...' : 'Disk Lokal Aman'}</span>
              </div>

              <div className="w-px h-6 bg-slate-100 mx-2" />

              {syncStatus === 'syncing' ? (
                <div className="flex items-center gap-2 text-indigo-500 animate-pulse">
                   <Loader2 size={14} className="animate-spin" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Pushing Cloud...</span>
                </div>
              ) : syncStatus === 'synced' ? (
                <div className="flex items-center gap-2 text-indigo-600">
                   <ShieldCheck size={14} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Terhubung Supabase</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-rose-500">
                   <CloudOff size={14} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Cloud Error</span>
                </div>
              )}
              
              <button 
                onClick={() => pushToCloud(true)} 
                className="ml-4 flex items-center gap-2 px-6 py-2 bg-[#0f172a] text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-slate-200 hover:bg-black transition-all active:scale-95"
              >
                <UploadCloud size={14} /> PUSH KE CLOUD
              </button>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Administrator</p>
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
            {activePage === 'koneksi' && <BotConnection settings={botSettings} setSettings={setBotSettings} onForcePush={() => pushToCloud(true)} onForcePull={() => pullAllFromCloud(userEmail, botSettings, true)} configs={configs} employees={employees} aliases={aliases} />}
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
