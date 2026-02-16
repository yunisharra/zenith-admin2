
import React from 'react';
import { MOCK_SHIFTS } from '../constants';
import { Plus, Clock, Briefcase, Edit, Trash2 } from 'lucide-react';

const ManageShifts: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-[#121421] tracking-tighter italic text-indigo-600">KELOLA SHIFT</h1>
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mt-1">Jadwal Operasional & Pemasaran</p>
        </div>
        <button className="bg-[#5d5fef] text-white px-6 py-3 rounded-2xl text-[11px] font-black tracking-widest shadow-xl shadow-blue-500/25 flex items-center gap-2">
          <Plus size={16} strokeWidth={3} />
          TAMBAH SHIFT
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MOCK_SHIFTS.map((shift) => (
          <div key={shift.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-6">
              {/* Fixed comparison from 'Operational' to 'Operasional' */}
              <div className={`p-4 rounded-2xl ${shift.category === 'Operasional' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                {shift.category === 'Operasional' ? <Briefcase size={24} /> : <Clock size={24} />}
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-[#5d5fef]"><Edit size={16} /></button>
                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-rose-500"><Trash2 size={16} /></button>
              </div>
            </div>
            
            <h3 className="text-xl font-black text-[#121421] mb-2">{shift.name}</h3>
            {/* shift.description now exists in the Shift interface */}
            <p className="text-sm text-slate-500 mb-6">{shift.description}</p>
            
            <div className="flex items-center justify-between border-t border-slate-50 pt-6">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WAKTU</span>
                <span className="text-sm font-bold text-[#121421] bg-slate-50 px-3 py-1 rounded-full">{shift.startTime} - {shift.endTime}</span>
              </div>
              {/* Fixed comparison from 'Operational' to 'Operasional' */}
              <span className={`text-[10px] font-black px-4 py-1.5 rounded-full ${
                shift.category === 'Operasional' ? 'bg-indigo-600 text-white' : 'bg-rose-600 text-white'
              }`}>
                {shift.category === 'Operasional' ? 'OPERASIONAL' : 'PEMASARAN'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManageShifts;
