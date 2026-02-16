import React, { useState, useEffect } from 'react';
import { 
  Zap, ShieldCheck, Copy, Terminal, CheckCircle, Code, Globe, Send, 
  RefreshCw, Server, Cloud, Rocket, ExternalLink, ShieldAlert, Check, 
  PlusCircle, Sparkles, MousePointer2, Lock, Layout, FileJson, Github, 
  ArrowRight, Info, AlertTriangle, Power, Edit3, MousePointerClick, 
  MessageSquare, AlertCircle, Activity, Cpu, Database, Link, Wifi, WifiOff,
  Trophy, ZapOff, HardDrive, Box, Database as DbIcon, Settings2,
  BrainCircuit
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

  // Deteksi AI Key dengan aman
  const isAiKeyDetected = (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? true : false;

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);
  
  const handleSave = () => {
    setSettings(localSettings);
    alert("✅ Konfigurasi Database Lokal diperbarui!");
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

  const sqlSchema = `-- TAHAP 1: KOPAS INI KE SQL EDITOR SUPABASE
CREATE TABLE IF NOT EXISTS employees (
  id TEXT PRIMARY KEY,
  name TEXT,
  username TEXT,
  telegram_id TEXT,
  role TEXT,
  shift_id TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS history (
  id TEXT PRIMARY KEY,
  employee_name TEXT,
  type TEXT,
  time_out TEXT,
  time_in TEXT,
  date TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);`;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-20">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#0f172a] tracking-tighter italic uppercase flex items-center gap-3">
             Command Center <Cpu className="text-indigo-600" size={32} />
          </h1>
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mt-1">Infrastruktur AI (Vercel) & Database (Supabase)</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => handleSync('pull')} 
             disabled={isSyncing} 
             className="bg-white border border-slate-200 text-slate-600 px-6 py-4 rounded-3xl text-[11px] font-black tracking-widest flex items-center gap-2 hover:bg-slate-50 transition-all active:scale-95"
           >
            <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} /> RECOVERY DARI CLOUD
          </button>
          <button 
            onClick={handleSave} 
            className="bg-slate-900 text-white px-8 py-4 rounded-3xl text-[11px] font-black tracking-widest flex items-center gap-2 hover:bg-black shadow-lg transition-all active:scale-95"
          >
            <ShieldCheck size={16} /> SIMPAN CONFIG
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className={`p-8 rounded-[2.5rem] border flex items-center justify-between ${isAiKeyDetected ? 'bg-indigo-50 border-indigo-100' : 'bg-rose-50 border-rose-100'}`}>
            <div className="flex items-center gap-5">
               <div className={`p-4 rounded-2xl ${isAiKeyDetected ? 'bg-indigo-600 text-white' : 'bg-rose-600 text-white'}`}>
                  <BrainCircuit size={28} />
               </div>
               <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    AI Engine <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[8px]">VERCEL SETTINGS</span>
                  </h4>
                  <p className="text-lg font-black text-slate-900 uppercase">Gemini-3-Flash</p>
               </div>
            </div>
            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isAiKeyDetected ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-200 text-rose-700'}`}>
               {isAiKeyDetected ? <><Check size={12}/> KEY DETECTED</> : <><AlertCircle size={12}/> KEY MISSING</>}
            </div>
         </div>

         <div className={`p-8 rounded-[2.5rem] border flex items-center justify-between ${localSettings.supabaseUrl ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex items-center gap-5">
               <div className={`p-4 rounded-2xl ${localSettings.supabaseUrl ? 'bg-emerald-600 text-white' : 'bg-slate-400 text-white'}`}>
                  <Database size={28} />
               </div>
               <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    Cloud Database <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[8px]">APP UI</span>
                  </h4>
                  <p className="text-lg font-black text-slate-900 uppercase">Supabase Cloud</p>
               </div>
            </div>
            <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${localSettings.supabaseUrl ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
               {localSettings.supabaseUrl ? <><Check size={12}/> CONNECTED</> : <><AlertCircle size={12}/> NOT CONNECTED</>}
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
             <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                <Settings2 className="text-indigo-600" size={24} />
                <h3 className="text-lg font-black text-slate-900 uppercase italic">Supabase Cloud Config</h3>
             </div>
             
             <div className="space-y-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Project URL</label>
                  <input 
                      type="text" 
                      value={localSettings?.supabaseUrl || ''}
                      onChange={e => setLocalSettings({...localSettings, supabaseUrl: e.target.value})}
                      className="w-full bg-slate-50 px-6 py-4 rounded-2xl border-2 border-transparent focus:border-indigo-500/20 font-bold text-slate-700 shadow-inner text-sm transition-all"
                      placeholder="https://xyz.supabase.co"
                    />
                </div>
                
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Anon (Public) Key</label>
                  <input 
                      type="password" 
                      value={localSettings?.supabaseKey || ''}
                      onChange={e => setLocalSettings({...localSettings, supabaseKey: e.target.value})}
                      className="w-full bg-slate-50 px-6 py-4 rounded-2xl border-2 border-transparent focus:border-indigo-500/20 font-bold text-slate-700 shadow-inner text-sm transition-all"
                      placeholder="eyJhbGciOiJIUzI1NiI..."
                    />
                </div>

                <div className="pt-4 space-y-3">
                  <button 
                    onClick={() => handleSync('push')}
                    disabled={isSyncing || !localSettings.supabaseUrl}
                    className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-[11px] tracking-widest shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all uppercase active:scale-95 disabled:opacity-50"
                  >
                    {isSyncing ? <RefreshCw className="animate-spin" size={18} /> : <Cloud size={18} />}
                    PUSH DATA KE SUPABASE
                  </button>
                </div>
             </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2.5rem] flex gap-6 items-start">
             <AlertTriangle className="text-amber-500 shrink-0" size={24} />
             <div className="space-y-2">
                <h4 className="text-xs font-black text-amber-900 uppercase italic">Ingat Lokasi Key!</h4>
                <p className="text-[10px] text-amber-700/80 font-medium leading-relaxed">
                   <b>Gemini API Key</b> tidak ditaruh di sini. Masuklah ke dashboard Vercel untuk mengaturnya. Hanya <b>Supabase Key</b> yang dikelola langsung melalui panel ini.
                </p>
             </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-white rounded-[3.5rem] border border-slate-100 shadow-2xl overflow-hidden flex flex-col h-[600px]">
            <div className="bg-slate-50 p-6 flex items-center justify-between border-b border-slate-100">
               <div className="flex bg-slate-200/50 p-1 rounded-2xl gap-1">
                  <button onClick={() => setActiveTab('setup')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'setup' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>1. CARA SET AI KEY</button>
                  <button onClick={() => setActiveTab('sql')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'sql' ? 'bg-amber-500 text-white' : 'text-slate-500'}`}>2. SQL SCHEMA</button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
               {activeTab === 'setup' && (
                 <div className="space-y-10 animate-in slide-in-from-right-4 duration-500">
                    <div className="bg-indigo-50 p-8 rounded-[2rem] border border-indigo-100 space-y-4">
                       <h4 className="text-sm font-black text-indigo-900 uppercase italic flex items-center gap-2">
                          <Rocket size={18} /> Masukkan AI Key ke Vercel:
                       </h4>
                       <ol className="text-xs text-indigo-800/80 space-y-3 font-medium list-decimal ml-4 leading-relaxed">
                          <li>Buka dashboard <b>Vercel</b>.</li>
                          <li>Pilih project <b>zenith-admin2</b>.</li>
                          <li>Tab <b>Settings</b>{" > "}<b>Environment Variables</b>.</li>
                          <li>Tambah: <b>Key</b>: <code className="bg-indigo-200 px-1 rounded">API_KEY</code></li>
                          <li><b>Value</b>: Masukkan API Key Gemini Anda.</li>
                          <li>Klik <b>Save</b> dan lakukan <b>Redeploy</b> (Tab Deployments{" > "}Pilih yang terbaru{" > "}Redeploy).</li>
                       </ol>
                    </div>

                    <div className="bg-emerald-50 p-8 rounded-[2rem] border border-emerald-100 space-y-4">
                       <h4 className="text-sm font-black text-emerald-900 uppercase italic flex items-center gap-2">
                          <Database size={18} /> Masukkan Database Key di Sini:
                       </h4>
                       <p className="text-xs text-emerald-800/80 font-medium leading-relaxed">
                          Gunakan form di sebelah kiri untuk menghubungkan aplikasi ke Supabase. Data ini disimpan di browser Anda (LocalStorage) demi keamanan privasi.
                       </p>
                    </div>
                 </div>
               )}

               {activeTab === 'sql' && (
                 <div className="h-full flex flex-col gap-6 animate-in slide-in-from-right-4 duration-500">
                    <div className="flex justify-between items-center">
                       <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2"><Code size={16}/> SQL Script Generator</h4>
                       <button 
                         onClick={() => {
                           navigator.clipboard.writeText(sqlSchema);
                           setShowCopied(true); setTimeout(() => setShowCopied(false), 2000);
                         }}
                         className="bg-slate-900 text-white px-6 py-2 rounded-xl text-[10px] font-black flex items-center gap-2 active:scale-95 transition-all"
                       >
                         {showCopied ? <Check size={14} /> : <Copy size={14} />} COPY SQL SCRIPT
                       </button>
                    </div>
                    <div className="flex-1 bg-slate-950 rounded-[2rem] p-8 font-mono text-[11px] text-amber-400 overflow-auto border border-white/5">
                       <pre><code>{sqlSchema}</code></pre>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotConnection;