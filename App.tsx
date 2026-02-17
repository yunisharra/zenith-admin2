
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
import { ShieldCheck, RefreshCw, AlertTriangle, Cloud, Loader2, DatabaseZap, CheckCircle2 } from 'lucide-react';
import { MOCK_BOT_ALIASES, MOCK_LEAVE_CONFIGS, MOCK_SHIFTS } from './constants';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!localStorage.getItem('zenith_active_session'));
  const [userEmail, setUserEmail] = useState<string>(() => localStorage.getItem('zenith_active_session') || '');
  const [activePage, setActivePage] = useState<PageType>('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');
  
  // LOGS & REFS
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

  // Helper untuk mendapatkan client Supabase yang valid
  const getSupabase = (url?: string, key?: string) => {
    const sUrl = url || botSettings.supabaseUrl || localStorage.getItem(`zenith_cloud_url_${userEmail.replace(/[@.]/g, '_')}`);
    const sKey = key || botSettings.supabaseKey || localStorage.getItem(`zenith_cloud_key_${userEmail.replace(/[@.]/g, '_')}`);
    if (!sUrl || !sKey) return null;
    return createClient(sUrl, sKey);
  };

  // --- LOGIKA TARIK DATA (PULL) ---
  const pullEverything = useCallback(async (email: string, targetUrl?: string, targetKey?: string) => {
    const supabase = getSupabase(targetUrl, targetKey);
    if (!supabase) {
      console.error("Supabase client not initialized for pull");
      return;
    }

    setIsSyncing(true);
    setSyncMessage('Menghubungkan ke Cloud Vault...');
    setSyncStatus('syncing');

    try {
      // 1. Pull Profil & Settings
      setSyncMessage('Mengunduh konfigurasi bot...');
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

      // 2. Pull Karyawan
      setSyncMessage('Sinkronisasi data karyawan...');
      const { data: emp } = await supabase.from('employees').select('*').eq('owner_email', email);
      if (emp) {
        const mapped = emp.map(d => ({
          id: d.id, name: d.name, username: d.username, telegramId: d.telegram_id,
          role: d.role, shiftId: d.shift_id, status: d.status
        }));
        setEmployees(mapped);
      }

      // 3. Pull Shift
      setSyncMessage('Membangun jadwal operasional...');
      const { data: shft } = await supabase.from('shifts').select('*').eq('owner_email', email);
      if (shft && shft.length > 0) {
        const mapped = shft.map(d => ({
          id: d.id, name: d.name, startTime: d.start_time, endTime: d.end_time,
          category: d.category, description: d.description
        }));
        setShifts(mapped);
      }

      // 4. Pull Config (Respon/Limit)
      setSyncMessage('Memvalidasi limit & respon...');
      const { data: cfgs } = await supabase.from('configs').select('*').eq('owner_email', email);
      if (cfgs && cfgs.length > 0) {
        const mapped = cfgs.map(d => ({
          type: d.type, maxMinutes: d.max_minutes, maxPerDay: d.max_per_day,
          responseTemplate: d.response_template, warningTemplate: d.warning_template
        }));
        setConfigs(mapped);
      }

      hasPulledOnce.current = true;
      setSyncStatus('synced');
      setSyncMessage('Selesai! Data sinkron.');
      setTimeout(() => setIsSyncing(false), 1500);
      
      // Simpan status terakhir untuk deteksi perubahan
      lastPushedDataRef.current = JSON.stringify({ employees, shifts, configs });
    } catch (err) {
      console.error("Pull failed:", err);
      setSyncStatus('error');
      setSyncMessage('Gagal menarik data dari Cloud.');
      setTimeout(() => setIsSyncing(false), 2000);
    }
  }, [employees, shifts, configs]);

  // --- LOGIKA SIMPAN DATA (PUSH) ---
  const syncAllToCloud = useCallback(async () => {
    if (!hasPulledOnce.current || isSyncing || !isAuthenticated) return;

    const currentDataState = JSON.stringify({ employees, shifts, configs });
    if (currentDataState === lastPushedDataRef.current) return; 

    const supabase = getSupabase();
    if (!supabase) return;

    setSyncStatus('syncing');
    try {
      // Push Profil
      await supabase.from('profiles').upsert({
        email: userEmail,
        bot_token: botSettings.botToken,
        bot_username: botSettings.botUsername,
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' });

      // Push Employees
      if (employees.length > 0) {
        await supabase.from('employees').upsert(
          employees.map(e => ({
            id: e.id, name: e.name, username: e.username, telegram_id: e.telegramId,
            role: e.role, shift_id: e.shiftId, status: e.status, owner_email: userEmail
          })), { onConflict: 'id' }
        );
      }

      // Push Shifts
      await supabase.from('shifts').upsert(
        shifts.map(s => ({
          id: s.id, name: s.name, start_time: s.startTime, end_time: s.endTime,
          category: s.category, description: s.description, owner_email: userEmail
        })), { onConflict: 'id' }
      );

      // Push Configs
      await supabase.from('configs').upsert(
        configs.map(c => ({
          type: c.type, max_minutes: c.maxMinutes, max_per_day: c.maxPerDay,
          response_template: c.responseTemplate, warning_template: c.warningTemplate, owner_email: userEmail
        })), { onConflict: 'type,owner_email' }
      );

      lastPushedDataRef.current = currentDataState;
      setSyncStatus('synced');
    } catch (err) {
      console.error("Auto-sync error:", err);
      setSyncStatus('error');
    }
  }, [employees, shifts, configs, botSettings, userEmail, isAuthenticated, isSyncing]);

  // Effect Auto-Sync
  useEffect(() => {
    if (!hasPulledOnce.current) return;
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    syncTimeoutRef.current = setTimeout(() => syncAllToCloud(), 5000);
    return () => { if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current); };
  }, [employees, shifts, configs, botSettings, syncAllToCloud]);

  const handleLogin = (email: string, cloudUrl?: string, cloudKey?: string) => {
    setUserEmail(email);
    setIsAuthenticated(true);
    localStorage.setItem('zenith_active_session', email);
    
    // Jika ada URL/Key (dari mode Recovery), simpan permanen
    if (cloudUrl && cloudKey) {
      localStorage.setItem(`zenith_cloud_url_${email.replace(/[@.]/g, '_')}`, cloudUrl);
      localStorage.setItem(`zenith_cloud_key_${email.replace(/[@.]/g, '_')}`, cloudKey);
      setBotSettings(prev => ({ ...prev, supabaseUrl: cloudUrl, supabaseKey: cloudKey }));
      pullEverything(email, cloudUrl, cloudKey);
    } else {
      // Login biasa, coba ambil dari storage lokal dulu lalu pull
      const savedUrl = localStorage.getItem(`zenith_cloud_url_${email.replace(/[@.]/g, '_')}`);
      const savedKey = localStorage.getItem(`zenith_cloud_key_${email.replace(/[@.]/g, '_')}`);
      if (savedUrl && savedKey) {
        setBotSettings(prev => ({ ...prev, supabaseUrl: savedUrl, supabaseKey: savedKey }));
        pullEverything(email, savedUrl, savedKey);
      } else {
        // Device baru tapi login biasa tanpa key? Arahkan ke koneksi
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
        
        {/* --- GLOBAL SYNC ANIMATION OVERLAY --- */}
        {isSyncing && (
          <div className="fixed inset-0 bg-[#020617]/80 backdrop-blur-2xl z-[999] flex flex-col items-center justify-center animate-in fade-in duration-500">
             <div className="bg-white p-16 rounded-[4rem] shadow-2xl flex flex-col items-center gap-10 max-w-sm w-full">
                <div className="relative">
                   <div className="absolute inset-0 bg-indigo-500 rounded-full animate-ping opacity-20" />
                   <div className="relative w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center shadow-2xl">
                      <DatabaseZap size={40} className="text-white animate-pulse" />
                   </div>
                </div>
                <div className="text-center space-y-4">
                   <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Sinkronisasi Cloud</h3>
                   <div className="flex flex-col items-center gap-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">{syncMessage}</p>
                      <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-4">
                         <div className="h-full bg-indigo-600 animate-[progress_2s_infinite]" style={{ width: '40%' }} />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        )}

        <div className="bg-white px-12 py-5 border-b border-slate-200/60 flex justify-between items-center shadow-sm z-20">
           <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl border transition-all ${
                syncStatus === 'syncing' ? 'bg-indigo-50 border-indigo-100 text-indigo-500' : 
                syncStatus === 'error' ? 'bg-rose-50 border-rose-100 text-rose-500' : 
                'bg-emerald-50 border-emerald-100 text-emerald-600'
              }`}>
                 {syncStatus === 'syncing' ? <RefreshCw size={14} className="animate-spin" /> : syncStatus === 'error' ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                 <span className="text-[10px] font-black uppercase tracking-widest">
                   {syncStatus === 'syncing' ? 'Synchronizing...' : syncStatus === 'error' ? 'Cloud Offline' : 'Cloud Connected'}
                 </span>
              </div>
           </div>
           
           <div className="flex items-center gap-6">
              <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Logged in as</p>
                  <p className="text-[12px] font-bold text-slate-800 mt-1.5">{userEmail}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl flex items-center justify-center text-white text-sm font-black shadow-xl">
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
            {activePage === 'koneksi' && <BotConnection settings={botSettings} setSettings={setBotSettings} onForcePush={syncAllToCloud} onForcePull={() => pullEverything(userEmail)} configs={configs} employees={employees} aliases={aliases} />}
            {activePage === 'simulator' && <Simulator employees={employees} shifts={shifts} history={history} setHistory={setHistory} configs={configs} aliases={aliases} botSettings={botSettings} />}
            {activePage === 'deployment' && <Deployment />}
            {activePage === 'pengaturan' && <Settings configs={configs} setConfigs={setConfigs} userEmail={userEmail} />}
          </div>
        </div>
      </main>
      
      <style>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </div>
  );
};

export default App;
