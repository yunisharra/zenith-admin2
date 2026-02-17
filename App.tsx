
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import { PageType, Employee, Shift, LeaveHistory, BotAlias, LeaveConfig, BotSettings, Message } from './types';
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
import { processBotLogicStream } from './services/geminiService';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('zenith_active_session'));
  const [userEmail, setUserEmail] = useState<string>(() => (localStorage.getItem('zenith_active_session') || '').toLowerCase().trim());
  const [cloudCreds, setCloudCreds] = useState<{url: string, key: string} | null>(() => {
    const email = localStorage.getItem('zenith_active_session');
    if (!email) return null;
    const vault = JSON.parse(localStorage.getItem('zenith_vault') || '[]');
    const user = vault.find((u: any) => u.email.toLowerCase().trim() === email.toLowerCase().trim());
    return user ? { url: user.url, key: user.key } : null;
  });

  const [activePage, setActivePage] = useState<PageType>('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'init_required'>('synced');
  const [syncStep, setSyncStep] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });
  const [sqlCopied, setSqlCopied] = useState(false);

  const [isBridgeActive, setIsBridgeActive] = useState(() => localStorage.getItem('zenith_bridge_active') === 'true');
  const [simulatorMessages, setSimulatorMessages] = useState<Message[]>([
    { id: '1', sender: 'bot', text: 'Halo! Saya Zenith Bot. Sistem Bridge Global Aktif.', timestamp: new Date() }
  ]);

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
  const lastUpdateId = useRef(0);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: null }), 5000);
  };

  const getSupabase = useCallback(() => {
    if (!cloudCreds) return null;
    return createClient(cloudCreds.url, cloudCreds.key);
  }, [cloudCreds]);

  // LIVE TELEGRAM BRIDGE ENGINE (GLOBAL + CONFLICT DETECTION)
  useEffect(() => {
    let interval: any;
    if (isBridgeActive && botSettings.botToken && isAuthenticated) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`https://api.telegram.org/bot${botSettings.botToken}/getUpdates?offset=${lastUpdateId.current + 1}&timeout=10`);
          const data = await res.json();
          if (data.ok && data.result.length > 0) {
            for (const update of data.result) {
              lastUpdateId.current = update.update_id;
              if (update.message && update.message.text) {
                const chatId = update.message.chat.id;
                const userTextRaw = update.message.text;
                const userText = userTextRaw.toLowerCase();
                const username = update.message.from.username ? `@${update.message.from.username}` : "Anonymous";
                
                const employee = employees.find(e => e.username.toLowerCase() === username.toLowerCase());
                
                let categoryFound: any = null;
                for (const alias of aliases) {
                  if (alias.keywords.some(k => userText.includes(k.toLowerCase()))) {
                    categoryFound = alias.category;
                    break;
                  }
                }

                const isReturning = userText.includes("masuk") || userText.includes("kembali") || userText.includes("done") || userText.includes("sudah");
                let conflictInfo = null;

                if (employee) {
                  const now = new Date();
                  const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
                  const dateStr = now.toISOString().split('T')[0];

                  const activeLeave = history.find(h => h.employeeName === employee.name && h.timeIn === '--');

                  if (isReturning) {
                    if (activeLeave) {
                      const config = configs.find(c => c.type === activeLeave.type);
                      const [hOut, mOut] = activeLeave.timeOut.split(':').map(Number);
                      const duration = (now.getHours() * 60 + now.getMinutes()) - (hOut * 60 + mOut);
                      const isLate = config ? duration > config.maxMinutes : false;

                      setHistory(prev => prev.map(h => h.id === activeLeave.id ? {
                        ...h, timeIn: timeStr, status: isLate ? 'Telat' : 'Tepat'
                      } : h));
                    }
                  } else if (categoryFound) {
                    if (activeLeave) {
                      // DETEKSI KONFLIK: Karyawan masih punya izin yang belum selesai
                      conflictInfo = `Masih dalam status izin ${activeLeave.type}. Selesaikan itu dulu dengan mengetik 'masuk'.`;
                    } else {
                      const newLog: LeaveHistory = {
                        id: `tg-${update.update_id}`,
                        employeeName: employee.name,
                        type: categoryFound,
                        timeOut: timeStr,
                        timeIn: '--',
                        date: dateStr,
                        status: 'Tepat'
                      };
                      setHistory(prev => [newLog, ...prev]);
                    }
                  }
                }

                setSimulatorMessages(prev => [...prev, { id: `tg-${update.update_id}`, sender: 'user', text: `[TG: ${username}] ${userTextRaw}`, timestamp: new Date() }]);
                
                let aiReply = "";
                // Kirim conflictInfo ke AI agar AI bisa memberikan balasan peringatan
                await processBotLogicStream(userTextRaw, { employees, shifts, history, configs, aliases }, (chunk) => { aiReply += chunk; }, username, conflictInfo);
                
                await fetch(`https://api.telegram.org/bot${botSettings.botToken}/sendMessage`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ chat_id: chatId, text: aiReply })
                });

                setSimulatorMessages(prev => [...prev, { id: `ai-${update.update_id}`, sender: 'bot', text: aiReply, timestamp: new Date() }]);
              }
            }
          }
        } catch (e) {
          console.error("Bridge Error:", e);
        }
      }, 3500); 
    }
    return () => clearInterval(interval);
  }, [isBridgeActive, botSettings.botToken, employees, shifts, history, configs, aliases, isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('zenith_bridge_active', isBridgeActive.toString());
  }, [isBridgeActive]);

  const pullEverything = useCallback(async (email: string) => {
    const supabase = getSupabase();
    if (!supabase) return;

    setIsSyncing(true);
    setSyncStatus('syncing');
    setSyncStep('Sinkronisasi Awal...');

    try {
      const { error: pErr, data: prof, status: pStatus } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
      
      if (pErr && (pErr.message.includes('relation') || pErr.code === '42P01' || pStatus === 400)) {
        setSyncStatus('init_required');
        setIsSyncing(false);
        return;
      }

      const [{ data: emp }, { data: shft }, { data: cfgs }, { data: hist }] = await Promise.all([
        supabase.from('employees').select('*').eq('owner_email', email),
        supabase.from('shifts').select('*').eq('owner_email', email),
        supabase.from('configs').select('*').eq('owner_email', email),
        supabase.from('history').select('*').eq('owner_email', email)
      ]);

      if (prof) {
        setBotSettings(prev => ({
          ...prev,
          botToken: prof.bot_token || prev.botToken,
          botUsername: prof.bot_username || prev.botUsername,
        }));
      }

      const mappedEmployees: Employee[] = (emp || []).map((d: any) => ({
        id: d.id, name: d.name, username: d.username, telegramId: d.telegram_id,
        role: d.role, shiftId: d.shift_id, status: d.status
      }));

      const mappedShifts: Shift[] = (shft || []).length > 0 ? shft.map((d: any) => ({
        id: d.id, name: d.name, startTime: d.start_time, endTime: d.end_time,
        category: d.category, description: d.description
      })) : MOCK_SHIFTS;

      // Fix: Change warning_template to warningTemplate to match LeaveConfig interface
      const mappedConfigs: LeaveConfig[] = (cfgs || []).length > 0 ? cfgs.map((d: any) => ({
        type: d.type, maxMinutes: d.max_minutes, maxPerDay: d.max_per_day,
        responseTemplate: d.response_template, warningTemplate: d.warning_template
      })) : MOCK_LEAVE_CONFIGS;

      // Fix: Change time_in to timeIn to match LeaveHistory interface (Addressing: Property 'timeIn' is missing in type...)
      const mappedHistory: LeaveHistory[] = (hist || []).map((d: any) => ({
        id: d.id, employeeName: d.employee_name, type: d.type,
        timeOut: d.time_out, timeIn: d.time_in, date: d.date, status: d.status
      }));

      setEmployees(mappedEmployees);
      setShifts(mappedShifts);
      setConfigs(mappedConfigs);
      setHistory(mappedHistory);

      lastSyncHash.current = JSON.stringify({ employees: mappedEmployees, shifts: mappedShifts, configs: mappedConfigs, history: mappedHistory });
      hasInitialPullDone.current = true;
      setIsAppReady(true);
      setSyncStatus('synced');
      setIsSyncing(false);
    } catch (err: any) {
      console.error("Critical Pull Error:", err);
      if (err.message?.includes('owner_email')) {
        setSyncStatus('init_required');
      } else {
        setSyncStatus('error');
      }
      setIsSyncing(false);
    }
  }, [getSupabase]);

  const pushEverything = useCallback(async (isManual = false) => {
    const supabase = getSupabase();
    if (!supabase || syncStatus === 'init_required') return;

    if (isManual) {
      setIsSyncing(true);
      setSyncStatus('syncing');
      setSyncStep('Menyimpan Data...');
    }

    try {
      const uniqueEmployees = Array.from(new Map(employees.map(e => [e.id, e])).values());
      const uniqueShifts = Array.from(new Map(shifts.map(s => [s.id, s])).values());
      const uniqueConfigs = Array.from(new Map(configs.map(c => [c.type, c])).values());
      const uniqueHistory = Array.from(new Map(history.map(h => [h.id, h])).values());

      const { error: profErr } = await supabase.from('profiles').upsert({
        email: userEmail,
        bot_token: botSettings.botToken,
        bot_username: botSettings.botUsername,
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' });
      if (profErr) throw profErr;

      const { error: empErr } = await supabase.from('employees').upsert(
        uniqueEmployees.map(e => ({
          id: e.id, name: e.name, username: e.username, telegram_id: e.telegramId,
          role: e.role, shift_id: e.shiftId, status: e.status, owner_email: userEmail
        })), { onConflict: 'id' }
      );
      if (empErr) throw empErr;

      const { error: shftErr } = await supabase.from('shifts').upsert(
        uniqueShifts.map(s => ({
          id: s.id, name: s.name, start_time: s.startTime, end_time: s.endTime,
          category: s.category, description: s.description || '', owner_email: userEmail
        })), { onConflict: 'id' }
      );
      if (shftErr) throw shftErr;

      const { error: cfgErr } = await supabase.from('configs').upsert(
        uniqueConfigs.map(c => ({
          type: c.type, max_minutes: c.maxMinutes, max_per_day: c.maxPerDay,
          response_template: c.responseTemplate || '', warning_template: c.warningTemplate || '',
          owner_email: userEmail
        })), { onConflict: 'type,owner_email' }
      );
      if (cfgErr) throw cfgErr;

      if (uniqueHistory.length > 0) {
        const { error: histErr } = await supabase.from('history').upsert(
          uniqueHistory.map(h => ({
            id: h.id, employee_name: h.employeeName, type: h.type,
            time_out: h.timeOut, time_in: h.timeIn, date: h.date, 
            status: h.status, owner_email: userEmail
          })), { onConflict: 'id' }
        );
        if (histErr) throw histErr;
      }

      setSyncStatus('synced');
      lastSyncHash.current = JSON.stringify({ employees: uniqueEmployees, shifts: uniqueShifts, configs: uniqueConfigs, history: uniqueHistory });
      if (isManual) showToast("Cloud Sync Sempurna!", "success");
      setIsSyncing(false);
    } catch (err: any) {
      console.error("Sync Failure:", err);
      const msg = err.message || "";
      if (msg.includes('owner_email') || msg.includes('column')) {
        setSyncStatus('init_required');
      } else {
        showToast(`Sync Error: ${msg}`, "error");
        setSyncStatus('error');
      }
      setIsSyncing(false);
    }
  }, [getSupabase, employees, shifts, configs, history, botSettings, userEmail, syncStatus]);

  useEffect(() => {
    if (isAuthenticated && !hasInitialPullDone.current) pullEverything(userEmail);
  }, [isAuthenticated, userEmail, pullEverything]);

  useEffect(() => {
    if (!isAuthenticated || !hasInitialPullDone.current || !isAppReady) return;
    const currentHash = JSON.stringify({ employees, shifts, configs, history });
    if (currentHash === lastSyncHash.current) return;
    const timeout = setTimeout(() => pushEverything(false), 3000);
    return () => clearTimeout(timeout);
  }, [employees, shifts, configs, history, isAuthenticated, isAppReady, pushEverything]);

  const handleLogin = (email: string, url: string, key: string) => {
    const cleanEmail = email.toLowerCase().trim();
    setUserEmail(cleanEmail);
    setCloudCreds({ url, key });
    setIsAuthenticated(true);
    localStorage.setItem('zenith_active_session', cleanEmail);
    pullEverything(cleanEmail);
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
    const fixSql = `-- SQL FIX SCRIPT --
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS owner_email TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS owner_email TEXT;
ALTER TABLE shifts ADD COLUMN IF NOT EXISTS owner_email TEXT;
ALTER TABLE configs ADD COLUMN IF NOT EXISTS owner_email TEXT;
ALTER TABLE history ADD COLUMN IF NOT EXISTS owner_email TEXT;
CREATE TABLE IF NOT EXISTS profiles (email TEXT PRIMARY KEY, bot_token TEXT, bot_username TEXT, updated_at TIMESTAMP WITH TIME ZONE, owner_email TEXT);
CREATE TABLE IF NOT EXISTS employees (id TEXT PRIMARY KEY, name TEXT, username TEXT, telegram_id TEXT, role TEXT, shift_id TEXT, status TEXT, owner_email TEXT);
CREATE TABLE IF NOT EXISTS shifts (id TEXT PRIMARY KEY, name TEXT, start_time TEXT, end_time TEXT, category TEXT, description TEXT, owner_email TEXT);
CREATE TABLE IF NOT EXISTS configs (type TEXT, max_minutes INTEGER, max_per_day INTEGER, response_template TEXT, warning_template TEXT, owner_email TEXT, PRIMARY KEY (type, owner_email));
CREATE TABLE IF NOT EXISTS history (id TEXT PRIMARY KEY, employee_name TEXT, type TEXT, time_out TEXT, time_in TEXT, date TEXT, status TEXT, owner_email TEXT);
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE shifts DISABLE ROW LEVEL SECURITY;
ALTER TABLE configs DISABLE ROW LEVEL SECURITY;
ALTER TABLE history DISABLE ROW LEVEL SECURITY;`;

    return (
      <div className="fixed inset-0 bg-[#020617] flex items-center justify-center p-6 z-[9999]">
        <div className="bg-white rounded-[4rem] max-w-2xl w-full p-12 shadow-2xl space-y-10 text-center relative overflow-hidden">
          <div className="w-24 h-24 bg-rose-50 rounded-[2.5rem] flex items-center justify-center mx-auto border border-rose-100">
             <AlertTriangle className="text-rose-500" size={48} />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black text-slate-900 italic uppercase">Pembaruan Database</h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">Harap jalankan script perbaikan SQL di dashboard Supabase Anda.</p>
          </div>
          <div className="grid gap-4">
            <button onClick={() => { navigator.clipboard.writeText(fixSql); setSqlCopied(true); setTimeout(() => setSqlCopied(false), 3000); }} className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase transition-all ${sqlCopied ? 'bg-emerald-600 text-white' : 'bg-[#0f172a] text-white hover:bg-black'}`}>
              {sqlCopied ? <Check size={20} /> : <Copy size={20} />} {sqlCopied ? 'DISALIN!' : 'SALIN SCRIPT SQL'}
            </button>
            <a href={`${cloudCreds?.url.replace('.supabase.co', '')}/project/_/sql`} target="_blank" className="w-full bg-indigo-600 text-white py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-200">
              BUKA SQL EDITOR <ExternalLink size={20} />
            </a>
            <button onClick={() => window.location.reload()} className="mt-4 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 flex items-center justify-center gap-2">
              <RefreshCw size={14} /> Muat Ulang Aplikasi
            </button>
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
             <div className={`px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-4 border ${toast.type === 'success' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-rose-600 border-rose-400 text-white'}`}>
                {toast.type === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                <p className="text-[10px] font-black uppercase tracking-widest">{toast.message}</p>
             </div>
          </div>
        )}
        <div className="bg-white px-12 py-5 border-b border-slate-200/60 flex justify-between items-center shadow-sm z-20">
           <div className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border transition-all ${syncStatus === 'syncing' ? 'bg-indigo-50 border-indigo-200 text-indigo-500' : syncStatus === 'error' ? 'bg-rose-50 border-rose-200 text-rose-500' : 'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-md shadow-emerald-500/10'}`}>
              {syncStatus === 'syncing' ? <RefreshCw size={14} className="animate-spin" /> : syncStatus === 'error' ? <AlertTriangle size={14} /> : <Database size={14} />}
              <span className="text-[10px] font-black uppercase tracking-widest">{syncStatus === 'syncing' ? 'SYNCING...' : syncStatus === 'error' ? 'SYNC ERROR' : 'CLOUD SYNC ACTIVE'}</span>
           </div>
           <div className="flex items-center gap-6">
              {isBridgeActive && <div className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest animate-pulse"><RefreshCw size={12} className="animate-spin" /> Bridge Active</div>}
              <button onClick={() => pushEverything(true)} className="bg-[#0f172a] text-white px-8 py-3 rounded-2xl flex items-center gap-3 text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-200"><UploadCloud size={16} /> Save to Cloud</button>
              <div className="flex items-center gap-4 pl-6 border-l border-slate-100"><div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Admin Session</p><p className="text-sm font-bold text-slate-800 mt-1">{userEmail}</p></div><div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-sm font-black shadow-lg">{userEmail.charAt(0).toUpperCase()}</div></div>
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
            {activePage === 'simulator' && <Simulator employees={employees} shifts={shifts} history={history} setHistory={setHistory} configs={configs} aliases={aliases} botSettings={botSettings} messages={simulatorMessages} setMessages={setSimulatorMessages} isBridgeActive={isBridgeActive} setIsBridgeActive={setIsBridgeActive} />}
            {activePage === 'deployment' && <Deployment />}
            {activePage === 'pengaturan' && <Settings configs={configs} setConfigs={setConfigs} userEmail={userEmail} />}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
