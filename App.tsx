import React, { useState, useEffect } from 'react';
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
import { Download, Monitor, Smartphone, X, Sparkles } from 'lucide-react';
import { 
  MOCK_EMPLOYEES, 
  MOCK_SHIFTS, 
  MOCK_HISTORI_7_HARI, 
  MOCK_BOT_ALIASES, 
  MOCK_LEAVE_CONFIGS 
} from './constants';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string>('');
  const [activePage, setActivePage] = useState<PageType>('dashboard');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // Load active session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('zenith_active_session');
    if (savedSession) {
      setUserEmail(savedSession);
      setIsAuthenticated(true);
    }
  }, []);

  // PWA Installation Logic
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (isAuthenticated) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [isAuthenticated]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };

  const getDataKey = (key: string) => `zenith_user_${userEmail.replace(/[@.]/g, '_')}_${key}`;

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

  // Load Data for current user
  useEffect(() => {
    if (isAuthenticated && userEmail) {
      const savedEmp = localStorage.getItem(getDataKey('employees'));
      const savedShifts = localStorage.getItem(getDataKey('shifts'));
      const savedHistory = localStorage.getItem(getDataKey('history'));
      const savedAliases = localStorage.getItem(getDataKey('aliases'));
      const savedConfigs = localStorage.getItem(getDataKey('configs'));
      const savedBot = localStorage.getItem(getDataKey('bot_settings'));

      setEmployees(savedEmp ? JSON.parse(savedEmp) : MOCK_EMPLOYEES);
      setShifts(savedShifts ? JSON.parse(savedShifts) : MOCK_SHIFTS);
      setHistory(savedHistory ? JSON.parse(savedHistory) : MOCK_HISTORI_7_HARI);
      setAliases(savedAliases ? JSON.parse(savedAliases) : MOCK_BOT_ALIASES);
      setConfigs(savedConfigs ? JSON.parse(savedConfigs) : MOCK_LEAVE_CONFIGS);
      
      if (savedBot) setBotSettings(JSON.parse(savedBot));
    }
  }, [isAuthenticated, userEmail]);

  // Auto-save data on changes
  useEffect(() => {
    if (isAuthenticated && userEmail) {
      localStorage.setItem(getDataKey('employees'), JSON.stringify(employees));
      localStorage.setItem(getDataKey('shifts'), JSON.stringify(shifts));
      localStorage.setItem(getDataKey('history'), JSON.stringify(history));
      localStorage.setItem(getDataKey('aliases'), JSON.stringify(aliases));
      localStorage.setItem(getDataKey('configs'), JSON.stringify(configs));
      localStorage.setItem(getDataKey('bot_settings'), JSON.stringify(botSettings));
    }
  }, [employees, shifts, history, aliases, configs, botSettings]);

  const handleCloudSync = async (type: 'push' | 'pull') => {
    if (!botSettings.supabaseUrl || !botSettings.supabaseKey) {
      alert("⚠️ Konfigurasi Supabase belum lengkap!");
      return;
    }

    const supabase = createClient(botSettings.supabaseUrl, botSettings.supabaseKey);

    try {
      if (type === 'push') {
        const formattedEmployees = employees.map(emp => ({
          id: emp.id,
          name: emp.name,
          username: emp.username,
          telegram_id: emp.telegramId,
          role: emp.role,
          shift_id: emp.shiftId,
          status: emp.status
        }));
        
        const { error: empError } = await supabase.from('employees').upsert(formattedEmployees);
        if (empError) throw empError;

        const formattedHistory = history.map(h => ({
          id: h.id,
          employee_name: h.employeeName,
          type: h.type,
          time_out: h.timeOut,
          time_in: h.timeIn,
          date: h.date,
          status: h.status
        }));

        const { error: histError } = await supabase.from('history').upsert(formattedHistory);
        if (histError) throw histError;

        alert("🚀 CLOUD SYNC SUCCESS! Data berhasil diunggah ke database cloud.");
      } else {
        const { data: empData, error: empError } = await supabase.from('employees').select('*');
        if (empError) throw empError;

        if (empData) {
          const mappedEmp: Employee[] = empData.map(d => ({
            id: d.id,
            name: d.name,
            username: d.username,
            telegramId: d.telegram_id,
            role: d.role as any,
            shiftId: d.shift_id,
            status: d.status as any
          }));
          setEmployees(mappedEmp);
        }

        const { data: histData, error: histError } = await supabase.from('history').select('*');
        if (histError) throw histError;

        if (histData) {
          const mappedHist: LeaveHistory[] = histData.map(d => ({
            id: d.id,
            employeeName: d.employee_name,
            type: d.type as any,
            timeOut: d.time_out,
            timeIn: d.time_in,
            date: d.date,
            status: d.status as any
          }));
          setHistory(mappedHist);
        }

        alert("📥 RECOVERY SUCCESS! Data berhasil dipulihkan dari cloud.");
      }
    } catch (err: any) {
      console.error(err);
      alert(`❌ ERROR: ${err.message || "Gagal menghubungi Supabase"}`);
    }
  };

  const handleLogin = (email: string) => {
    setUserEmail(email);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('zenith_active_session');
    setIsAuthenticated(false);
    setUserEmail('');
    setActivePage('dashboard');
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': 
        return <Dashboard employees={employees} history={history} shifts={shifts} setHistory={setHistory} configs={configs} />;
      case 'karyawan': 
        return <Employees employees={employees} setEmployees={setEmployees} shifts={shifts} />;
      case 'shift': 
        return <Shifts shifts={shifts} setShifts={setShifts} employees={employees} setEmployees={setEmployees} setHistory={setHistory} />;
      case 'histori': 
        return <History history={history} setHistory={setHistory} />;
      case 'bot-intelligence': 
        return <BotIntelligence aliases={aliases} setAliases={setAliases} />;
      case 'respon':
        return <Respon configs={configs} setConfigs={setConfigs} />;
      case 'koneksi':
        return <BotConnection settings={botSettings} setSettings={setBotSettings} configs={configs} employees={employees} aliases={aliases} onCloudSync={handleCloudSync} />;
      case 'simulator': 
        return <Simulator employees={employees} shifts={shifts} history={history} setHistory={setHistory} configs={configs} aliases={aliases} botSettings={botSettings} />;
      case 'deployment':
        return <Deployment />;
      case 'pengaturan': 
        return <Settings configs={configs} setConfigs={setConfigs} userEmail={userEmail} />;
      default: 
        return <Dashboard employees={employees} history={history} shifts={shifts} setHistory={setHistory} configs={configs} />;
    }
  };

  if (!isAuthenticated) return <Login onLogin={handleLogin} />;

  return (
    <div className="flex min-h-screen bg-[#f8f9fd] selection:bg-indigo-100 selection:text-indigo-900">
      <Sidebar 
        activePage={activePage} 
        setActivePage={setActivePage} 
        onLogout={handleLogout} 
      />
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {showInstallBanner && (
          <div className="mx-12 mt-6 animate-in slide-in-from-top-10 duration-700">
             <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 p-1 rounded-[2.5rem] shadow-2xl shadow-indigo-500/30">
                <div className="bg-slate-900/40 backdrop-blur-md rounded-[2.3rem] px-8 py-4 flex items-center justify-between">
                   <div className="flex items-center gap-6">
                      <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-white shadow-inner">
                         <Sparkles size={24} className="animate-pulse" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">Zenith Enterprise</p>
                         <h4 className="text-sm font-black text-white italic tracking-tight">Unduh aplikasi ke Desktop untuk performa 2x lebih cepat!</h4>
                      </div>
                   </div>
                   <div className="flex items-center gap-4">
                      <button 
                        onClick={handleInstallClick}
                        className="bg-white text-indigo-950 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-xl"
                      >
                        <Download size={14} /> INSTALL SEKARANG
                      </button>
                      <button 
                        onClick={() => setShowInstallBanner(false)} 
                        className="p-3 text-white/40 hover:text-white transition-colors"
                      >
                        <X size={20} />
                      </button>
                   </div>
                </div>
             </div>
          </div>
        )}

        <div className="bg-white px-12 py-4 border-b border-slate-200/60 flex justify-end items-center gap-6">
           <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Session Operator</p>
              <p className="text-[11px] font-bold text-slate-700 mt-1.5">{userEmail}</p>
           </div>
           <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-lg shadow-indigo-100 border border-white">
              {userEmail.charAt(0).toUpperCase()}
           </div>
        </div>
        <div className="flex-1 overflow-y-auto p-12 scroll-smooth">
          <div className="max-w-[1400px] mx-auto h-full">
            {renderPage()}
          </div>
          <footer className="mt-20 pt-8 border-t border-slate-200/50 pb-12 text-center text-slate-400 text-[10px] font-bold tracking-widest uppercase italic">
            &copy; 2024 ZenithHR Management Suite • Enterprise Cloud Edition
          </footer>
        </div>
      </main>
    </div>
  );
};

export default App;
