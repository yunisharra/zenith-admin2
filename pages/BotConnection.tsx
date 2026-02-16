import React, { useState, useEffect } from 'react';
import { 
  Zap, ShieldCheck, RefreshCw, Database, Bot, Cpu, AlertTriangle, Check, Info, Cloud, Power, Wifi, WifiOff
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [botInfo, setBotInfo] = useState<any>(null);

  const apiKeyRaw = process.env.API_KEY;
  const isAiKeyDetected = (apiKeyRaw && apiKeyRaw !== "" && apiKeyRaw !== "undefined") ? true : false;

  const testTelegramBot = async () => {
    if (!localSettings.botToken) return alert("Masukkan Token Bot dulu!");
    setTestStatus('loading');
    try {
      const res = await fetch(`https://api.telegram.org/bot${localSettings.botToken}/getMe`);
      const data = await res.json();
      if (data.ok) {
        setBotInfo(data.result);
        setTestStatus('success');
        setSettings({ ...localSettings, botUsername: `@${data.result.username}` });
      } else {
        setTestStatus('error');
        alert("Token tidak valid! Periksa kembali @BotFather.");
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
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mt-1">Status koneksi API & Database Cloud</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={testTelegramBot} 
            className="bg-white border border-slate-200 text-indigo-600 px-6 py-4 rounded-3xl text-[11px] font-black tracking-widest flex items-center gap-2 hover:bg-indigo-50 transition-all"
          >
            {testStatus === 'loading' ? <RefreshCw className="animate-spin" size={16} /> : <Bot size={16} />}
            CEK STATUS BOT
          </button>
          <button 
            onClick={() => setSettings(localSettings)} 
            className="bg-indigo-600 text-white px-8 py-4 rounded-3xl text-[11px] font-black tracking-widest flex items-center gap-2 hover:bg-indigo-700 shadow-lg transition-all"
          >
            <ShieldCheck size={16} /> SIMPAN CONFIG
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`p-8 rounded-[2.5rem] border flex items-center gap-6 transition-all ${isAiKeyDetected ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100 animate-pulse'}`}>
           <div className={`p-4 rounded-2xl text-white ${isAiKeyDetected ? 'bg-emerald-500' : 'bg-rose-500'}`}>
              {isAiKeyDetected ? <Zap size={24} /> : <ZapOff size={24} />}
           </div>
           <div>
              <h4 className={`text-sm font-black uppercase ${isAiKeyDetected ? 'text-emerald-900' : 'text-rose-900'}`}>AI Engine: {isAiKeyDetected ? 'Aktif' : 'Mati'}</h4>
              <p className="text-[9px] font-bold opacity-70 uppercase tracking-widest">{isAiKeyDetected ? 'Model: Gemini Flash Lite' : 'Vercel API_KEY Kosong'}</p>
           </div>
        </div>

        <div className={`p-8 rounded-[2.5rem] border flex items-center gap-6 transition-all ${testStatus === 'success' ? 'bg-indigo-50 border-indigo-100' : 'bg-slate-50 border-slate-100'}`}>
           <div className={`p-4 rounded-2xl text-white ${testStatus === 'success' ? 'bg-indigo-600' : 'bg-slate-400'}`}>
              <Bot size={24} />
           </div>
           <div>
              <h4 className="text-sm font-black text-slate-900 uppercase">Telegram: {testStatus === 'success' ? botInfo?.first_name : 'Belum Dicek'}</h4>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">@{botInfo?.username || 'unknown_bot'}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
           <div className="flex items-center gap-3 border-b border-slate-50 pb-6">
              <Power className="text-indigo-600" size={24} />
              <h3 className="text-lg font-black text-slate-900 uppercase italic">Telegram API Key</h3>
           </div>
           
           <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bot Token (BotFather)</label>
                <input 
                    type="password" 
                    value={localSettings?.botToken || ''}
                    onChange={e => setLocalSettings({...localSettings, botToken: e.target.value})}
                    className="w-full bg-slate-50 px-6 py-5 rounded-2xl border-2 border-transparent focus:border-indigo-500/20 font-bold text-slate-700 text-sm"
                    placeholder="12345678:AAH..."
                  />
              </div>
              <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex gap-4">
                 <AlertTriangle className="text-amber-600 shrink-0" size={20} />
                 <p className="text-[10px] font-bold text-amber-800 leading-relaxed uppercase">
                   Simpan token ini untuk mengaktifkan fitur <b>Live Bridge</b> di Simulator. Bot akan merespon di Telegram asli selama tab Admin ini kamu buka.
                 </p>
              </div>
           </div>
        </div>

        <div className="lg:col-span-6 bg-[#0f172a] p-10 rounded-[3rem] text-white shadow-xl space-y-8 border-b-8 border-indigo-500">
           <div className="flex items-center gap-3 border-b border-white/5 pb-6">
              <Database className="text-indigo-400" size={24} />
              <h3 className="text-lg font-black uppercase italic">Supabase Sync</h3>
           </div>
           <div className="space-y-6">
              <input 
                  type="text" 
                  value={localSettings?.supabaseUrl || ''}
                  onChange={e => setLocalSettings({...localSettings, supabaseUrl: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl font-bold text-white text-sm"
                  placeholder="Supabase URL"
                />
              <input 
                  type="password" 
                  value={localSettings?.supabaseKey || ''}
                  onChange={e => setLocalSettings({...localSettings, supabaseKey: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-2xl font-bold text-white text-sm"
                  placeholder="Supabase Anon Key"
                />
              <button 
                onClick={() => onCloudSync?.('push')}
                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-[11px] tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all uppercase"
              >
                <Cloud size={18} /> PUSH DATA KE DATABASE CLOUD
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

const ZapOff = ({ size, className }: any) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21 21-9-9-9-9"/><path d="M13 3.5V2l-5 7h1l-1 4.5"/><path d="m11 20.5 5-7h-1l1-4.5"/></svg>
);

export default BotConnection;
