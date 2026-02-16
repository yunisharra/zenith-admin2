
import React, { useState } from 'react';
import { BrainCircuit, Plus, Trash2, Hash, Terminal, Sparkles, X } from 'lucide-react';
import { BotAlias } from '../types';

interface BotIntelligenceProps {
  aliases: BotAlias[];
  setAliases: React.Dispatch<React.SetStateAction<BotAlias[]>>;
}

const BotIntelligence: React.FC<BotIntelligenceProps> = ({ aliases, setAliases }) => {
  const [showAddKeyword, setShowAddKeyword] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState('');

  const handleAddKeyword = (id: string) => {
    if (!newKeyword.trim()) return;
    setAliases(aliases.map(a => 
      a.id === id ? { ...a, keywords: [...a.keywords, newKeyword.trim().toLowerCase()] } : a
    ));
    setNewKeyword('');
    setShowAddKeyword(null);
  };

  const removeKeyword = (id: string, word: string) => {
    setAliases(aliases.map(a => 
      a.id === id ? { ...a, keywords: a.keywords.filter(k => k !== word) } : a
    ));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-[#0f172a] tracking-tighter italic uppercase">Kamus Bahasa Bot</h1>
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mt-1">Pemetaan Slang Karyawan ke Logika Izin</p>
        </div>
        <button className="bg-indigo-600 text-white px-8 py-4 rounded-3xl text-[11px] font-black tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 transition-all flex items-center gap-2">
          <Sparkles size={18} />
          INTELIGENSI AKTIF
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {aliases.map((alias) => (
          <div key={alias.id} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col gap-8 relative overflow-hidden group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                   <Terminal size={18} />
                 </div>
                 <h3 className="text-xl font-black text-[#0f172a] uppercase">{alias.category}</h3>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {alias.keywords.map((word, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all">
                  <Hash size={12} className="text-indigo-400" />
                  {word}
                  <button onClick={() => removeKeyword(alias.id, word)} className="ml-1 hover:text-rose-500"><X size={10} /></button>
                </div>
              ))}
              
              {showAddKeyword === alias.id ? (
                <div className="flex gap-1 animate-in slide-in-from-left-2 duration-300">
                  <input 
                    autoFocus
                    type="text" 
                    value={newKeyword}
                    onChange={e => setNewKeyword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddKeyword(alias.id)}
                    className="bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-xl text-xs font-bold text-indigo-600 focus:outline-none w-24"
                    placeholder="..."
                  />
                  <button onClick={() => setShowAddKeyword(null)} className="p-2 text-rose-400 hover:text-rose-600"><X size={16} /></button>
                </div>
              ) : (
                <button 
                  onClick={() => setShowAddKeyword(alias.id)}
                  className="flex items-center gap-1 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all"
                >
                  <Plus size={12} /> TAMBAH
                </button>
              )}
            </div>

            <div className="pt-6 border-t border-slate-50 text-[10px] font-bold text-slate-400 italic">
              "Karyawan bisa mengetik salah satu kata di atas untuk izin {alias.category.toLowerCase()}"
            </div>
          </div>
        ))}
      </div>

      <div className="bg-[#0f172a] p-12 rounded-[3.5rem] text-white flex items-center gap-10 shadow-2xl shadow-indigo-900/40">
         <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-[2rem] shadow-lg">
            <BrainCircuit size={48} />
         </div>
         <div className="flex-1">
            <h3 className="text-2xl font-black italic mb-2 uppercase tracking-tight">AI Language Processor</h3>
            <p className="text-sm text-slate-400 leading-relaxed max-w-2xl font-medium">
               Sistem kami menggunakan logika pencocokan kata tingkat lanjut. Anda tidak perlu membuat ribuan kategori, cukup petakan kata-kata slang lokal ke dalam 3 kategori utama (Merokok, Makan, Ibadah).
            </p>
         </div>
      </div>
    </div>
  );
};

export default BotIntelligence;
