import React, { useState, useEffect } from 'react';
import { 
  Zap, ShieldCheck, Copy, Terminal, CheckCircle, Code, Globe, Send, 
  RefreshCw, Server, Cloud, Rocket, ExternalLink, ShieldAlert, Check, 
  PlusCircle, Sparkles, MousePointer2, Lock, Layout, FileJson, Github, 
  ArrowRight, Info, AlertTriangle, Power, Edit3, MousePointerClick, 
  MessageSquare, AlertCircle, Activity, Cpu, Database, Link, Wifi, WifiOff,
  Trophy, ZapOff, HardDrive, Box, Database as DbIcon, Settings2,
  BrainCircuit, Bot
} from 'lucide-react';
import { BotSettings, LeaveConfig, Employee, BotAlias } from '../types';

interface BotConnectionProps {
  settings: BotSettings;
  setSettings: (s: BotSettings) => void;
  configs: LeaveConfig[];
  employees: Employee[];
  aliases: BotAlias[];
  onCloudSync?: (type: 'push' | 'pull') => Promise<void>;
}

const BotConnection: React.FC<BotConnectionProps> = ({ settings, setSettings, configs, employees, aliases, onCloudSync }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  const [showCopied, setShowCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'setup' | 'supabase' | 'sql'>('setup');
  const [isSyncing, setIsSyncing] = useState(false);

  // Deteksi AI Key dengan aman (Vite Define check)
  const isAiKeyDetected = (process.env.API_KEY && process.env.API_KEY !== "") ? true : false;

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);
  
  const handleSave = () => {
    setSettings(localSettings);
    alert("✅ Konfigurasi berhasil disimpan secara lokal!");
  };

  const handleSync = async (type: 'push' | 'pull') => {
    if (!onCloudSync) return;
    if (!localSettings.supabaseUrl || !localSettings.supabaseKey) {
      alert("⚠️ Mohon isi URL dan Anon Key Supabase terlebih dahulu.");
      return;
    }
    setIsSyncing(true);
    await onCloudSync(type);
    setIsSyncing(false);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-20">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#0f172a] tracking-tighter italic uppercase flex items-center gap-3">
             Command Center <Cpu className="text-indigo-600" size={32} />
          </h1>
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mt-1">Infrastruktur AI, Telegram, & Database</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => handleSync('pull')} 
             disabled={isSyncing} 
             className="bg-white border border-slate-200 text-slate-600 px-6 py-4 rounded-3xl text-[11px] font-black tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all active:scale-95"
           >
            <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} /> PULL DARI CLOUD
          </button>
          <button 
            onClick={handleSave} 
            className="bg-indigo-600 text-white px-8 py-4 rounded-3xl text-[11px] font-black tracking-widest flex items-center gap-2 hover:bg-indigo-700 shadow-lg transition-all active:scale-95"
          >
            <ShieldCheck size={16} /> SIMPAN CONFIG
          </button>
        </div>
      </header>

      {!isAiKeyDetected && (
        <div className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] flex items-center gap-6 animate-pulse">
           <div className="bg-rose-600 p-3 rounded-2xl text-white">
              <AlertTriangle size={24} />
           </div>
           <div>
              <h4 className="text-sm font-black text-rose-900 uppercase">Perhatian: API_KEY Belum Aktif</h4>
              <p className="text-xs text-rose-700">Jika Anda sudah mengisi di Vercel, pastikan Anda sudah melakukan <b>REDEPLOY</b> pada project Anda.</p>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-8">
          {/* TELEGRAM CONFIG */}
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
             <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                <Bot className="text-indigo-600" size={24} />
                <h3 className="text-lg font-black text-slate-900 uppercase italic">Telegram Bot API</h3>
             </div>
             
             <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bot Token (BotFather)</label>
                  <input 
                      type="text" 
                      value={localSettings?.botToken || ''}
                      onChange={e => setLocalSettings({...localSettings, botToken: e.target.value})}
                      className="w-full bg-slate-50 px-6 py-4 rounded-2xl border-2 border-transparent focus:border-indigo-500/20 font-bold text-slate-700 text-sm transition-all"
                      placeholder="12345678:AAH-XYZ..."
                    />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bot Username</label>
                  <input 
                      type="text" 
                      value={localSettings?.botUsername || ''}
                      onChange={e => setLocalSettings({...localSettings, botUsername: e.target.value})}
                      className="w-full bg-slate-50 px-6 py-4 rounded-2xl border-2 border-transparent focus:border-indigo-500/20 font-bold text-slate-700 text-sm transition-all"
                      placeholder="@UsernameBot"
                    />
                </div>
             </div>
          </div>

          {/* SUPABASE CONFIG */}
          <div className="bg-[#0f172a] p-10 rounded-[3rem] text-white shadow-xl space-y-8">
             <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                <Database className="text-indigo-400" size={24} />
                <h3 className="text-lg font-black uppercase italic">Supabase Database</h3>
             </div>
             
             <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Project URL (Wajib)</label>
                  <input 
                      type="text" 
                      value={localSettings?.supabaseUrl || ''}
                      onChange={e => setLocalSettings({...localSettings, supabaseUrl: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl font-bold text-white text-sm focus:border-indigo-500 outline-none"
                      placeholder="https://xyz.supabase.co"
                    />
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Anon Key (Wajib)</label>
                  <input 
                      type="password" 
                      value={localSettings?.supabaseKey || ''}
                      onChange={e => setLocalSettings({...localSettings, supabaseKey: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl font-bold text-white text-sm focus:border-indigo-500 outline-none"
                      placeholder="eyJhbGciOiJIUz..."
                    />
                </div>

                <button 
                  onClick={() => handleSync('push')}
                  disabled={isSyncing || !localSettings.supabaseUrl}
                  className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-[11px] tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all uppercase disabled:opacity-50"
                >
                  {isSyncing ? <RefreshCw className="animate-spin" size={18} /> : <Cloud size={18} />}
                  PUSH DATA KE CLOUD
                </button>
             </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col h-full min-h-[600px]">
            <div className="bg-slate-50 p-6 flex items-center justify-between border-b border-slate-100">
               <div className="flex bg-slate-200/50 p-1 rounded-2xl gap-1">
                  <button onClick={() => setActiveTab('setup')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'setup' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>PANDUAN KONEKSI</button>
               </div>
            </div>

            <div className="flex-1 p-10 space-y-10">
               <div className="bg-indigo-50 p-8 rounded-[2rem] border border-indigo-100 space-y-4">
                  <h4 className="text-sm font-black text-indigo-900 uppercase italic flex items-center gap-2">
                     <Rocket size={18} /> CARA AKTIFKAN AI GEMINI
                  </h4>
                  <p className="text-xs text-indigo-800/80 font-medium leading-relaxed">
                     1. Masuk Vercel Dashboard > Settings > Environment Variables.<br/>
                     2. Tambahkan variabel <b>API_KEY</b>.<br/>
                     3. Pergi ke tab <b>Deployments</b>, cari yang terbaru, klik <b>Redeploy</b>.<br/>
                     4. Tanpa Redeploy, AI tidak akan pernah aktif.
                  </p>
               </div>

               <div className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100 space-y-4">
                  <h4 className="text-sm font-black text-emerald-900 uppercase italic flex items-center gap-2">
                     <Database size={18} /> CARA SET SUPABASE
                  </h4>
                  <p className="text-xs text-emerald-800/80 font-medium leading-relaxed">
                     Buka dashboard Supabase > Project Settings > API. <br/>
                     Salin <b>Project URL</b> dan <b>anon public</b> key ke form di sebelah kiri. <br/>
                     Klik <b>Push Data</b> untuk mengirim daftar karyawan ke database cloud agar bot bisa membacanya.
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotConnection;
