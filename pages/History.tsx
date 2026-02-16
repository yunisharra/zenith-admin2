
import React, { useState, useMemo } from 'react';
import { Calendar, Download, Search, History as HistoryIcon, Trash2, ChevronLeft, ChevronRight, BarChart3, X } from 'lucide-react';
import { LeaveHistory } from '../types';

interface HistoryProps {
  history: LeaveHistory[];
  setHistory: React.Dispatch<React.SetStateAction<LeaveHistory[]>>;
}

const History: React.FC<HistoryProps> = ({ history, setHistory }) => {
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Logika Filter: Filter berdasarkan tanggal yang dipilih DAN pencarian
  const filtered = useMemo(() => {
    return history.filter(h => {
      const matchDate = h.date === selectedDate;
      const matchSearch = h.employeeName.toLowerCase().includes(search.toLowerCase()) || 
                         h.type.toLowerCase().includes(search.toLowerCase());
      return matchDate && matchSearch;
    });
  }, [history, selectedDate, search]);

  const stats = useMemo(() => {
    const dailyData = history.filter(h => h.date === selectedDate);
    return {
      total: dailyData.length,
      tepat: dailyData.filter(d => d.status === 'Tepat').length,
      telat: dailyData.filter(d => d.status === 'Telat').length,
      ongoing: dailyData.filter(d => d.timeIn === '--').length
    };
  }, [history, selectedDate]);

  const calculateDuration = (out: string, cin: string) => {
    if (cin === '--') return '-';
    const [hOut, mOut] = out.split(':').map(Number);
    const [hIn, mIn] = cin.split(':').map(Number);
    const diff = (hIn * 60 + mIn) - (hOut * 60 + mOut);
    return `${diff} Menit`;
  };

  const changeDate = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const deleteItem = (id: string) => {
    if (confirm('Hapus entri log ini? Tindakan ini tidak dapat dibatalkan.')) {
      setHistory(prev => prev.filter(h => h.id !== id));
    }
  };

  const clearHistory = () => {
    if (confirm('Hapus SEMUA histori data?')) {
      setHistory([]);
    }
  };

  const formatDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#0f172a] tracking-tighter italic uppercase">Laporan Harian</h1>
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mt-1">Audit Log Kehadiran & Izin</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-[2rem] shadow-sm border border-slate-100 w-full md:w-auto">
          <button 
            onClick={() => changeDate(-1)}
            className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 rounded-2xl border border-indigo-100">
            <Calendar className="text-indigo-500" size={18} />
            <input 
              type="date" 
              value={selectedDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent border-none text-xs font-black text-indigo-600 focus:ring-0 cursor-pointer uppercase tracking-widest"
            />
          </div>

          <button 
            onClick={() => changeDate(1)}
            disabled={selectedDate === new Date().toISOString().split('T')[0]}
            className="p-3 hover:bg-slate-50 rounded-2xl text-slate-400 disabled:opacity-20 transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Izin', value: stats.total, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Tepat', value: stats.tepat, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Telat', value: stats.telat, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Ongoing', value: stats.ongoing, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} p-6 rounded-[2rem] border border-white/50 flex flex-col items-center justify-center text-center shadow-sm`}>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{s.label}</p>
            <h4 className={`text-2xl font-black ${s.color}`}>{s.value}</h4>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex flex-col lg:flex-row gap-6 items-center justify-between bg-slate-50/30">
           <div className="flex items-center gap-4">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                 <BarChart3 className="text-indigo-500" size={20} />
                 <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Menampilkan Laporan</p>
                    <p className="text-sm font-black text-[#0f172a] uppercase mt-1">{formatDateLabel(selectedDate)}</p>
                 </div>
              </div>
           </div>

           <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
              <div className="relative flex-1 lg:min-w-[300px]">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text" 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Cari nama atau tipe izin..." 
                  className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold shadow-sm" 
                />
              </div>
              <button className="bg-[#0f172a] text-white px-8 py-4 rounded-[1.5rem] text-[10px] font-black tracking-widest shadow-xl shadow-slate-900/20 hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95">
                <Download size={16} /> DOWNLOAD LAPORAN
              </button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="px-10 py-6">Karyawan</th>
                <th className="px-10 py-6">Kategori</th>
                <th className="px-10 py-6">Waktu (Out → In)</th>
                <th className="px-10 py-6">Durasi</th>
                <th className="px-10 py-6">Status</th>
                <th className="px-10 py-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center font-black text-indigo-600 text-sm border border-indigo-100 uppercase">
                         {log.employeeName.charAt(0)}
                       </div>
                       <span className="font-black text-[#0f172a] text-base">{log.employeeName}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className="bg-slate-100 text-slate-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200">
                      {log.type}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-2 text-sm font-black text-slate-700">
                      <span className="bg-rose-50 text-rose-500 px-3 py-1 rounded-lg border border-rose-100">{log.timeOut}</span>
                      <span className="text-slate-300">→</span>
                      <span className={`px-3 py-1 rounded-lg border ${log.timeIn === '--' ? 'bg-amber-50 text-amber-500 border-amber-100' : 'bg-emerald-50 text-emerald-500 border-emerald-100'}`}>
                        {log.timeIn}
                      </span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-sm font-black text-indigo-600 italic">
                    {calculateDuration(log.timeOut, log.timeIn)}
                  </td>
                  <td className="px-10 py-6">
                    <span className={`inline-block min-w-[70px] text-center px-4 py-2 rounded-2xl text-[9px] font-black tracking-widest ${
                      log.timeIn === '--' ? 'bg-amber-100 text-amber-600' : 
                      log.status === 'Tepat' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                    }`}>
                      {(log.timeIn === '--' ? 'PROSES' : log.status).toUpperCase()}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <button 
                        onClick={() => deleteItem(log.id)}
                        className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                    >
                        <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-32 text-center text-slate-400 uppercase font-black text-xs tracking-[0.2em] flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                 <HistoryIcon size={32} />
              </div>
              Belum ada data laporan pada tanggal ini
            </div>
          )}
        </div>

        <div className="p-8 bg-slate-50/50 flex items-center justify-between">
           <div className="flex items-center gap-3 text-slate-400">
              <HistoryIcon size={16} />
              <p className="text-[10px] font-bold uppercase tracking-widest italic">Patuhi regulasi penyimpanan data untuk keperluan audit HR</p>
           </div>
           <button 
            onClick={clearHistory}
            className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline flex items-center gap-2 opacity-50 hover:opacity-100 transition-all"
           >
            <X size={14} /> BERSIHKAN SEMUA DATA
          </button>
        </div>
      </div>
    </div>
  );
};

export default History;
