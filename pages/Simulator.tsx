
import React, { useState, useRef, useEffect } from 'react';
import { Send, Terminal, Bot, User, Trash2, Cpu, Info, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { Message, Employee, Shift, LeaveHistory, LeaveConfig, BotAlias } from '../types';
import { processBotLogic } from '../services/geminiService';

interface SimulatorProps {
  employees: Employee[];
  shifts: Shift[];
  history: LeaveHistory[];
  setHistory: React.Dispatch<React.SetStateAction<LeaveHistory[]>>;
  configs: LeaveConfig[];
  aliases: BotAlias[];
}

const Simulator: React.FC<SimulatorProps> = ({ employees, shifts, history, setHistory, configs, aliases }) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', sender: 'bot', text: 'Halo! Saya Zenith Bot. Masukkan pesan simulasi untuk menguji sistem.', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [senderUser, setSenderUser] = useState(employees[0]?.username || "@user");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    const botText = await processBotLogic(input, { employees, shifts, history, configs, aliases }, senderUser);
    
    // Deteksi apakah pesan bot mengandung konfirmasi izin
    // Jika iya, catat ke Dashboard
    const isApproved = botText.toLowerCase().includes("diterima") || botText.toLowerCase().includes("konfirmasi");
    
    if (isApproved) {
      let detectedType: any = "Lainnya";
      for (const alias of aliases) {
        if (alias.keywords.some(k => input.toLowerCase().includes(k.toLowerCase()))) {
          detectedType = alias.category;
          break;
        }
      }

      const emp = employees.find(e => e.username === senderUser);
      const now = new Date();
      const timeStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
      const dateStr = now.toISOString().split('T')[0];

      const newHistory: LeaveHistory = {
        id: 'hist-' + Date.now(),
        employeeName: emp?.name || senderUser,
        type: detectedType,
        timeOut: timeStr,
        timeIn: '--',
        date: dateStr,
        status: 'Tepat'
      };

      setHistory(prev => [newHistory, ...prev]);
    }

    const botMsg: Message = { 
      id: (Date.now() + 1).toString(), 
      sender: 'bot', 
      text: botText, 
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, botMsg]);
    setIsLoading(false);
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-[#0f172a] tracking-tighter italic uppercase">Simulator & Debug</h1>
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mt-1">Uji Logika Izin & Auto-Logging Dashboard</p>
        </div>
        
        <div className="flex items-center gap-3 bg-indigo-50 px-6 py-3 rounded-2xl border border-indigo-100">
          <User size={16} className="text-indigo-600" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kirim Sebagai:</span>
          <select 
            value={senderUser}
            onChange={(e) => setSenderUser(e.target.value)}
            className="bg-transparent border-none text-xs font-black text-indigo-600 focus:ring-0 p-0"
          >
            {employees.length > 0 ? employees.map(e => <option key={e.id} value={e.username}>{e.name} ({e.username})</option>) : <option>@user (Belum ada data)</option>}
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-[600px]">
        <div className="lg:col-span-7 flex flex-col bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden h-[700px]">
          <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-200">
                <Bot size={20} />
              </div>
              <div>
                <span className="block font-black text-[#0f172a] uppercase text-sm tracking-tight">Zenith AI Assistant</span>
                <span className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Auto-Logging Ready
                </span>
              </div>
            </div>
            <button onClick={() => setMessages([])} className="p-3 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={20} /></button>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/20">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm border ${
                    msg.sender === 'user' ? 'bg-white text-indigo-600 border-indigo-50' : 'bg-indigo-600 text-white border-indigo-400'
                  }`}>
                    {msg.sender === 'user' ? <User size={18} /> : <Bot size={18} />}
                  </div>
                  <div className="space-y-1">
                    <div 
                      className={`p-5 rounded-[2rem] shadow-sm ${
                        msg.sender === 'user' 
                        ? 'bg-white text-slate-700 border border-slate-100 rounded-tr-none' 
                        : 'bg-indigo-600 text-white rounded-tl-none'
                      }`}
                    >
                      <p className="text-sm font-bold leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    <p className={`text-[9px] font-black text-slate-400 uppercase tracking-widest ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-in fade-in">
                 <div className="bg-indigo-100 text-indigo-400 p-4 rounded-2xl flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Bot sedang berpikir...</span>
                 </div>
              </div>
            )}
          </div>

          <div className="p-8 border-t border-slate-100 bg-white">
            <div className="flex gap-4 relative">
              <input 
                type="text" 
                placeholder="Coba ketik: 'Izin sebat' atau 'Izin toilet'..." 
                className="flex-1 bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-inner"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <button 
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                className="bg-indigo-600 text-white px-8 py-5 rounded-3xl hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100 font-black text-xs uppercase tracking-widest"
              >
                Kirim
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6">
           <div className="bg-[#0f172a] rounded-[3rem] p-10 text-white shadow-xl flex flex-col h-full overflow-hidden">
              <div className="flex items-center gap-3 mb-8 border-b border-slate-800 pb-6">
                 <ShieldCheck className="text-emerald-400" size={24} />
                 <div>
                    <span className="block font-black text-xs uppercase tracking-widest leading-none">Sinkronisasi Real-time</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase mt-1.5 tracking-widest">Logging Status: Aktif</span>
                 </div>
              </div>
              <div className="space-y-6 text-sm font-medium text-slate-400 leading-relaxed overflow-y-auto custom-scrollbar">
                 <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
                    <p className="text-indigo-400 font-black text-[10px] uppercase mb-2 tracking-widest">Catatan Penting:</p>
                    <ul className="space-y-3 list-disc pl-4 text-xs italic">
                       <li>Setiap pesan izin yang berhasil dideteksi di Simulator akan otomatis menambah entri baru di <b>Dashboard</b>.</li>
                       <li>Jika menggunakan Bot asli di Telegram, Anda harus melakukan <b>Sync Data</b> di menu Koneksi Bot agar bot remote mengenal karyawan Anda.</li>
                       <li>Dashboard hanya akan menampilkan data hari ini sesuai dengan tanggal sistem.</li>
                    </ul>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Simulator;
