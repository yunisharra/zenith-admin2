
import React, { useState, useEffect, useCallback } from 'react';
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
import { Cloud, CloudOff, Loader2, ShieldCheck, Database, Key, ArrowRight, Lock, UploadCloud, RefreshCw } from 'lucide-react';
import { MOCK_BOT_ALIASES, MOCK_LEAVE_CONFIGS } from './constants';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [activePage, setActivePage] = useState<PageType>('dashboard');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'error'>('synced');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
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

  const getSupabase = (url?: string, key?: string) => {
    const sUrl = url || botSettings.supabaseUrl;
    const sKey = key || botSettings.supabaseKey;
    if (!sUrl || !sKey) return null;
    return createClient(sUrl, sKey);
  };

  const pullAllFromCloud = useCallback(async (email: string, settings: BotSettings, manual: boolean = false) => {
    const supabase = getSupabase(settings.supabaseUrl, settings.supabaseKey);
    if (!supabase) return;
    
    setSyncStatus('syncing');
    try {
      const { data: profData } = await supabase.from('profiles').select('*').eq('email', email).single();
      if (profData) {
        setBotSettings(prev => ({
          ...prev,
          botToken: profData.bot_token || '',
          groupId: profData.group_id || '',
          botUsername: profData.bot_username || '@ZenithBot',
        }));
      }

      const { data: empData } = await supabase.from('employees').select('*').eq('owner_email', email);
      if (empData) setEmployees(empData.map(d => ({
        id: d.id, name: d.name, username: d.username, telegramId: d.telegram_id,
        role: d.role, shiftId: d.shift_id, status: d.status
      })));

      const { data: histData } = await supabase.from('history').select('*').eq('owner_email', email).order('id', { ascending: false }).limit(50);
      if (histData) setHistory(histData.map(d => ({
        id: d.id, employeeName: d.employee_name, type: d.type,
        timeOut: d.time_out, timeIn: d.time_in, date: d.date, status: d.status
      })));

      setSyncStatus('synced');
      if (manual) alert("Data berhasil ditarik dari Cloud!");
    } catch (err) {
      setSyncStatus('error');
    }
  }, [botSettings]);

  const pushToCloud = useCallback(async (manual: boolean = false) => {
    const supabase = getSupabase();
    if (!supabase || !isAuthenticated) {
        if (manual) alert("Koneksi Supabase belum terkonfigurasi!");
        return;
    }
    
    setSyncStatus('syncing');
    try {
      await supabase.from('profiles').upsert({
        email: userEmail,
        bot_token: botSettings.botToken,
        group_id: botSettings.groupId,
        bot_username: botSettings.botUsername,
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' });

      const empPayload = employees.map(e => ({
        id: e.id, name: e.name, username: e.username, telegram_id: e.telegramId,
        role: e.role, shift_id: e.shiftId, status: e.status, owner_email: userEmail
      }));
      if (empPayload.length > 0) await supabase.from('employees').upsert(empPayload);

      setSyncStatus('synced');
      if (manual) alert("Data Berhasil di Push!");
    } catch (err) {
      setSyncStatus('error');
      if (manual) alert("Gagal push data. Periksa koneksi.");
    }
  }, [employees, botSettings, userEmail, isAuthenticated]);

  useEffect(() => {
    const savedEmail = localStorage.getItem('zenith_active_session');
    if (savedEmail) {
      setUserEmail(savedEmail);
      setIsAuthenticated(true);
      const storageKey = `zenith_cloud_key_${savedEmail.replace(/[@.]/g, '_')}`;
      const savedKeys = localStorage.getItem(storageKey);
      if (savedKeys) {
        const keys = JSON.parse(savedKeys);
        setBotSettings(prev => ({ ...prev, ...keys }));
        pullAllFromCloud(savedEmail, keys);
      } else {
        setActivePage('cloud-init');
      }
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
      pullAllFromCloud(email, keys);
    } else {
      setActivePage('cloud-init');
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
              {syncStatus === 'syncing' ? (
                <div className="flex items-center gap-2 text-indigo-500 animate-pulse">
                   <Loader2 size={14} className="animate-spin" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Sinkronisasi...</span>
                </div>
              ) : syncStatus === 'synced' ? (
                <div className="flex items-center gap-2 text-emerald-500">
                   <ShieldCheck size={14} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Sesi Terproteksi Cloud</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-rose-500">
                   <CloudOff size={14} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Offline Mode</span>
                </div>
              )}
              <button onClick={() => pushToCloud(true)} className="ml-4 flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">
                <UploadCloud size={14} /> Push
              </button>
           </div>
           <div className="flex items-center gap-6">
              <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Admin</p>
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
