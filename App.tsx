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
import { Cloud, CloudOff, Loader2, ShieldCheck, Globe } from 'lucide-react';
import { 
  MOCK_BOT_ALIASES, 
  MOCK_LEAVE_CONFIGS 
} from './constants';

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

  // Fungsi Helper untuk Supabase
  const getSupabase = () => {
    if (!botSettings.supabaseUrl || !botSettings.supabaseKey) return null;
    return createClient(botSettings.supabaseUrl, botSettings.supabaseKey);
  };

  // CLOUD ENGINE: PULL DATA
  const pullAllFromCloud = useCallback(async (email: string, settings: BotSettings) => {
    if (!settings.supabaseUrl || !settings.supabaseKey) return;
    
    setSyncStatus('syncing');
    const supabase = createClient(settings.supabaseUrl, settings.supabaseKey);

    try {
      // 1. Pull Employees
      const { data: empData } = await supabase.from('employees').select('*').eq('owner_email', email);
      if (empData) setEmployees(empData.map(d => ({
        id: d.id, name: d.name, username: d.username, telegramId: d.telegram_id,
        role: d.role, shiftId: d.shift_id, status: d.status
      })));

      // 2. Pull History (100 Terakhir)
      const { data: histData } = await supabase.from('history').select('*').eq('owner_email', email).order('id', { ascending: false }).limit(100);
      if (histData) setHistory(histData.map(d => ({
        id: d.id, employeeName: d.employee_name, type: d.type,
        timeOut: d.time_out, timeIn: d.time_in, date: d.date, status: d.status
      })));

      // 3. Pull Configs
      const { data: confData } = await supabase.from('configs').select('*').eq('owner_email', email);
      if (confData && confData.length > 0) setConfigs(confData.map(d => ({
        type: d.type, maxMinutes: d.max_minutes, maxPerDay: d.max_per_day,
        responseTemplate: d.response_template, warningTemplate: d.warning_template
      })));

      setSyncStatus('synced');
    } catch (err) {
      console.error("Cloud Pull Failed:", err);
      setSyncStatus('error');
    }
  }, []);

  // CLOUD ENGINE: PUSH DATA
  const pushToCloud = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !isAuthenticated) return;
    
    setSyncStatus('syncing');
    try {
      // Upsert Employees
      const empPayload = employees.map(e => ({
        id: e.id, name: e.name, username: e.username, telegram_id: e.telegramId,
        role: e.role, shift_id: e.shiftId, status: e.status, owner_email: userEmail
      }));
      if (empPayload.length > 0) await supabase.from('employees').upsert(empPayload);

      // Upsert History
      const histPayload = history.slice(0, 50).map(h => ({
        id: h.id, employee_name: h.employeeName, type: h.type,
        time_out: h.timeOut, time_in: h.timeIn, date: h.date, status: h.status, owner_email: userEmail
      }));
      if (histPayload.length > 0) await supabase.from('history').upsert(histPayload);

      // Upsert Configs
      const confPayload = configs.map(c => ({
        type: c.type, max_minutes: c.maxMinutes, max_per_day: c.maxPerDay,
        response_template: c.responseTemplate, warning_template: c.warningTemplate, owner_email: userEmail
      }));
      await supabase.from('configs').upsert(confPayload);

      setSyncStatus('synced');
    } catch (err) {
      setSyncStatus('error');
    }
  }, [employees, history, configs, botSettings, userEmail, isAuthenticated]);

  // AUTO-SYNC LOGIC (Debounced 3s)
  useEffect(() => {
    if (isAuthenticated && userEmail) {
      const timer = setTimeout(() => pushToCloud(), 3000);
      return () => clearTimeout(timer);
    }
  }, [employees, history, configs, isAuthenticated, pushToCloud]);

  // INITIAL SESSION & RECOVERY
  useEffect(() => {
    const savedSession = localStorage.getItem('zenith_active_session');
    if (savedSession) {
      setUserEmail(savedSession);
      setIsAuthenticated(true);
      
      const key = `zenith_user_${savedSession.replace(/[@.]/g, '_')}_bot_settings`;
      const savedBot = localStorage.getItem(key);
      if (savedBot) {
        const parsedBot = JSON.parse(savedBot);
        setBotSettings(parsedBot);
        pullAllFromCloud(savedSession, parsedBot);
      }
    }
  }, [pullAllFromCloud]);

  const handleLogin = (email: string) => {
    setUserEmail(email);
    setIsAuthenticated(true);
    const key = `zenith_user_${email.replace(/[@.]/g, '_')}_bot_settings`;
    const savedBot = localStorage.getItem(key);
    if (savedBot) {
      const parsed = JSON.parse(savedBot);
      setBotSettings(parsed);
      pullAllFromCloud(email, parsed);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('zenith_active_session');
    setIsAuthenticated(false);
    setUserEmail('');
  };

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  return (
    <div className="flex min-h-screen bg-[#f8f9fd]">
      <Sidebar activePage={activePage} setActivePage={setActivePage} onLogout={handleLogout} />
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Cloud Status Bar */}
        <div className="bg-white px-12 py-4 border-b border-slate-200/60 flex justify-between items-center shadow-sm z-20">
           <div className="flex items-center gap-4">
              {syncStatus === 'syncing' ? (
                <div className="flex items-center gap-2 text-indigo-500 animate-pulse">
                   <Loader2 size={14} className="animate-spin" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Syncing Data...</span>
                </div>
              ) : syncStatus === 'synced' ? (
                <div className="flex items-center gap-2 text-emerald-500">
                   <ShieldCheck size={14} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Cloud Synced</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-rose-500">
                   <CloudOff size={14} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Offline / Sync Error</span>
                </div>
              )}
           </div>

           <div className="flex items-center gap-6">
              <div className="text-right">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Logged as Account</p>
                  <p className="text-[11px] font-bold text-slate-700 mt-1.5">{userEmail}</p>
              </div>
              <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-lg shadow-indigo-100 border-2 border-white">
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
            {activePage === 'koneksi' && <BotConnection settings={botSettings} setSettings={setBotSettings} configs={configs} employees={employees} aliases={aliases} />}
            {activePage === 'simulator' && <Simulator employees={employees} shifts={shifts} history={history} setHistory={setHistory} configs={configs} aliases={aliases} botSettings={botSettings} />}
            {activePage === 'deployment' && <Deployment />}
            {activePage === 'pengaturan' && <Settings configs={configs} setConfigs={setConfigs} userEmail={userEmail} />}
          </div>
          <footer className="mt-20 pt-8 border-t border-slate-200/50 pb-12 text-center text-slate-400 text-[10px] font-bold tracking-widest uppercase italic">
            &copy; 2024 Zenith Cloud Suite • Multi-Device Support Active
          </footer>
        </div>
      </main>
    </div>
  );
};

export default App;
