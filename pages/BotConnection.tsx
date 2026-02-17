
import React, { useState, useEffect } from 'react';
import { 
  Zap, ShieldCheck, RefreshCw, Database, Bot, Power, Wifi, UploadCloud, 
  DownloadCloud, ArrowRight, ShieldAlert, CheckCircle, Code, Copy, Check, 
  Loader2, Info, XCircle, ExternalLink, UserCheck, Key, Globe
} from 'lucide-react';
import { BotSettings, LeaveConfig, Employee, BotAlias } from '../types';

interface BotConnectionProps {
  settings: BotSettings;
  setSettings: (s: BotSettings) => void;
  onForcePush: () => void;
  onForcePull: () => void;
  configs: LeaveConfig[];
  employees: Employee[];
  aliases: BotAlias[];
}

const BotConnection: React.FC<BotConnectionProps> = ({ settings, setSettings, onForcePush, onForcePull, configs, employees, aliases }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [botDetail, setBotDetail] = useState<{name: string, username: string} | null>(null);
  const [copied, setCopied] = useState(false);
  const [saveStatus, setSaveStatus] = useState(false);

  // Sync local state when props change
  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const sqlScript = `-- JALANKAN INI DI SQL EDITOR SUPABASE ANDA
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

  const copySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAll = () => {
    setSettings(localSettings);
    setSaveStatus(true);
    setTimeout(() => setSaveStatus(false), 2000);
    
    // Update vault local storage if changed
    const email = localStorage.getItem('zenith_active_session');
    if (email) {
      const vault = JSON.parse(localStorage.getItem('zenith_vault') || '[]');
      const updatedVault = vault.map((u: any) => 
        u.email === email ? { ...u, url: localSettings.supabaseUrl, key: localSettings.supabaseKey } : u
      );
      localStorage.setItem('zenith_vault', JSON.stringify(updatedVault));
    }
  };

  const testTelegramBot = async () => {
    if (!localSettings.botToken) return alert("Silakan masukkan Token Bot terlebih dahulu!");
    setTestStatus('loading');
    setBotDetail(null);
    
    try {
      const res = await fetch(`https://api.telegram.org/bot${localSettings.botToken}/getMe`);
      const data = await res.json();
      
      if (data.ok) {
        setTestStatus('success');
        const info = { name: data.result.first_name, username: `@${data.result.username}` };
        setBotDetail(info);
        
        // Update both local and parent state
        const updated = { ...localSettings, botUsername: info.username, isOnline: true };
        setLocalSettings(updated);
        setSettings(updated);
        
        localStorage.setItem('zenith_bot_status', 'connected');
      } else {
        setTestStatus('error');
      }
    } catch (e) {
      setTestStatus('error');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-20">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#0f172a] tracking-tighter italic uppercase flex items-center gap-3">
             Pusat Koneksi <Zap className="text-indigo-600" size={32} />
          </h1>
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mt-1">Konfigurasi Gateway Cloud & Bot Telegram</p>
        </div>
        <button 
          onClick={handleSaveAll}
          className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 shadow-xl ${
            saveStatus ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
          }`}
        >
          {saveStatus ? <CheckCircle size={16} /> : <UploadCloud size={16} />}
          {saveStatus ? 'KONFIGURASI DISIMPAN' : 'SIMPAN SEMUA PERUBAHAN'}
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Kolom Kiri: Telegram & Cloud Setup */}
        <div className="lg:col-span-7 space-y-8">
            {/* Supabase Cloud Section */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
               <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                  <Database className="text-indigo-600" size={24} />
                  <h3 className="text-lg font-black text-slate-900 uppercase italic">Cloud Database Setup</h3>
               </div>
               
               <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Globe size={12} /> Supabase URL
                    </label>
                    <input 
                        type="text" value={localSettings.supabaseUrl}
                        onChange={e => setLocalSettings({...localSettings, supabaseUrl: e.target.value})}
                        className="w-full bg-slate-50 px-6 py-4 rounded-2xl border-2 border-transparent focus:border-indigo-500/20 font-bold text-slate-700 text-sm focus:ring-0 transition-all"
                        placeholder="https://xyz.supabase.co"
                      />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Key size={12} /> Anon / API Key
                    </label>
                    <input 
                        type="password" value={localSettings.supabaseKey}
                        onChange={e => setLocalSettings({...localSettings, supabaseKey: e.target.value})}
                        className="w-full bg-slate-50 px-6 py-4 rounded-2xl border-2 border-transparent focus:border-indigo-500/20 font-bold text-slate-700 text-sm focus:ring-0 transition-all"
                        placeholder="Masukkan API Key..."
                      />
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 pt-2">
                  <button onClick={onForcePush} className="flex items-center justify-center gap-3 p-5 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                     <UploadCloud size={18} /> Push ke Cloud
                  </button>
                  <button onClick={onForcePull} className="flex items-center justify-center gap-3 p-5 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                     <DownloadCloud size={18} /> Pull dari Cloud
                  </button>
               </div>
            </div>

            {/* Telegram Bot Section */}
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
               <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                  <div className="flex items-center gap-3">
                    <Bot className="text-indigo-600" size={24} />
                    <h3 className="text-lg font-black text-slate-900 uppercase italic">Telegram Bot Gateway</h3>
                  </div>
                  {testStatus === 'success' && (
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                      <Wifi size={12} /> Active
                    </div>
                  )}
               </div>

               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bot Token (BotFather)</label>
                    <input 
                        type="password" value={localSettings.botToken}
                        onChange={e => setLocalSettings({...localSettings, botToken: e.target.value})}
                        className="w-full bg-slate-50 px-6 py-5 rounded-2xl border-2 border-transparent focus:border-indigo-500/20 font-bold text-slate-700 text-sm focus:ring-0 transition-all"
                        placeholder="123456789:AAHE..."
                      />
                  </div>

                  {botDetail && (
                    <div className="p-6 bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-3xl text-white flex items-center justify-between animate-in zoom-in-95 duration-300 shadow-lg shadow-indigo-200">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                             <UserCheck size={24} />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest leading-none mb-1">Bot Terverifikasi</p>
                             <h4 className="text-lg font-black">{botDetail.name}</h4>
                             <p className="text-xs font-bold opacity-60 tracking-tight">{botDetail.username}</p>
                          </div>
                       </div>
                       <div className="bg-emerald-400/20 p-2 rounded-full">
                          <CheckCircle size={24} className="text-emerald-400" />
                       </div>
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={testTelegramBot} 
                      disabled={testStatus === 'loading'}
                      className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 border-b-4 ${
                        testStatus === 'success' ? 'bg-emerald-600 text-white border-emerald-800' : 
                        testStatus === 'error' ? 'bg-rose-500 text-white border-rose-800' : 
                        'bg-slate-900 text-white border-slate-700 hover:bg-black shadow-lg shadow-slate-200'
                      }`}
                    >
                       {testStatus === 'loading' ? <Loader2 size={18} className="animate-spin" /> : 
                        testStatus === 'success' ? <CheckCircle size={18} /> : 
                        testStatus === 'error' ? <XCircle size={18} /> : <ShieldCheck size={18} />}
                       
                       {testStatus === 'loading' ? 'MENGHUBUNGKAN KE TELEGRAM...' : 
                        testStatus === 'success' ? 'KONEKSI BOT BERHASIL' : 
                        testStatus === 'error' ? 'GAGAL! TOKEN SALAH' : 'VERIFIKASI & AKTIFKAN BOT'}
                    </button>
                  </div>
               </div>
            </div>
        </div>

        {/* Kolom Kanan: SQL & AI Center */}
        <div className="lg:col-span-5 flex flex-col gap-8">
           <div className="bg-[#0f172a] p-10 rounded-[3rem] text-white shadow-xl flex flex-col gap-8 border-b-8 border-amber-500">
              <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                 <Code className="text-amber-400" size={24} />
                 <h3 className="text-lg font-black uppercase italic">SQL Maintenance</h3>
              </div>
              
              <div className="relative bg-black/40 rounded-2xl p-6 font-mono text-[9px] text-indigo-300 leading-relaxed overflow-x-auto max-h-[300px] custom-scrollbar border border-white/5">
                 <pre className="whitespace-pre-wrap">{sqlScript}</pre>
                 <button 
                   onClick={copySql}
                   className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                 >
                   {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                 </button>
              </div>

              <div className="bg-amber-500/10 p-5 rounded-2xl border border-amber-500/20 flex gap-4 items-start">
                 <ShieldAlert className="text-amber-500 shrink-0" size={20} />
                 <p className="text-[9px] font-black text-amber-500 uppercase leading-relaxed">
                   Pastikan tabel database Anda sudah mendukung kolom 'owner_email' agar sinkronisasi Cloud berfungsi.
                 </p>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-6">
              <div className="flex items-center gap-4 border-b border-slate-50 pb-6">
                 <Zap className="text-indigo-600" size={24} />
                 <h3 className="text-lg font-black text-slate-900 uppercase italic">AI Gemini Quota</h3>
              </div>
              
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                Aplikasi ini menggunakan API Key dari Vercel Environment Variables. Jika muncul error 429, ganti value API_KEY di Vercel dengan kunci baru.
              </p>

              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl group hover:bg-indigo-600 transition-all"
              >
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                       <Key size={18} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-white">Dapatkan API Key Gratis</span>
                 </div>
                 <ExternalLink size={16} className="text-slate-300 group-hover:text-white" />
              </a>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BotConnection;
