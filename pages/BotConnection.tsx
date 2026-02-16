
import React, { useState } from 'react';
import { 
  Zap, ShieldCheck, RefreshCw, Database, Bot, Power, Wifi, UploadCloud, DownloadCloud, ArrowRight, ShieldAlert, CheckCircle, Code, Copy, Check
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
             Server Cloud <Wifi className="text-indigo-600" size={32} />
          </h1>
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mt-1">Status Sinkronisasi & Konfigurasi Supabase</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={onForcePull}
            className="bg-white border-2 border-slate-100 text-slate-600 px-8 py-4 rounded-3xl text-[11px] font-black tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm"
          >
            <DownloadCloud size={16} /> TARIK DATA CLOUD
          </button>
          <button 
            onClick={() => { setSettings(localSettings); onForcePush(); }} 
            className="bg-indigo-600 text-white px-10 py-4 rounded-3xl text-[11px] font-black tracking-widest flex items-center gap-2 hover:bg-indigo-700 shadow-2xl shadow-indigo-500/40 transition-all"
          >
            <UploadCloud size={18} /> PUSH SEKARANG
          </button>
        </div>
      </header>

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
                        className="w-full bg-slate-50 px-6 py-5 rounded-2xl border-none font-bold text-slate-700 text-sm"
                        placeholder="https://xyz.supabase.co"
                      />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anon Key</label>
                    <input 
                        type="password" value={localSettings.supabaseKey}
                        onChange={e => setLocalSettings({...localSettings, supabaseKey: e.target.value})}
                        className="w-full bg-slate-50 px-6 py-5 rounded-2xl border-none font-bold text-slate-700 text-sm"
                        placeholder="eyJhbG..."
                      />
                  </div>
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
                        className="w-full bg-slate-50 px-6 py-5 rounded-2xl border-none font-bold text-slate-700 text-sm"
                        placeholder="123456:ABC..."
                      />
                  </div>
                  <button onClick={testTelegramBot} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">
                     {testStatus === 'loading' ? 'Mengecek...' : 'Test & Verifikasi Koneksi'}
                  </button>
               </div>
            </div>
        </div>

        {/* Kolom Kanan: SQL Helper (WAJIB) */}
        <div className="lg:col-span-5 bg-[#0f172a] p-10 rounded-[3rem] text-white shadow-xl flex flex-col gap-8 border-b-8 border-amber-500">
           <div className="flex items-center gap-3 border-b border-white/5 pb-6">
              <Code className="text-amber-400" size={24} />
              <h3 className="text-lg font-black uppercase italic">Database Setup Assistant</h3>
           </div>
           
           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
             Jika data tidak tersimpan ke Cloud, pastikan Anda sudah menjalankan script SQL ini di dashboard Supabase Anda (Menu SQL Editor).
           </p>

           <div className="relative bg-black/40 rounded-2xl p-6 font-mono text-[10px] text-indigo-300 leading-relaxed overflow-x-auto">
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
