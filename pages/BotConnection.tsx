
import React, { useState } from 'react';
import { 
  Zap, ShieldCheck, RefreshCw, Database, Bot, Power, Wifi, UploadCloud, 
  DownloadCloud, ArrowRight, ShieldAlert, CheckCircle, Code, Copy, Check, 
  Loader2, Info, XCircle, ExternalLink, UserCheck
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
        setSettings({ ...localSettings, botUsername: info.username, isOnline: true });
        
        // Simpan otomatis jika berhasil
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
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Kolom Kiri: Form & Verification */}
        <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
               <div className="flex items-center justify-between border-b border-slate-50 pb-6">
                  <div className="flex items-center gap-3">
                    <Bot className="text-indigo-600" size={24} />
                    <h3 className="text-lg font-black text-slate-900 uppercase italic">Telegram Bot API</h3>
                  </div>
                  {testStatus === 'success' && (
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest animate-bounce">
                      <Wifi size={12} /> Live Connected
                    </div>
                  )}
               </div>

               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bot Token (dari @BotFather)</label>
                    <input 
                        type="password" value={localSettings.botToken}
                        onChange={e => setLocalSettings({...localSettings, botToken: e.target.value})}
                        className="w-full bg-slate-50 px-6 py-5 rounded-2xl border-2 border-transparent focus:border-indigo-500/20 font-bold text-slate-700 text-sm focus:ring-0 transition-all"
                        placeholder="123456789:AAHE..."
                      />
                  </div>

                  {botDetail && (
                    <div className="p-6 bg-indigo-600 rounded-3xl text-white flex items-center justify-between animate-in slide-in-from-top-4">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                             <UserCheck size={24} />
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest leading-none mb-1">Bot Terverifikasi</p>
                             <h4 className="text-lg font-black">{botDetail.name}</h4>
                             <p className="text-xs font-bold opacity-60">{botDetail.username}</p>
                          </div>
                       </div>
                       <CheckCircle size={32} className="text-emerald-400" />
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <button 
                      onClick={testTelegramBot} 
                      disabled={testStatus === 'loading'}
                      className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                        testStatus === 'success' ? 'bg-emerald-600 text-white' : 
                        testStatus === 'error' ? 'bg-rose-500 text-white' : 
                        'bg-slate-900 text-white hover:bg-black'
                      }`}
                    >
                       {testStatus === 'loading' ? <Loader2 size={18} className="animate-spin" /> : 
                        testStatus === 'success' ? <CheckCircle size={18} /> : 
                        testStatus === 'error' ? <XCircle size={18} /> : <ShieldCheck size={18} />}
                       
                       {testStatus === 'loading' ? 'MENGECEK SERVER...' : 
                        testStatus === 'success' ? 'BOT TERKONEKSI SEMPURNA' : 
                        testStatus === 'error' ? 'TOKEN TIDAK VALID / ERROR' : 'VERIFIKASI & HUBUNGKAN BOT'}
                    </button>
                    
                    {testStatus === 'error' && (
                      <p className="text-center text-[9px] font-bold text-rose-500 uppercase tracking-widest">
                        Periksa kembali token Anda atau koneksi internet.
                      </p>
                    )}
                  </div>
               </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
               <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                  <Database className="text-indigo-600" size={24} />
                  <h3 className="text-lg font-black text-slate-900 uppercase italic">Supabase Cloud Init</h3>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={onForcePush} className="flex items-center justify-center gap-3 p-5 bg-indigo-50 text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                     <UploadCloud size={18} /> Push Data ke Cloud
                  </button>
                  <button onClick={onForcePull} className="flex items-center justify-center gap-3 p-5 bg-slate-50 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all">
                     <DownloadCloud size={18} /> Pull Data dari Cloud
                  </button>
               </div>
            </div>
        </div>

        {/* Kolom Kanan: SQL Helper */}
        <div className="lg:col-span-5 flex flex-col gap-6">
           <div className="bg-[#0f172a] p-10 rounded-[3rem] text-white shadow-xl flex flex-col gap-8 border-b-8 border-amber-500">
              <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                 <Code className="text-amber-400" size={24} />
                 <h3 className="text-lg font-black uppercase italic">SQL Maintenance</h3>
              </div>
              
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                Gunakan script ini di SQL Editor Supabase jika terjadi error "Column not found" atau ingin mereset tabel database Anda.
              </p>

              <div className="relative bg-black/40 rounded-2xl p-6 font-mono text-[9px] text-indigo-300 leading-relaxed overflow-x-auto max-h-[350px] custom-scrollbar border border-white/5">
                 <pre className="whitespace-pre-wrap">{sqlScript}</pre>
                 <button 
                   onClick={copySql}
                   className="absolute top-4 right-4 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                 >
                   {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                 </button>
              </div>

              <div className="mt-auto bg-amber-500/10 p-6 rounded-2xl border border-amber-500/20 flex gap-4 items-start">
                 <ShieldAlert className="text-amber-500 shrink-0" size={20} />
                 <p className="text-[9px] font-black text-amber-500 uppercase leading-relaxed">
                   Pastikan RLS (Row Level Security) dimatikan agar bot bisa membaca data secara publik melalui API Key.
                 </p>
              </div>
           </div>

           <a 
             href="https://aistudio.google.com/app/apikey" 
             target="_blank" 
             className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center justify-between group"
           >
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                    <Zap size={20} />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Dapatkan API Key Gemini Baru</span>
              </div>
              <ExternalLink size={16} className="text-slate-300" />
           </a>
        </div>
      </div>
    </div>
  );
};

export default BotConnection;
