
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
import { Cloud, CloudOff, Loader2, ShieldCheck, Database, Key, ArrowRight, Lock } from 'lucide-react';
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

  // FUNGSI UTAMA: Tarik SEMUA data dari Cloud (Termasuk Setingan Bot)
  const pullAllFromCloud = useCallback(async (email: string, settings: BotSettings) => {
    const supabase = getSupabase(settings.supabaseUrl, settings.supabaseKey);
    if (!supabase) return;
    
    setSyncStatus('syncing');
    try {
      // 1. Tarik Profil (Bot Token, Group ID, dll)
      const { data: profData, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (profData) {
        setBotSettings({
          ...settings,
          botToken: profData.bot_token || '',
          groupId: profData.group_id || '',
          botUsername: profData.bot_username || '@ZenithBot',
        });
      }

      // 2. Tarik Karyawan
      const { data: empData } = await supabase.from('employees').select('*').eq('owner_email', email);
      if (empData) setEmployees(empData.map(d => ({
        id: d.id, name: d.name, username: d.username, telegramId: d.telegram_id,
        role: d.role, shiftId: d.shift_id, status: d.status
      })));

      // 3. Tarik Histori
      const { data: histData } = await supabase.from('history').select('*').eq('owner_email', email).order('id', { ascending: false }).limit(50);
      if (histData) setHistory(histData.map(d => ({
        id: d.id, employeeName: d.employee_name, type: d.type,
        timeOut: d.time_out, timeIn: d.time_in, date: d.date, status: d.status
      })));

      setSyncStatus('synced');
    } catch (err) {
      console.error("Sync Error:", err);
      setSyncStatus('error');
    }
  }, []);

  // FUNGSI UTAMA: Kirim SEMUA data ke Cloud
  const pushToCloud = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !isAuthenticated) return;
    
    setSyncStatus('syncing');
    try {
      // Simpan Profil
      await supabase.from('profiles').upsert({
        email: userEmail,
        bot_token: botSettings.botToken,
        group_id: botSettings.groupId,
        bot_username: botSettings.botUsername,
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' });

      // Simpan Karyawan
      const empPayload = employees.map(e => ({
        id: e.id, name: e.name, username: e.username, telegram_id: e.telegramId,
        role: e.role, shift_id: e.shiftId, status: e.status, owner_email: userEmail
      }));
      if (empPayload.length > 0) await supabase.from('employees').upsert(empPayload);

      setSyncStatus('synced');
    } catch (err) {
      console.error("Push Error:", err);
      setSyncStatus('error');
    }
  }, [employees, botSettings, userEmail, isAuthenticated]);

  // Auto-Save Trigger
  useEffect(() => {
    if (isAuthenticated && botSettings.supabaseUrl) {
      const timer = setTimeout(() => pushToCloud(), 3000);
      return () => clearTimeout(timer);
    }
  }, [employees, botSettings, isAuthenticated, pushToCloud]);

  // Cek Sesi Saat Reload
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
  }, [pullAllFromCloud]);

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
      // Jika login di perangkat baru (samaran), minta kunci cloud
      setActivePage('cloud-init');
    }
  };

  const handleConnectCloud = (url: string, key: string) => {
    const cloudKeys = { supabaseUrl: url, supabaseKey: key };
    const storageKey = `zenith_cloud_key_${userEmail.replace(/[@.]/g, '_')}`;
    localStorage.setItem(storageKey, JSON.stringify(cloudKeys));
    setBotSettings(prev => ({ ...prev, ...cloudKeys }));
    pullAllFromCloud(userEmail, { ...botSettings, ...cloudKeys });
    setActivePage('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('zenith_active_session');
    setIsAuthenticated(false);
    setUserEmail('');
    setEmployees([]);
    setHistory([]);
  };

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  if (activePage === 'cloud-init') {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white/5 border border-white/10 p-12 rounded-[3.5rem] backdrop-blur-2xl shadow-2xl space-y-8 animate-in zoom-in duration-500">
           <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-amber-500 rounded-3xl mx-auto flex items-center justify-center shadow-xl shadow-amber-500/20">
                 <Lock className="text-white" size={32} />
              </div>
              <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">Kunci Cloud Dibutuhkan</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                Anda login di perangkat baru. Masukkan URL & Key Supabase Anda untuk memulihkan data akun <b>{userEmail}</b>.
              </p>
           </div>
           <form onSubmit={(e: any) => {
             e.preventDefault();
             handleConnectCloud(e.target.url.value, e.target.key.value);
           }} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Supabase Project URL</label>
                 <input name="url" required type="text" className="w-full bg-slate-900 border border-slate-800 text-white px-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none" placeholder="https://xyz.supabase.co" />
              </div>
              <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Supabase Anon Key</label>
                 <input name="key" required type="password" className="w-full bg-slate-900 border border-slate-800 text-white px-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none" placeholder="eyJhbG..." />
              </div>
              <button type="submit" className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-5 rounded-2xl uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3 transition-all">
                Hubungkan & Pulihkan Data <ArrowRight size={18} />
              </button>
           </form>
           <p className="text-center text-[9px] text-slate-500 font-bold uppercase tracking-widest">
             Data karyawan, bot token, dan riwayat akan muncul otomatis setelah kunci terhubung.
           </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fd]">
      <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={handleLogout} />
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <div className="bg-white px-12 py-4 border-b border-slate-200/60 flex justify-between items-center shadow-sm z-20">
           <div className="flex items-center gap-4">
              {syncStatus === 'syncing' ? (
                <div className="flex items-center gap-2 text-indigo-500 animate-pulse">
                   <Loader2 size={14} className="animate-spin" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Menyinkronkan...</span>
                </div>
              ) : syncStatus === 'synced' ? (
                <div className="flex items-center gap-2 text-emerald-500">
                   <ShieldCheck size={14} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Cloud Terhubung</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-rose-500">
                   <CloudOff size={14} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Error Sinkron</span>
                </div>
              )}
           </div>
           <div className="flex items-center gap-6">
              <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Akun Aktif</p>
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
            {activePage === 'koneksi' && <BotConnection settings={botSettings} setSettings={(s) => setBotSettings(s)} configs={configs} employees={employees} aliases={aliases} />}
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
