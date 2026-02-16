
import React from 'react';
import { MOCK_CATEGORIES } from '../constants';
import { Tags, Plus, Search, Terminal } from 'lucide-react';

const ManageCategories: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-[#121421] tracking-tighter italic text-indigo-600">KELOLA KATEGORI</h1>
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mt-1">Perintah Bot & Pemetaan Fitur</p>
        </div>
        <button className="bg-[#5d5fef] text-white px-6 py-3 rounded-2xl text-[11px] font-black tracking-widest shadow-xl shadow-blue-500/25 hover:bg-[#4b4de0] transition-all flex items-center gap-2">
          <Plus size={16} strokeWidth={3} />
          TAMBAH KATEGORI
        </button>
      </header>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50">
           <div className="relative w-80">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input type="text" placeholder="Filter kategori..." className="pl-12 pr-6 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#5d5fef]/20 w-full" />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 p-10">
          {MOCK_CATEGORIES.map((cat) => (
            <div key={cat.id} className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100/50 flex flex-col gap-6 group hover:bg-white transition-all cursor-pointer">
              <div className="flex justify-between items-center">
                 <div className="p-4 bg-white rounded-2xl shadow-sm group-hover:bg-[#5d5fef] group-hover:text-white transition-colors">
                   <Tags size={20} />
                 </div>
                 <div className={`w-3 h-3 rounded-full ${cat.status === 'Active' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-300'}`} />
              </div>
              
              <div>
                <h4 className="text-xl font-black text-[#121421] mb-1">{cat.name}</h4>
                <div className="flex items-center gap-2 text-indigo-500 bg-indigo-50 w-fit px-3 py-1 rounded-full">
                  <Terminal size={12} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{cat.command}</span>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200/50 mt-auto">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Kuota per Hari</p>
                 <p className="text-lg font-black text-[#121421]">{cat.limitPerDay} Permintaan</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ManageCategories;
