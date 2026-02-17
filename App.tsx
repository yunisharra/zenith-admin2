
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
  RefreshCw, DatabaseZap, CheckCircle2, XCircle, UploadCloud, DownloadCloud, 
  Database, ServerCrash, Code, Terminal, AlertTriangle
} from 'lucide-react';
import { MOCK_BOT_ALIASES, MOCK_LEAVE_CONFIGS, MOCK_SHIFTS } from './constants';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('zenith_active_session'));
  const [userEmail, setUserEmail] = useState<string>(() => localStorage.getItem('zenith_active_session') || '');
  const [cloudCreds, setCloudCreds] = useState<{url: string, key: string} | null>(() => {
    const email = localStorage.getItem('zenith_active_session');
    if (!email) return null;
    const vault = JSON.parse(localStorage.getItem('zenith_vault') || '[]');
    const user = vault.find((u: any) => u.email === email);
    return user ? { url: user.url, key: user.key } : null;
  });

  const [activePage, setActivePage] = useState<PageType>('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'init_required'>('synced');
  const [syncStep, setSyncStep] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });

  // --- STATE DATA ---
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>(MOCK_SHIFTS);
  const [history, setHistory] = useState<LeaveHistory[]>([]);
  const [configs, setConfigs] = useState<LeaveConfig[]>(MOCK_LEAVE_CONFIGS);
  const [aliases, setAliases] = useState<BotAlias[]>(MOCK_BOT_ALIASES);
  const [botSettings, setBotSettings] = useState<BotSettings>({
    botToken: '', groupId: '', botUsername: '@ZenithBot', isOnline: false, serverUrl: ''
  });

  const lastSyncHash = useRef<string>('');
  const hasInitialPullDone = useRef(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: null }), 3000);
  };

  const getSupabase = useCallback(() => {
    if (!cloudCreds) return null;
    return createClient(cloudCreds.url, cloudCreds.key);
  }, [cloudCreds]);

  // --- LOGIC: INISIALISASI TABEL OTOMATIS ---
  const initializeDatabase = async () => {
    const supabase = getSupabase();
    if (!supabase) return;

    setIsSyncing(true);
    setSyncStep('Menyiapkan Database...');
    
    // Karena client-side JS Supabase tidak bisa eksekusi SQL raw secara langsung 
    // untuk membuat tabel (harus via SQL Editor), kita arahkan user untuk klik satu tombol.
    // Tapi di sini kita set status agar UI menunjukkan instruksi.
    setSyncStatus('init_required');
    setIsSyncing(false);
  };

  const pullEverything = useCallback(async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) return;

    setIsSyncing(true);
    setSyncStatus('syncing');
    setSyncStep('Menarik Data Cloud...');

    try {
      // Ambil Profiles (Bot Settings)
      const { data: prof, error: pErr } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
      if (pErr && pErr.message.includes('relation')) {
        setSyncStatus('init_required');
        setIsSyncing(false);
        return;
      }

      if (prof) {
        setBotSettings(prev => ({
          ...prev,
          botToken: prof.bot_token || prev.botToken,
          botUsername: prof.bot_username || prev.botUsername,
        }));
      }

      // Ambil Employees
      const { data: emp } = await supabase.from('employees').select('*').eq('owner_email', email);
      if (emp && emp.length > 0) {
        setEmployees(emp.map((d: any) => ({
          id: d.id, name: d.name, username: d.username, telegramId: d.telegram_id,
          role: d.role, shiftId: d.shift_id, status: d.status
        })));
      }

      // Ambil Shifts
      const { data: shft } = await supabase.from('shifts').select('*').eq('owner_email', email);
      if (shft && shft.length > 0) {
        setShifts(shft.map((d: any) => ({
          id: d.id, name: d.name, startTime: d.start_time, endTime: d.end_time,
          category: d.category, description: d.description
        })));
      }

      // Ambil Configs
      const { data: cfgs } = await supabase.from('configs').select('*').eq('owner_email', email);
      if (cfgs && cfgs.length > 0) {
        setConfigs(cfgs.map((d: any) => ({
          type: d.type, maxMinutes: d.max_minutes, maxPerDay: d.max_per_day,
          responseTemplate: d.response_template, warningTemplate: d.warning_template
        })));
      }

      setSyncStatus('synced');
      hasInitialPullDone.current = true;
      setIsAppReady(true);
      setIsSyncing(false);
    } catch (err) {
      console.error(err);
      setSyncStatus('error');
      setIsSyncing(false);
    }
  }, [getSupabase]);

  const pushEverything = useCallback(async (isManual = false) => {
    const supabase = getSupabase();
    if (!supabase || syncStatus === 'init_required') return;

    setSyncStatus('syncing');
    if (isManual) {
      setIsSyncing(true);
      setSyncStep('Menyimpan ke Cloud...');
    }

    try {
      // Batch Upsert
      await supabase.from('profiles').upsert({
        email: userEmail,
        bot_token: botSettings.botToken,
        bot_username: botSettings.botUsername,
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' });

      if (employees.length > 0) {
        await supabase.from('employees').upsert(
          employees.map(e => ({
            id: e.id, name: e.name, username: e.username, telegram_id: e.telegramId,
            role: e.role, shift_id: e.shiftId, status: e.status, owner_email: userEmail
          })), { onConflict: 'id' }
        );
      }

      setSyncStatus('synced');
      lastSyncHash.current = JSON.stringify({ employees, shifts, configs });
      if (isManual) {
        showToast("Cloud Sinkron!", "success");
        setTimeout(() => setIsSyncing(false), 800);
      }
    } catch (err) {
      setSyncStatus('error');
      if (isManual) setIsSyncing(false);
    }
  }, [getSupabase, employees, shifts, configs, botSettings, userEmail, syncStatus]);

  useEffect(() => {
    if (isAuthenticated && !hasInitialPullDone.current) {
      pullEverything(userEmail);
    }
  }, [isAuthenticated, userEmail, pullEverything]);

  // Auto-Save
  useEffect(() => {
    if (!isAuthenticated || !hasInitialPullDone.current || !isAppReady) return;
    const currentHash = JSON.stringify({ employees, shifts, configs });
    if (currentHash === lastSyncHash.current) return;
    const timeout = setTimeout(() => pushEverything(false), 3000);
    return () => clearTimeout(timeout);
  }, [employees, shifts, configs, isAuthenticated, isAppReady, pushEverything]);

  const handleLogin = (email: string, url: string, key: string) => {
    setUserEmail(email);
    setCloudCreds({ url, key });
    setIsAuthenticated(true);
    localStorage.setItem('zenith_active_session', email);
    pullEverything(email);
  };

  const handleLogout = () => {
    localStorage.removeItem('zenith_active_session');
    setIsAuthenticated(false);
    window.location.reload();
  };

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;
  
  // Loader Inisialisasi Database
  if (!isAppReady && syncStatus !== 'init_required') {
    return (
      <div className="fixed inset-0 bg-[#020617] flex items-center justify-center">
        <div className="text-center space-y-6">
          <RefreshCw className="text-indigo-500 animate-spin mx-auto" size={48} />
          <p className="text-[10px] font-black text-white uppercase tracking-[0.4em]">{syncStep}</p>
        </div>
      </div>
    );
  }

  // UI Setup Database (Jika tabel belum ada)
  if (syncStatus === 'init_required') {
    return (
      <div className="fixed inset-0 bg-[#020617] flex items-center justify-center p-8">
        <div className="bg-white/5 border border-white/10 p-12 lg:p-20 rounded-[4rem] max-w-2xl w-full text-center space-y-10 backdrop-blur-3xl">
          <div className="w-24 h-24 bg-amber-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto border border-amber-500/30">
            <AlertTriangle className="text-amber-500" size={44} />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-white italic uppercase italic">Database Belum Siap</h2>
            <p className="text-slate-400 text-sm leading-relaxed">
              Koneksi ke Supabase berhasil, namun tabel-tabel Zenith belum ditemukan. 
              Silakan salin kode SQL di menu <b>Koneksi Server</b> dan jalankan di SQL Editor Supabase Anda.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => { setIsAppReady(true); setActivePage('koneksi'); }}
              className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest"
            >
              <Code size={18} /> Buka SQL Editor Sekarang
            </button>
            <button onClick={handleLogout} className="text-slate-500 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all">Ganti Akun Supabase</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#f8f9fd] font-sans">
      <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={handleLogout} />
      
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
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

        {/* Global Header */}
        <div className="bg-white px-12 py-5 border-b border-slate-200/60 flex justify-between items-center shadow-sm z-20">
           <div className="flex items-center gap-4">
              <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all duration-700 ${
                syncStatus === 'syncing' ? 'bg-indigo-50 border-indigo-200 text-indigo-500' : 
                'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-lg shadow-emerald-500/10'
              }`}>
                 {syncStatus === 'syncing' ? <RefreshCw size={14} className="animate-spin" /> : <Database size={14} />}
                 <span className="text-[10px] font-black uppercase tracking-widest">
                   {syncStatus === 'syncing' ? 'SYNCING...' : 'CLOUD SYNC ACTIVE'}
                 </span>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <button 
                onClick={() => pushEverything(true)}
                className="bg-[#0f172a] text-white px-8 py-3 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200"
              >
                <UploadCloud size={16} /> Force Sync
              </button>

              <div className="flex items-center gap-4 pl-6 border-l border-slate-100">
                 <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Account</p>
                    <p className="text-[12px] font-bold text-slate-800 mt-1.5">{userEmail}</p>
                 </div>
                 <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-sm font-black shadow-xl">
                    {userEmail.charAt(0).toUpperCase()}
                 </div>
              </div>
           </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <div className="max-w-[1500px] mx-auto">
            {activePage === 'dashboard' && <Dashboard employees={employees} history={history} shifts={shifts} setHistory={setHistory} configs={configs} />}
            {activePage === 'karyawan' && <Employees employees={employees} setEmployees={setEmployees} shifts={shifts} />}
            {activePage === 'shift' && <Shifts shifts={shifts} setShifts={setShifts} employees={employees} setEmployees={setEmployees} setHistory={setHistory} />}
            {activePage === 'histori' && <History history={history} setHistory={setHistory} />}
            {activePage === 'bot-intelligence' && <BotIntelligence aliases={aliases} setAliases={setAliases} />}
            {activePage === 'respon' && <Respon configs={configs} setConfigs={setConfigs} />}
            {activePage === 'koneksi' && <BotConnection settings={{...botSettings, supabaseUrl: cloudCreds?.url, supabaseKey: cloudCreds?.key}} setSettings={(s) => setBotSettings(s)} onForcePush={() => pushEverything(true)} onForcePull={() => pullEverything(userEmail)} configs={configs} employees={employees} aliases={aliases} />}
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
