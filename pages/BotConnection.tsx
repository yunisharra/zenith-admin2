
import React, { useState } from 'react';
import { 
  Zap, ShieldCheck, RefreshCw, Database, Bot, Power, Wifi, UploadCloud, DownloadCloud, ArrowRight, ShieldAlert, CheckCircle
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

  const apiKeyRaw = process.env.API_KEY;
  const isAiKeyDetected = (apiKeyRaw && apiKeyRaw !== "" && apiKeyRaw !== "undefined") ? true : false;

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
             Infrastruktur <Wifi className="text-indigo-600" size={32} />
          </h1>
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mt-1">Kontrol Database & API Gateway</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={onForcePull}
            className="bg-white border-2 border-indigo-100 text-indigo-600 px-8 py-4 rounded-3xl text-[11px] font-black tracking-widest flex items-center gap-2 hover:bg-indigo-50 transition-all shadow-sm"
          >
            <DownloadCloud size={16} /> TARIK DARI CLOUD
          </button>
          <button 
            onClick={() => { setSettings(localSettings); onForcePush(); }} 
            className="bg-indigo-600 text-white px-10 py-4 rounded-3xl text-[11px] font-black tracking-widest flex items-center gap-2 hover:bg-indigo-700 shadow-2xl shadow-indigo-500/40 animate-pulse transition-all"
          >
            <UploadCloud size={18} /> PUSH DATA KE SUPABASE
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 space-y-6">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
               <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
                  <Power className="text-indigo-600" size={24} />
                  <h3 className="text-lg font-black text-slate-900 uppercase italic">Telegram Gateway</h3>
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
                  <button onClick={testTelegramBot} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black">
                     Test & Verifikasi Bot
                  </button>
               </div>
            </div>

            <div className={`p-8 rounded-[2.5rem] border flex items-center gap-6 ${isAiKeyDetected ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
               <div className={`p-4 rounded-2xl text-white ${isAiKeyDetected ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                  <Zap size={24} />
               </div>
               <div>
                  <h4 className="text-sm font-black uppercase">AI Intelligence: {isAiKeyDetected ? 'ONLINE' : 'OFFLINE'}</h4>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Gemini Engine Status</p>
               </div>
            </div>
        </div>

        <div className="lg:col-span-6 bg-[#0f172a] p-10 rounded-[3rem] text-white shadow-xl space-y-8 border-b-8 border-indigo-500 relative">
           <div className="absolute -top-4 -right-4 bg-amber-500 text-[#0f172a] p-4 rounded-3xl shadow-xl animate-bounce">
              <ShieldAlert size={24} />
           </div>
           
           <div className="flex items-center gap-3 border-b border-white/5 pb-6">
              <Database className="text-indigo-400" size={24} />
              <h3 className="text-lg font-black uppercase italic">Supabase Cloud Sync</h3>
           </div>

           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Project URL</label>
                 <input 
                    type="text" value={localSettings.supabaseUrl}
                    onChange={e => setLocalSettings({...localSettings, supabaseUrl: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl font-bold text-white text-sm"
                    placeholder="https://xyz.supabase.co"
                  />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Anon Key</label>
                 <input 
                    type="password" value={localSettings.supabaseKey}
                    onChange={e => setLocalSettings({...localSettings, supabaseKey: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl font-bold text-white text-sm"
                    placeholder="eyJhbG..."
                  />
              </div>

              <div className="bg-indigo-500/10 p-6 rounded-2xl border border-indigo-500/20 space-y-4">
                 <div className="flex items-center gap-3">
                    <CheckCircle className="text-emerald-400" size={16} />
                    <span className="text-[10px] font-black uppercase text-indigo-300">Tips Sinkronisasi</span>
                 </div>
                 <p className="text-[9px] text-slate-400 font-bold leading-relaxed uppercase">
                   Gunakan tombol <b>PUSH</b> di atas setelah Anda merubah data karyawan agar admin lain bisa melihat perubahan tersebut secara instan.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default BotConnection;
