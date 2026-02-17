
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
  RefreshCw, DatabaseZap, CheckCircle2, XCircle, UploadCloud, 
  Database, AlertTriangle, ExternalLink, Copy, Check
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
  const [sqlCopied, setSqlCopied] = useState(false);

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

  // Logika Tarik Data (Pull)
  const pullEverything = useCallback(async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) return;

    setIsSyncing(true);
    setSyncStatus('syncing');
    setSyncStep('Mengambil Data Cloud...');

    try {
      const { error: pErr, data: prof, status: pStatus } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
      
      if (pErr && (pErr.message.includes('relation') || pErr.code === '42P01' || pStatus === 400)) {
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

      const [{ data: emp }, { data: shft }, { data: cfgs }, { data: hist }] = await Promise.all([
        supabase.from('employees').select('*').eq('owner_email', email),
        supabase.from('shifts').select('*').eq('owner_email', email),
        supabase.from('configs').select('*').eq('owner_email', email),
        supabase.from('history').select('*').eq('owner_email', email)
      ]);

      // MAPPING DATA KE FORMAT STATE (camelCase)
      const mappedEmployees: Employee[] = (emp || []).map((d: any) => ({
        id: d.id, name: d.name, username: d.username, telegramId: d.telegram_id,
        role: d.role, shiftId: d.shift_id, status: d.status
      }));

      const mappedShifts: Shift[] = (shft || []).length > 0 ? shft.map((d: any) => ({
        id: d.id, name: d.name, startTime: d.start_time, endTime: d.end_time,
        category: d.category, description: d.description
      })) : MOCK_SHIFTS;

      const mappedConfigs: LeaveConfig[] = (cfgs || []).length > 0 ? cfgs.map((d: any) => ({
        type: d.type, maxMinutes: d.max_minutes, maxPerDay: d.max_per_day,
        responseTemplate: d.response_template, warningTemplate: d.warning_template
      })) : MOCK_LEAVE_CONFIGS;

      const mappedHistory: LeaveHistory[] = (hist || []).map((d: any) => ({
        id: d.id, employeeName: d.employee_name, type: d.type,
        timeOut: d.time_out, timeIn: d.time_in, date: d.date, status: d.status
      }));

      // UPDATE STATE
      setEmployees(mappedEmployees);
      setShifts(mappedShifts);
      setConfigs(mappedConfigs);
      setHistory(mappedHistory);

      // PENTING: Set Hash agar tidak terjadi auto-save loop saat startup
      lastSyncHash.current = JSON.stringify({ 
        employees: mappedEmployees, 
        shifts: mappedShifts, 
        configs: mappedConfigs,
        history: mappedHistory
      });

      setSyncStatus('synced');
      hasInitialPullDone.current = true;
      setIsAppReady(true);
      setIsSyncing(false);
    } catch (err) {
      console.error("Pull Error:", err);
      setSyncStatus('error');
      setIsSyncing(false);
    }
  }, [getSupabase]);

  // Logika Simpan Data (Push)
  const pushEverything = useCallback(async (isManual = false) => {
    const supabase = getSupabase();
    if (!supabase || syncStatus === 'init_required') return;

    setSyncStatus('syncing');
    if (isManual) {
      setIsSyncing(true);
      setSyncStep('Mengunggah ke Cloud...');
    }

    try {
      // 1. Simpan Profile
      await supabase.from('profiles').upsert({
        email: userEmail,
        bot_token: botSettings.botToken,
        bot_username: botSettings.botUsername,
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' });

      // 2. Simpan Karyawan
      if (employees.length > 0) {
        await supabase.from('employees').upsert(
          employees.map(e => ({
            id: e.id, name: e.name, username: e.username, telegram_id: e.telegramId,
            role: e.role, shift_id: e.shiftId, status: e.status, owner_email: userEmail
          })), { onConflict: 'id' }
        );
      }

      // 3. Simpan Shifts
      await supabase.from('shifts').upsert(
        shifts.map(s => ({
          id: s.id, name: s.name, start_time: s.startTime, end_time: s.endTime,
          category: s.category, description: s.description || '', owner_email: userEmail
        })), { onConflict: 'id' }
      );

      // 4. Simpan Configs
      await supabase.from('configs').upsert(
        configs.map(c => ({
          type: c.type, max_minutes: c.maxMinutes, max_per_day: c.maxPerDay,
          response_template: c.responseTemplate || '', warning_template: c.warningTemplate || '',
          owner_email: userEmail
        })), { onConflict: 'type,owner_email' }
      );

      // 5. Simpan History
      if (history.length > 0) {
        await supabase.from('history').upsert(
          history.map(h => ({
            id: h.id, employee_name: h.employeeName, type: h.type,
            time_out: h.timeOut, time_in: h.timeIn, date: h.date, 
            status: h.status, owner_email: userEmail
          })), { onConflict: 'id' }
        );
      }

      setSyncStatus('synced');
      lastSyncHash.current = JSON.stringify({ employees, shifts, configs, history });
      if (isManual) {
        showToast("Sinkronisasi Cloud Berhasil!", "success");
        setTimeout(() => setIsSyncing(false), 800);
      }
    } catch (err) {
      console.error("Push Error:", err);
      setSyncStatus('error');
      if (isManual) setIsSyncing(false);
    }
  }, [getSupabase, employees, shifts, configs, history, botSettings, userEmail, syncStatus]);

  useEffect(() => {
    if (isAuthenticated && !hasInitialPullDone.current) pullEverything(userEmail);
  }, [isAuthenticated, userEmail, pullEverything]);

  // Auto-Save Effect dengan pengamanan hash
  useEffect(() => {
    if (!isAuthenticated || !hasInitialPullDone.current || !isAppReady) return;
    
    const currentHash = JSON.stringify({ employees, shifts, configs, history });
    if (currentHash === lastSyncHash.current) return;

    const timeout = setTimeout(() => {
      pushEverything(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [employees, shifts, configs, history, isAuthenticated, isAppReady, pushEverything]);

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
  
  if (!isAppReady && syncStatus !== 'init_required') {
    return (
      <div className="fixed inset-0 bg-[#020617] flex flex-col items-center justify-center p-8">
         <RefreshCw className="text-indigo-500 animate-spin mb-6" size={48} />
         <p className="text-[10px] font-black text-white uppercase tracking-[0.5em]">{syncStep}</p>
      </div>
    );
  }

  if (syncStatus === 'init_required') {
    const sqlScript = `CREATE TABLE IF NOT EXISTS profiles (email TEXT PRIMARY KEY, bot_token TEXT, bot_username TEXT, updated_at TIMESTAMP WITH TIME ZONE);
CREATE TABLE IF NOT EXISTS employees (id TEXT PRIMARY KEY, name TEXT, username TEXT, telegram_id TEXT, role TEXT, shift_id TEXT, status TEXT, owner_email TEXT);
CREATE TABLE IF NOT EXISTS shifts (id TEXT PRIMARY KEY, name TEXT, start_time TEXT, end_time TEXT, category TEXT, description TEXT, owner_email TEXT);
CREATE TABLE IF NOT EXISTS configs (type TEXT, max_minutes INTEGER, max_per_day INTEGER, response_template TEXT, warning_template TEXT, owner_email TEXT, PRIMARY KEY (type, owner_email));
CREATE TABLE IF NOT EXISTS history (id TEXT PRIMARY KEY, employee_name TEXT, type TEXT, time_out TEXT, time_in TEXT, date TEXT, status TEXT, owner_email TEXT);`;

    return (
      <div className="fixed inset-0 bg-[#020617] flex items-center justify-center p-6 z-[9999]">
        <div className="bg-white rounded-[4rem] max-w-2xl w-full p-12 lg:p-16 shadow-2xl space-y-10 text-center relative overflow-hidden">
          <div className="w-24 h-24 bg-amber-50 rounded-[2.5rem] flex items-center justify-center mx-auto border border-amber-100">
             <AlertTriangle className="text-amber-500" size={48} />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-slate-900 italic uppercase">Database Belum Siap</h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">
              Tabel database belum lengkap. Salin script di bawah dan jalankan di SQL Editor Supabase Anda agar sinkronisasi bisa berjalan.
            </p>
          </div>
          <div className="grid gap-4">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(sqlScript);
                setSqlCopied(true);
                setTimeout(() => setSqlCopied(false), 3000);
              }}
              className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest transition-all ${
                sqlCopied ? 'bg-emerald-600 text-white' : 'bg-[#0f172a] text-white hover:bg-black'
              }`}
            >
              {sqlCopied ? <Check size={20} /> : <Copy size={20} />}
              {sqlCopied ? 'SQL DISALIN!' : 'SALIN SCRIPT SQL'}
            </button>
            <a 
              href={`${cloudCreds?.url.replace('.supabase.co', '')}/project/_/sql`} 
              target="_blank" 
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-200"
            >
              BUKA SQL EDITOR SUPABASE <ExternalLink size={20} />
            </a>
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
          <div className="fixed top-12 right-12 z-[1000] animate-in slide-in-from-right-10">
             <div className={`px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border ${
               toast.type === 'success' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-rose-600 border-rose-400 text-white'
             }`}>
                {toast.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                <p className="text-[10px] font-black uppercase tracking-widest">{toast.message}</p>
             </div>
          </div>
        )}

        <div className="bg-white px-12 py-5 border-b border-slate-200/60 flex justify-between items-center shadow-sm z-20">
           <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all ${
              syncStatus === 'syncing' ? 'bg-indigo-50 border-indigo-200 text-indigo-500' : 
              'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-md shadow-emerald-500/10'
           }`}>
              {syncStatus === 'syncing' ? <RefreshCw size={14} className="animate-spin" /> : <Database size={14} />}
              <span className="text-[10px] font-black uppercase tracking-widest">
                {syncStatus === 'syncing' ? 'SYNCING...' : 'CLOUD SYNC ACTIVE'}
              </span>
           </div>
           
           <div className="flex items-center gap-6">
              <button 
                onClick={() => pushEverything(true)}
                className="bg-[#0f172a] text-white px-8 py-3 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200"
              >
                <UploadCloud size={16} /> Save to Cloud
              </button>
              <div className="flex items-center gap-4 pl-6 border-l border-slate-100">
                 <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Admin Session</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">{userEmail}</p>
                 </div>
                 <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-sm font-black shadow-lg">
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
            {activePage === 'koneksi' && <BotConnection settings={{...botSettings, supabaseUrl: cloudCreds?.url, supabaseKey: cloudCreds?.key}} setSettings={setBotSettings} onForcePush={() => pushEverything(true)} onForcePull={() => pullEverything(userEmail)} configs={configs} employees={employees} aliases={aliases} />}
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
