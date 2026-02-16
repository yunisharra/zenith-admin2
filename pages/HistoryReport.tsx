
import React from 'react';
import { MOCK_HISTORY } from '../constants';
import { Calendar, Download, Search } from 'lucide-react';

const HistoryReport: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-[#121421] tracking-tighter italic text-indigo-600">LAPORAN RIWAYAT</h1>
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mt-1">Log Izin & Aktivitas Harian</p>
        </div>
        <button className="bg-white border border-slate-200 text-[#121421] px-6 py-3 rounded-2xl text-[11px] font-black tracking-widest shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
          <Download size={16} />
          EKSPOR DATA
        </button>
      </header>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
           <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input type="text" placeholder="Cari laporan..." className="pl-12 pr-6 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-[#5d5fef]/20 w-80" />
           </div>
           <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl">
              <Calendar size={16} className="text-indigo-500" />
              <span className="text-xs font-black text-[#121421]">HARI INI: {new Date().toLocaleDateString('id-ID')}</span>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="px-10 py-6">Karyawan</th>
                <th className="px-10 py-6">Jenis Izin</th>
                <th className="px-10 py-6">Keluar</th>
                <th className="px-10 py-6">Masuk</th>
                <th className="px-10 py-6">Durasi</th>
                <th className="px-10 py-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MOCK_HISTORY.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-10 py-6 font-bold text-[#121421]">{log.employeeName}</td>
                  <td className="px-10 py-6 text-sm">
                    {/* Fixed log.leaveType to log.type */}
                    <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-xs font-bold">{log.type}</span>
                  </td>
                  <td className="px-10 py-6 text-sm text-slate-500">{log.timeOut}</td>
                  <td className="px-10 py-6 text-sm text-slate-500">{log.timeIn}</td>
                  {/* LeaveHistory does not have duration, calculating as placeholder */}
                  <td className="px-10 py-6 text-sm font-bold text-[#121421]">-</td>
                  <td className="px-10 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest ${
                      // Fixed comparison from 'Tepat Waktu' to 'Tepat' to match LeaveHistory status type
                      log.status === 'Tepat' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                      {log.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoryReport;
