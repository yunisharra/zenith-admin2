
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
import { ShieldCheck, RefreshCw, AlertTriangle, Cloud, Loader2, DatabaseZap, CheckCircle2, XCircle } from 'lucide-react';
import { MOCK_BOT_ALIASES, MOCK_LEAVE_CONFIGS, MOCK_SHIFTS } from './constants';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('zenith_active_session'));
  const [userEmail, setUserEmail] = useState<string>(() => localStorage.getItem('zenith_active_session') || '');
  const [activePage, setActivePage] = useState<PageType>('dashboard');
  
  // SYNC STATES
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | null }>({ message: '', type: null });
  
  const hasPulledOnce = useRef(false);
  const lastPushedDataRef = useRef<string>('');
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- STATE DATA ---
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [shifts, setShifts] = useState<Shift[]>(MOCK_SHIFTS);
  const [history, setHistory] = useState<LeaveHistory[]>([]);
  const [configs, setConfigs] = useState<LeaveConfig[]>(MOCK_LEAVE_CONFIGS);
  const [aliases, setAliases] = useState<BotAlias[]>(MOCK_BOT_ALIASES);
  const [botSettings, setBotSettings] = useState<BotSettings>({
    botToken: '', groupId: '', botUsername: '@ZenithBot', isOnline: false, serverUrl: '', supabaseUrl: '', supabaseKey: ''
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: null }), 4000);
  };

  const getSupabase = (url?: string, key?: string) => {
    const sUrl = url || botSettings.supabaseUrl || localStorage.getItem(`zenith_cloud_url_${userEmail.replace(/[@.]/g, '_')}`);
    const sKey = key || botSettings.supabaseKey || localStorage.getItem(`zenith_cloud_key_${userEmail.replace(/[@.]/g, '_')}`);
    if (!sUrl || !sKey) return null;
    return createClient(sUrl, sKey);
  };

  const pullEverything = useCallback(async (email: string, targetUrl?: string, targetKey?: string) => {
    const supabase = getSupabase(targetUrl, targetKey);
    if (!supabase) {
      showToast("Gagal: URL/Key Cloud tidak ditemukan.", "error");
      return;
    }

    setIsSyncing(true);
    setSyncMessage('Menghubungkan ke Cloud Vault...');
    setSyncStatus('syncing');

    try {
      setSyncMessage('Mengunduh Profil & Settings...');
      const { data: prof } = await supabase.from('profiles').select('*').eq('email', email).maybeSingle();
      if (prof) {
        setBotSettings(prev => ({
          ...prev,
          botToken: prof.bot_token || prev.botToken,
          botUsername: prof.bot_username || prev.botUsername,
          supabaseUrl: targetUrl || prev.supabaseUrl,
          supabaseKey: targetKey || prev.supabaseKey
        }));
      }

      setSyncMessage('Sinkronisasi Data Karyawan...');
      const { data: emp } = await supabase.from('employees').select('*').eq('owner_email', email);
      if (emp) {
        setEmployees(emp.map(d => ({
          id: d.id, name: d.name, username: d.username, telegramId: d.telegram_id,
          role: d.role, shiftId: d.shift_id, status: d.status
        })));
      }

      setSyncMessage('Membangun Jadwal Operasional...');
      const { data: shft } = await supabase.from('shifts').select('*').eq('owner_email', email);
      if (shft && shft.length > 0) {
        setShifts(shft.map(d => ({
          id: d.id, name: d.name, startTime: d.start_time, endTime: d.end_time,
          category: d.category, description: d.description
        })));
      }

      setSyncMessage('Memvalidasi Limit & Respon...');
      const { data: cfgs } = await supabase.from('configs').select('*').eq('owner_email', email);
      if (cfgs && cfgs.length > 0) {
        setConfigs(cfgs.map(d => ({
          type: d.type, maxMinutes: d.max_minutes, maxPerDay: d.max_per_day,
          responseTemplate: d.response_template, warningTemplate: d.warning_template
        })));
      }

      hasPulledOnce.current = true;
      setSyncStatus('synced');
      setSyncMessage('Sinkronisasi Berhasil!');
      showToast("Data Berhasil Ditarik dari Cloud!", "success");
      setTimeout(() => setIsSyncing(false), 800);
      lastPushedDataRef.current = JSON.stringify({ employees, shifts, configs });
    } catch (err) {
      console.error("Pull failed:", err);
      setSyncStatus('error');
      showToast("Gagal menarik data. Cek koneksi Supabase.", "error");
      setIsSyncing(false);
    }
  }, [employees, shifts, configs]);

  const syncAllToCloud = useCallback(async (manual = false) => {
    if (!hasPulledOnce.current || (isSyncing && !manual) || !isAuthenticated) return;

    const currentDataState = JSON.stringify({ employees, shifts, configs });
    if (!manual && currentDataState === lastPushedDataRef.current) return; 

    const supabase = getSupabase();
    if (!supabase) return;

    if (manual) {
        setIsSyncing(true);
        setSyncMessage('Mengirim data ke Cloud...');
    }
    setSyncStatus('syncing');

    try {
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

      await supabase.from('shifts').upsert(
        shifts.map(s => ({
          id: s.id, name: s.name, start_time: s.startTime, end_time: s.endTime,
          category: s.category, description: s.description, owner_email: userEmail
        })), { onConflict: 'id' }
      );

      await supabase.from('configs').upsert(
        configs.map(c => ({
          type: c.type, max_minutes: c.maxMinutes, max_per_day: c.maxPerDay,
          response_template: c.responseTemplate, warning_template: c.warningTemplate, owner_email: userEmail
        })), { onConflict: 'type,owner_email' }
      );

      lastPushedDataRef.current = currentDataState;
      setSyncStatus('synced');
      if (manual) {
        setSyncMessage('Penyimpanan Selesai!');
        showToast("Data Cloud Berhasil Diperbarui!", "success");
        setTimeout(() => setIsSyncing(false), 1000);
      }
    } catch (err) {
      console.error("Push failed:", err);
      setSyncStatus('error');
      showToast("Gagal menyimpan data ke Cloud.", "error");
      setIsSyncing(false);
    }
  }, [employees, shifts, configs, botSettings, userEmail, isAuthenticated, isSyncing]);

  useEffect(() => {
    if (!hasPulledOnce.current) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => syncAllToCloud(), 10000); // Auto-sync lebih santai (10 detik)
    return () => { if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current); };
  }, [employees, shifts, configs, botSettings, syncAllToCloud]);

  const handleLogin = (email: string, cloudUrl?: string, cloudKey?: string) => {
    setUserEmail(email);
    setIsAuthenticated(true);
    localStorage.setItem('zenith_active_session', email);
    
    if (cloudUrl && cloudKey) {
      localStorage.setItem(`zenith_cloud_url_${email.replace(/[@.]/g, '_')}`, cloudUrl);
      localStorage.setItem(`zenith_cloud_key_${email.replace(/[@.]/g, '_')}`, cloudKey);
      setBotSettings(prev => ({ ...prev, supabaseUrl: cloudUrl, supabaseKey: cloudKey }));
      pullEverything(email, cloudUrl, cloudKey);
    } else {
      const savedUrl = localStorage.getItem(`zenith_cloud_url_${email.replace(/[@.]/g, '_')}`);
      const savedKey = localStorage.getItem(`zenith_cloud_key_${email.replace(/[@.]/g, '_')}`);
      if (savedUrl && savedKey) {
        setBotSettings(prev => ({ ...prev, supabaseUrl: savedUrl, supabaseKey: savedKey }));
        pullEverything(email, savedUrl, savedKey);
      } else {
        hasPulledOnce.current = true;
        setActivePage('koneksi');
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('zenith_active_session');
    setIsAuthenticated(false);
    window.location.reload();
  };

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  return (
    <div className="flex min-h-screen bg-[#f8f9fd] font-sans">
      <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={handleLogout} />
      
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        
        {/* --- GLOBAL TOAST NOTIFICATION --- */}
        {toast.type && (
          <div className="fixed top-8 right-8 z-[1000] animate-in slide-in-from-right-10 duration-500">
             <div className={`px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-4 border ${
               toast.type === 'success' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-rose-600 border-rose-400 text-white'
             }`}>
                {toast.type === 'success' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                <div>
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Sistem Zenith</p>
                   <p className="text-sm font-black italic">{toast.message}</p>
                </div>
             </div>
          </div>
        )}

        {/* --- REFINED GLOBAL SYNC OVERLAY --- */}
        {isSyncing && (
          <div className="fixed inset-0 bg-[#020617]/90 backdrop-blur-3xl z-[999] flex flex-col items-center justify-center animate-in fade-in duration-500">
             <div className="bg-white p-16 rounded-[4rem] shadow-2xl flex flex-col items-center gap-10 max-w-sm w-full border border-white/20">
                <div className="relative">
                   <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20" />
                   <div className="relative w-28 h-28 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl">
                      <DatabaseZap size={48} className="text-white animate-bounce" />
                   </div>
                </div>
                <div className="text-center space-y-6">
                   <div className="space-y-2">
                      <h3 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">Sync Active</h3>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.3em]">{syncMessage}</p>
                   </div>
                   <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 animate-progress" />
                   </div>
                </div>
             </div>
          </div>
        )}

        <div className="bg-white px-12 py-5 border-b border-slate-200/60 flex justify-between items-center shadow-sm z-20">
           <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all duration-700 ${
                syncStatus === 'syncing' ? 'bg-indigo-50 border-indigo-200 text-indigo-500 animate-pulse' : 
                syncStatus === 'error' ? 'bg-rose-50 border-rose-200 text-rose-500' : 
                'bg-emerald-50 border-emerald-200 text-emerald-600 shadow-lg shadow-emerald-500/10'
              }`}>
                 {syncStatus === 'syncing' ? <RefreshCw size={14} className="animate-spin" /> : syncStatus === 'error' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                 <span className="text-[10px] font-black uppercase tracking-widest">
                   {syncStatus === 'syncing' ? 'DATABASE SYNCING...' : syncStatus === 'error' ? 'CLOUD DISCONNECTED' : 'VAULT SECURED'}
                 </span>
              </div>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Administrator Account</p>
                  <p className="text-[12px] font-bold text-slate-800 mt-1.5">{userEmail}</p>
              </div>
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-sm font-black shadow-xl">
                  {userEmail.charAt(0).toUpperCase()}
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
            {activePage === 'koneksi' && <BotConnection settings={botSettings} setSettings={setBotSettings} onForcePush={() => syncAllToCloud(true)} onForcePull={() => pullEverything(userEmail)} configs={configs} employees={employees} aliases={aliases} />}
            {activePage === 'simulator' && <Simulator employees={employees} shifts={shifts} history={history} setHistory={setHistory} configs={configs} aliases={aliases} botSettings={botSettings} />}
            {activePage === 'deployment' && <Deployment />}
            {activePage === 'pengaturan' && <Settings configs={configs} setConfigs={setConfigs} userEmail={userEmail} />}
          </div>
        </div>
      </main>
      
      <style>{`
        @keyframes progress {
          0% { width: 0%; transform: translateX(0); }
          50% { width: 70%; }
          100% { width: 100%; transform: translateX(0); }
        }
        .animate-progress {
          animation: progress 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default App;
