
import React from 'react';
import { QUOTA_SETTINGS } from '../constants';
import { Zap, Clock, Save, ShieldAlert } from 'lucide-react';

const QuotaSettings: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-[#121421] tracking-tighter italic text-indigo-600">KUOTA & LIMIT</h1>
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mt-1">Perilaku Bot & Batasan Izin</p>
        </div>
        <button className="bg-[#5d5fef] text-white px-8 py-3 rounded-2xl text-[11px] font-black tracking-widest shadow-xl shadow-blue-500/25 hover:bg-[#4b4de0] transition-all flex items-center gap-2">
          <Save size={16} />
          SIMPAN PENGATURAN
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <div className="bg-indigo-50 p-4 rounded-2xl text-indigo-600">
              < Zap size={24} />
            </div>
            <div>
              <h3 className="font-black text-[#121421]">Batas Permintaan Bot</h3>
              <p className="text-xs text-slate-400">Total harian yang diizinkan</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <input 
              type="number" 
              defaultValue={QUOTA_SETTINGS.dailyBotLimit} 
              className="w-full bg-slate-50 border-2 border-slate-50 focus:border-[#5d5fef]/20 rounded-2xl p-5 text-2xl font-black text-[#121421] focus:outline-none transition-all"
            />
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Kuota penggunaan global untuk semua karyawan</p>
          </div>
        </div>

        <div className="bg-[#121421] p-10 rounded-[3rem] shadow-xl text-white flex flex-col gap-8">
          <div className="flex items-center gap-4">
            <div className="bg-slate-800 p-4 rounded-2xl text-blue-400">
              <ShieldAlert size={24} />
            </div>
            <div>
              <h3 className="font-black">Mode Reset Otomatis</h3>
              <p className="text-xs text-slate-500">Setiap 00:00 waktu server</p>
            </div>
          </div>
          <div className="mt-auto">
            <div className="flex items-center justify-between bg-slate-900 p-6 rounded-[2rem]">
               <span className="text-xs font-bold uppercase tracking-widest">Status Sistem</span>
               <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-xs font-black text-emerald-500">OPTIMAL</span>
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <h3 className="text-xl font-black text-[#121421] italic mb-8 uppercase">BATAS DURASI IZIN (MENIT)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Clock size={12} /> Izin Sholat
            </label>
            <input type="number" defaultValue={QUOTA_SETTINGS.sholatLimitMinutes} className="w-full bg-slate-50 rounded-2xl p-4 font-bold text-[#121421]" />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Clock size={12} /> Izin Makan
            </label>
            <input type="number" defaultValue={QUOTA_SETTINGS.makanLimitMinutes} className="w-full bg-slate-50 rounded-2xl p-4 font-bold text-[#121421]" />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Clock size={12} /> Izin Lainnya
            </label>
            <input type="number" defaultValue={QUOTA_SETTINGS.otherLimitMinutes} className="w-full bg-slate-50 rounded-2xl p-4 font-bold text-[#121421]" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuotaSettings;
