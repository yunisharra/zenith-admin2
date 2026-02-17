
import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Trash2, ShieldCheck, Loader2, Wifi, WifiOff, Send, MessageSquare, Zap } from 'lucide-react';
import { Message, Employee, Shift, LeaveHistory, LeaveConfig, BotAlias, BotSettings } from '../types';
import { processBotLogicStream } from '../services/geminiService';

interface SimulatorProps {
  employees: Employee[];
  shifts: Shift[];
  history: LeaveHistory[];
  setHistory: React.Dispatch<LeaveHistory[]>;
  configs: LeaveConfig[];
  aliases: BotAlias[];
  botSettings: BotSettings;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  isBridgeActive: boolean;
  setIsBridgeActive: (active: boolean) => void;
}

const Simulator: React.FC<SimulatorProps> = ({ 
  employees, shifts, history, setHistory, configs, aliases, 
  botSettings, messages, setMessages, isBridgeActive, setIsBridgeActive 
}) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [senderUser, setSenderUser] = useState(employees[0]?.username || "@user");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input, timestamp: new Date() };
    const botId = (Date.now() + 1).toString();
    const placeholderBotMsg: Message = { id: botId, sender: 'bot', text: '', timestamp: new Date() };
    
    setMessages(prev => [...prev, userMsg, placeholderBotMsg]);
    setInput('');
    setIsLoading(true);
    
    let fullBotText = "";
    await processBotLogicStream(input, { employees, shifts, history, configs, aliases }, (chunk) => {
        fullBotText += chunk;
        setMessages(prev => prev.map(m => m.id === botId ? { ...m, text: fullBotText } : m));
    }, senderUser);
    
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-[#0f172a] tracking-tighter italic uppercase">Zenith Simulator</h1>
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mt-1">Uji Coba Logika AI & Bridge Telegram</p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className={`flex items-center gap-3 px-6 py-3 rounded-2xl border transition-all ${isBridgeActive ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
              {isBridgeActive ? <Wifi size={16} className="animate-pulse" /> : <WifiOff size={16} />}
              <span className="text-[10px] font-black uppercase tracking-widest">Live Telegram Bridge</span>
              <button 
                onClick={() => setIsBridgeActive(!isBridgeActive)}
                className={`w-10 h-5 rounded-full relative transition-all ${isBridgeActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${isBridgeActive ? 'left-6' : 'left-1'}`} />
              </button>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-[600px]">
        <div className="lg:col-span-8 flex flex-col bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden h-[750px]">
          <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg">
                <Bot size={20} />
              </div>
              <span className="font-black text-[#0f172a] uppercase text-sm">Zenith AI Stream</span>
            </div>
            <div className="flex items-center gap-4">
               <select 
                value={senderUser}
                onChange={(e) => setSenderUser(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-slate-500"
              >
                {employees.map(e => <option key={e.id} value={e.username}>{e.name}</option>)}
              </select>
              <button onClick={() => setMessages([])} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 size={20} /></button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/20 custom-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-[10px] font-bold ${msg.sender === 'user' ? 'bg-slate-800' : 'bg-indigo-600'}`}>
                    {msg.sender === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  <div className={`p-4 rounded-2xl shadow-sm text-sm font-bold leading-relaxed ${msg.sender === 'user' ? 'bg-white text-slate-700 border border-slate-100' : 'bg-indigo-600 text-white'}`}>
                    {msg.text === '' ? <Loader2 className="animate-spin opacity-50" size={16} /> : msg.text}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-8 border-t border-slate-100 bg-white">
            <div className="flex gap-4">
              <input 
                type="text" 
                placeholder="Simulasi pesan: 'Izin merokok'..." 
                className="flex-1 bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend}
                disabled={isLoading}
                className="bg-indigo-600 text-white px-8 rounded-2xl hover:bg-indigo-700 disabled:opacity-50 transition-all font-black text-xs uppercase"
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Kirim"}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
           <div className="bg-[#0f172a] rounded-[3rem] p-10 text-white shadow-xl space-y-6">
              <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                 <Zap className="text-amber-400" size={24} />
                 <h3 className="text-lg font-black italic uppercase">Mode Bridge</h3>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-bold uppercase tracking-widest">
                Status: {isBridgeActive ? 'ONLINE (Sistem memproses Telegram)' : 'OFFLINE (Hanya simulasi lokal)'}
              </p>
              <div className="space-y-4">
                 <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-widest">Status Engine</span>
                    <span className={`text-[10px] font-black uppercase ${isBridgeActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {isBridgeActive ? 'STREAMING ACTIVE' : 'ENGINE STANDBY'}
                    </span>
                 </div>
                 <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                    <p className="text-[9px] text-indigo-300 font-bold italic leading-relaxed">
                      "Sekarang Anda bebas berpindah menu. Selama tab browser ini terbuka, bot akan tetap membalas pesan di Telegram asli."
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Simulator;
