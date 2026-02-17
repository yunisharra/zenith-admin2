
import React, { useState } from 'react';
import { 
  Zap, ShieldCheck, RefreshCw, Database, Bot, Power, Wifi, UploadCloud, DownloadCloud, ArrowRight, ShieldAlert, CheckCircle, Code, Copy, Check, Loader2, Info
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
  const [copied, setCopied] = useState(false);

  const sqlScript = `-- JALANKAN INI DI SQL EDITOR SUPABASE ANDA
-- Agar data bisa tersimpan secara permanen

CREATE TABLE IF NOT EXISTS profiles (
  email TEXT PRIMARY KEY,
  bot_token TEXT,
  bot_username TEXT,
  updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT,
  username TEXT,
  telegram_id TEXT,
  role TEXT,
  shift_id TEXT,
  status TEXT,
  owner_email TEXT
);

CREATE TABLE IF NOT EXISTS shifts (
  id TEXT PRIMARY KEY,
  name TEXT,
  start_time TEXT,
  end_time TEXT,
  category TEXT,
  description TEXT,
  owner_email TEXT
);

CREATE TABLE IF NOT EXISTS configs (
  type TEXT,
  max_minutes INTEGER,
  max_per_day INTEGER,
  response_template TEXT,
  warning_template TEXT,
  owner_email TEXT,
  PRIMARY KEY (type, owner_email)
);`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const testTelegramBot = async () => {
    if (!localSettings.botToken) return alert("Token Kosong!");
    setTestStatus('loading');
    try {
      const res = await fetch(`https://api.telegram.org/bot${localSettings.botToken}/getMe`);
      const data = await res.json();
      if (data.ok) {
        setTestStatus('success');
        setSettings({ ...localSettings, botUsername: `@${data.result.username}` });
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
             Pusat Sinkronisasi <Database className="text-indigo-600" size={32} />
          </h1>
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mt-1">Kelola Seluruh Database Cloud Anda</p>
        </div>
      </header>

      {/* SYNC INFO BOX */}
      <div className="bg-indigo-600 p-10 rounded-[3rem] text-white flex flex-col md:flex-row items-center gap-10 shadow-2xl relative overflow-hidden">
         <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12"><UploadCloud size={160} /></div>
         <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center shrink-0 border border-white/20 shadow-inner">
            <Info size={36} />
         </div>
         <div className="space-y-2 relative z-10">
            <h3 className="text-2xl font-black italic uppercase tracking-tighter">Sinkronisasi Global</h3>
            <p className="text-sm font-medium text-indigo-100 max-w-2xl leading-relaxed">
              Tombol "Push Database" di atas akan menyimpan **SELURUH DATA** (Daftar Karyawan, Jam Shift, dan Pengaturan Bot) ke Cloud Supabase Anda sekaligus. Gunakan ini sebelum menutup browser atau saat ingin pindah perangkat.
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Kolom Kiri: Config Form */}
        <div className="lg:col-span-7 space-y-6">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
               <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                  <Database className="text-indigo-600" size={24} />
                  <h3 className="text-lg font-black text-slate-900 uppercase italic">Supabase Credentials</h3>
               </div>
               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project URL</label>
                    <input 
                        type="text" value={localSettings.supabaseUrl}
                        onChange={e => setLocalSettings({...localSettings, supabaseUrl: e.target.value})}
                        className="w-full bg-slate-50 px-6 py-5 rounded-2xl border-none font-bold text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="https://xyz.supabase.co"
                      />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anon Key</label>
                    <input 
                        type="password" value={localSettings.supabaseKey}
                        onChange={e => setLocalSettings({...localSettings, supabaseKey: e.target.value})}
                        className="w-full bg-slate-50 px-6 py-5 rounded-2xl border-none font-bold text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="eyJhbG..."
                      />
                  </div>
                  <button 
                    onClick={() => setSettings(localSettings)}
                    className="w-full bg-indigo-50 text-indigo-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all border border-indigo-100"
                  >
                    Simpan Konfigurasi Key
                  </button>
               </div>
            </div>

            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
               <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                  <Power className="text-indigo-600" size={24} />
                  <h3 className="text-lg font-black text-slate-900 uppercase italic">Telegram Bot Gateway</h3>
               </div>
               <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bot Token</label>
                    <input 
                        type="password" value={localSettings.botToken}
                        onChange={e => setLocalSettings({...localSettings, botToken: e.target.value})}
                        className="w-full bg-slate-50 px-6 py-5 rounded-2xl border-none font-bold text-slate-700 text-sm focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="123456:ABC..."
                      />
                  </div>
                  <button onClick={testTelegramBot} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2">
                     {testStatus === 'loading' ? <Loader2 size={16} className="animate-spin" /> : <Bot size={16} />}
                     {testStatus === 'loading' ? 'Mengecek...' : 'Test & Verifikasi Koneksi'}
                  </button>
               </div>
            </div>
        </div>

        {/* Kolom Kanan: SQL Helper */}
        <div className="lg:col-span-5 bg-[#0f172a] p-10 rounded-[3rem] text-white shadow-xl flex flex-col gap-8 border-b-8 border-amber-500">
           <div className="flex items-center gap-3 border-b border-white/5 pb-6">
              <Code className="text-amber-400" size={24} />
              <h3 className="text-lg font-black uppercase italic">Database Setup Assistant</h3>
           </div>
           
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
             Jika data tidak tersimpan ke Cloud, pastikan Anda sudah menjalankan script SQL ini di dashboard Supabase Anda (Menu SQL Editor).
           </p>

           <div className="relative bg-black/40 rounded-2xl p-6 font-mono text-[10px] text-indigo-300 leading-relaxed overflow-x-auto max-h-[300px] custom-scrollbar">
              <pre>{sqlScript}</pre>
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
                PENTING: Tanpa script SQL di atas, tombol PUSH tidak akan bekerja karena database tidak mengenali tabel yang dikirimkan.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BotConnection;
