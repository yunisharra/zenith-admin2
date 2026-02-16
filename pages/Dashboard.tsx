import React, { useState, useEffect, useMemo } from 'react';
import { Users, Timer, ShieldCheck, Zap, Clock, CheckCircle2, LayoutGrid, Download, HardDrive, Shield, CloudOff, RefreshCw, TrendingUp, BarChart3 } from 'lucide-react';
import { Employee, LeaveHistory, Shift, LeaveConfig } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  employees: Employee[];
  history: LeaveHistory[];
  shifts: Shift[];
  setHistory: React.Dispatch<React.SetStateAction<LeaveHistory[]>>;
  configs: LeaveConfig[];
}

const Dashboard: React.FC<DashboardProps> = ({ employees, history, shifts, setHistory, configs }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const totalActive = employees.filter(e => e.status === 'Aktif').length;
  const lateReturn = history.filter(h => h.status === 'Telat').length;
  const todayStr = new Date().toISOString().split('T')[0];

  const todayHistory = history
    .filter(h => h.date === todayStr)
    .sort((a, b) => b.id.localeCompare(a.id));

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayData = history.filter(h => h.date === date);
      return {
        name: new Date(date).toLocaleDateString('id-ID', { weekday: 'short' }),
        total: dayData.length,
        telat: dayData.filter(h => h.status === 'Telat').length,
      };
    });
  }, [history]);

  const handleDownloadPack = () => {
    const backupData = {
      appName: "Zenith Bot Admin Panel",
      exportDate: new Date().toLocaleString(),
      database: {
        employees,
        shifts,
        history,
        configs
      }
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ZENITH_PACK_${todayStr}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleMarkReturned = (id: string) => {
    const now = new Date();
    const timeInStr = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');
    
    setHistory(prev => prev.map(item => {
      if (item.id === id) {
        const config = configs.find(c => c.type === item.type);
        const [hOut, mOut] = item.timeOut.split(':').map(Number);
        const [hIn, mIn] = timeInStr.split(':').map(Number);
        const duration = (hIn * 60 + mIn) - (hOut * 60 + mOut);
        const isLate = config ? duration > config.maxMinutes : false;

        return {
          ...item,
          timeIn: timeInStr,
          status: isLate ? 'Telat' : 'Tepat'
        };
      }
      return item;
    }));
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#0f172a] tracking-tighter italic uppercase">Dashboard Utama</h1>
          <div className="flex items-center gap-2 mt-1">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">System Online & Offline Local Storage Aktif</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <button 
             onClick={handleDownloadPack}
             className="flex items-center gap-3 px-6 py-4 rounded-[1.5rem] bg-[#0f172a] text-white text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200"
           >
              <Download size={18} /> DOWNLOAD SYSTEM PACK
           </button>
           <div className="flex items-center gap-4 bg-white p-4 rounded-3xl shadow-sm border border-slate-100">
             <Clock className="text-indigo-500" size={20} />
             <span className="text-lg font-black text-[#0f172a]">{time.toLocaleTimeString('id-ID')}</span>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Karyawan Terdaftar', value: totalActive, icon: <Users />, color: 'bg-indigo-600' },
          { label: 'Total Izin Hari Ini', value: todayHistory.length, icon: <Timer />, color: 'bg-orange-500' },
          { label: 'Pelanggaran Terdeteksi', value: lateReturn, icon: <ShieldCheck />, color: 'bg-rose-500' },
          { label: 'System Health', value: '100%', icon: <Shield />, color: 'bg-emerald-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className={`${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg`}>
              {stat.icon}
            </div>
            <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase mb-1">{stat.label}</p>
            <h3 className="text-3xl font-black text-[#0f172a]">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h3 className="text-xl font-black text-[#0f172a] italic uppercase tracking-tight flex items-center gap-2">
                        <TrendingUp size={20} className="text-indigo-600" /> Analisis Izin (7 Hari)
                    </h3>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl text-indigo-600 text-[10px] font-black uppercase">
                   <BarChart3 size={14} /> Live Chart
                </div>
            </div>
            
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} />
                        <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '15px' }}
                            itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                        />
                        <Bar dataKey="total" fill="#6366f1" radius={[10, 10, 0, 0]} barSize={40} />
                        <Bar dataKey="telat" fill="#f43f5e" radius={[10, 10, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-[#0f172a] rounded-[3rem] p-10 text-white shadow-2xl flex flex-col gap-8">
           <div className="flex items-center justify-between">
              <h3 className="text-xl font-black italic uppercase">Izin Berjalan</h3>
              <div className="p-2 bg-white/10 rounded-xl">
                 <RefreshCw size={18} className="animate-spin text-indigo-400" />
              </div>
           </div>
           
           <div className="space-y-4 overflow-y-auto max-h-[400px] custom-scrollbar pr-2">
              {todayHistory.length > 0 ? todayHistory.slice(0, 6).map((user, i) => (
                <div key={i} className="bg-white/5 p-5 rounded-3xl border border-white/5 hover:bg-white/10 transition-all flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center font-black text-white text-sm">
                       {user.employeeName.charAt(0)}
                     </div>
                     <div>
                        <p className="text-xs font-black">{user.employeeName}</p>
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{user.type} • {user.timeOut}</p>
                     </div>
                  </div>
                  <div className="text-right">
                     {user.timeIn === '--' ? (
                        <button 
                          onClick={() => handleMarkReturned(user.id)}
                          className="text-[8px] font-black bg-emerald-600 hover:bg-emerald-500 px-4 py-2 rounded-xl transition-all uppercase tracking-widest"
                        >
                          MASUK
                        </button>
                     ) : (
                        <span className={`text-[9px] font-black uppercase tracking-widest ${user.status === 'Tepat' ? 'text-emerald-500' : 'text-rose-500'}`}>
                           {user.status}
                        </span>
                     )}
                  </div>
                </div>
              )) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-600 italic text-center gap-4">
                    <CloudOff size={32} className="opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Database Kosong</p>
                </div>
              )}
           </div>

           <div className="mt-auto pt-6 border-t border-white/5">
              <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl">
                 <Shield className="text-indigo-400" size={16} />
                 <p className="text-[9px] font-bold text-slate-400 uppercase leading-relaxed">
                   Data disimpan secara lokal di browser Anda. Jangan lupa unduh System Pack secara berkala.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;