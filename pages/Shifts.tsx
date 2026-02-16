
import React, { useState, useEffect } from 'react';
import { 
  Plus, Clock, Briefcase, Zap, Edit, X, Trash2, Phone, Share2, 
  RefreshCw, ArrowRightLeft, ShieldCheck, AlertCircle, AlertTriangle, 
  Info, ArrowRight, CalendarDays, Lock, Timer, Sparkles, CheckCircle,
  Layout, Save
} from 'lucide-react';
import { Shift, Employee, LeaveHistory } from '../types';

interface ShiftsProps {
  shifts: Shift[];
  setShifts: React.Dispatch<React.SetStateAction<Shift[]>>;
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  setHistory: React.Dispatch<React.SetStateAction<LeaveHistory[]>>;
}

const Shifts: React.FC<ShiftsProps> = ({ shifts, setShifts, employees, setEmployees, setHistory }) => {
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'rotate' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [lastRotation, setLastRotation] = useState<string | null>(localStorage.getItem('zenith_last_rotation'));
  const [currentTime, setCurrentTime] = useState(new Date());

  const categories = ['Operasional', 'Marketing', 'Telemarketing', 'Sosmed'];

  const [formData, setFormData] = useState<Partial<Shift>>({
    name: '',
    startTime: '08:00',
    endTime: '16:00',
    category: 'Operasional',
    description: ''
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Logika Waktu Emas
  const now = currentTime;
  const isMonday = now.getDay() === 1;
  const currentHour = now.getHours();
  const isGoldenWindow = isMonday && currentHour >= 7 && currentHour < 15;
  
  const todayDateStr = now.toISOString().split('T')[0];
  const isAlreadyRotatedToday = lastRotation === todayDateStr;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'add') {
      const newShift: Shift = {
        ...(formData as Shift),
        id: 's-' + Math.random().toString(36).substr(2, 5),
      };
      setShifts([...shifts, newShift]);
    } else if (modalMode === 'edit' && editingId) {
      setShifts(shifts.map(s => 
        s.id === editingId ? { ...(formData as Shift), id: editingId } : s
      ));
    }
    closeModal();
  };

  const deleteShift = (id: string) => {
    if (confirm('Hapus shift ini? Karyawan yang terdaftar di shift ini harus dipindahkan manual.')) {
      setShifts(shifts.filter(s => s.id !== id));
    }
  };

  const executeRotation = () => {
    setIsRotating(true);
    setTimeout(() => {
      const rotatedEmployees = employees.map(emp => {
        let nextShiftId = emp.shiftId;
        // Logic: Pagi -> Malam -> Siang -> Pagi
        if (emp.shiftId === 's-pagi') nextShiftId = 's-malam';
        else if (emp.shiftId === 's-malam') nextShiftId = 's-siang';
        else if (emp.shiftId === 's-siang') nextShiftId = 's-pagi';
        
        return { ...emp, shiftId: nextShiftId };
      });

      setHistory(prev => prev.map(h => ({ 
        ...h, 
        status: h.timeIn === '--' ? 'Tepat' : h.status, 
        timeIn: h.timeIn === '--' ? 'AUTO_RESET' : h.timeIn 
      })));
      
      setEmployees(rotatedEmployees);
      localStorage.setItem('zenith_last_rotation', todayDateStr);
      setLastRotation(todayDateStr);
      
      setIsRotating(false);
      setModalMode(null);
      alert("🚀 MONDAY ENGINE SUCCESS!\n\nJadwal Pagi -> Malam (Panjang)\nJadwal Malam -> Siang (Pendek)\nJadwal Siang -> Pagi (Pendek)\n\nTelah berhasil diterapkan.");
    }, 2000);
  };

  const openEditModal = (shift: Shift) => {
    setFormData({ ...shift });
    setEditingId(shift.id);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingId(null);
    setFormData({ name: '', startTime: '08:00', endTime: '16:00', category: 'Operasional', description: '' });
  };

  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'Operasional': return { bg: 'bg-indigo-50', text: 'text-indigo-600', icon: <Briefcase size={24} />, border: 'border-indigo-100' };
      case 'Marketing': return { bg: 'bg-rose-50', text: 'text-rose-600', icon: <Zap size={24} />, border: 'border-rose-100' };
      case 'Telemarketing': return { bg: 'bg-amber-50', text: 'text-amber-600', icon: <Phone size={24} />, border: 'border-amber-100' };
      case 'Sosmed': return { bg: 'bg-sky-50', text: 'text-sky-600', icon: <Share2 size={24} />, border: 'border-sky-100' };
      default: return { bg: 'bg-slate-50', text: 'text-slate-600', icon: <Clock size={24} />, border: 'border-slate-100' };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#0f172a] tracking-tighter italic uppercase">Management Shift</h1>
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mt-1">Konfigurasi Jadwal & Analisis Recovery</p>
        </div>
        <div className="flex gap-4 w-full lg:w-auto">
          <button 
            onClick={() => setModalMode('rotate')}
            className={`flex-1 lg:flex-none px-8 py-4 rounded-3xl text-[11px] font-black tracking-widest shadow-xl transition-all flex items-center justify-center gap-2 ${
              isMonday ? 'bg-amber-500 text-white shadow-amber-500/20 hover:bg-amber-600' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <RefreshCw size={18} strokeWidth={3} className={isRotating ? "animate-spin" : ""} />
            ROLLING SENIN
          </button>
          <button 
            onClick={() => setModalMode('add')}
            className="flex-1 lg:flex-none bg-[#6366f1] text-white px-8 py-4 rounded-3xl text-[11px] font-black tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={18} strokeWidth={3} />
            TAMBAH SHIFT
          </button>
        </div>
      </header>

      {/* Monday Engine Status Dashboard */}
      <div className="bg-[#0f172a] p-10 rounded-[4rem] text-white overflow-hidden relative shadow-2xl border-b-8 border-amber-500">
         <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
         <div className="relative z-10 space-y-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10">
               <div className="flex items-center gap-6">
                  <div className={`p-6 rounded-[2.5rem] shadow-lg transition-all duration-700 ${isGoldenWindow ? 'bg-amber-500 scale-110 animate-pulse' : 'bg-slate-800'}`}>
                     {isGoldenWindow ? <Sparkles size={36} /> : <Timer size={36} />}
                  </div>
                  <div>
                     <h3 className="text-2xl font-black italic uppercase tracking-tight">Recovery Intelligence</h3>
                     <div className="flex flex-wrap items-center gap-2 mt-2">
                        {isMonday && !isAlreadyRotatedToday ? (
                           <div className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/20 ${isGoldenWindow ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                              {isGoldenWindow ? <ShieldCheck size={12} /> : <AlertTriangle size={12} />}
                              {isGoldenWindow ? 'SAFE WINDOW: AMAN EKSEKUSI' : 'RISKY WINDOW: HARAP WASPADA'}
                           </div>
                        ) : (
                           <div className="flex items-center gap-1.5 bg-white/10 text-slate-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                              <Lock size={12} /> AUTOMATIC LOCK ACTIVE
                           </div>
                        )}
                     </div>
                  </div>
               </div>
               
               <div className="bg-slate-800/50 p-6 rounded-3xl border border-white/5 flex gap-8">
                  <div className="text-center">
                     <p className="text-[9px] font-black text-slate-500 uppercase">Waktu Sekarang</p>
                     <p className="text-xl font-black text-amber-400">{now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="w-px h-10 bg-white/10" />
                  <div className="text-center">
                     <p className="text-[9px] font-black text-slate-500 uppercase">Status Hari</p>
                     <p className="text-xl font-black text-white">{now.toLocaleDateString('id-ID', { weekday: 'long' })}</p>
                  </div>
               </div>
            </div>

            {/* Logical Path Visualization */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
               {[
                 { from: 'PAGI', to: 'MALAM', type: 'MALAM PANJANG', color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                 { from: 'MALAM', to: 'SIANG', type: 'MALAM PENDEK', color: 'text-rose-400', bg: 'bg-rose-500/10' },
                 { from: 'SIANG', to: 'PAGI', type: 'MALAM PENDEK', color: 'text-rose-400', bg: 'bg-rose-500/10' }
               ].map((path, i) => (
                 <div key={i} className={`border border-white/10 p-8 rounded-[2.5rem] flex flex-col items-center gap-3 transition-all hover:bg-white/5 ${path.bg}`}>
                    <div className="flex items-center gap-4">
                       <span className="text-xs font-black text-slate-400">{path.from}</span>
                       <ArrowRight className="text-amber-500" size={16} />
                       <span className="text-xs font-black text-white">{path.to}</span>
                    </div>
                    <div className={`text-[10px] font-black uppercase tracking-[0.2em] ${path.color}`}>
                       {path.type}
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {/* Shift List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {shifts.map((shift) => {
          const style = getCategoryStyles(shift.category);
          return (
            <div key={shift.id} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col gap-8 group hover:shadow-2xl hover:-translate-y-1 transition-all relative overflow-hidden">
               <div className={`absolute top-0 right-0 w-24 h-24 -mr-12 -mt-12 rounded-full opacity-10 ${style.text.replace('text', 'bg')}`} />
               
               <div className="flex justify-between items-start">
                  <div className={`p-5 rounded-2xl ${style.bg} ${style.text}`}>
                    {style.icon}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditModal(shift)} className="p-2 text-slate-300 hover:text-indigo-600 transition-all"><Edit size={18} /></button>
                    <button onClick={() => deleteShift(shift.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-all"><Trash2 size={18} /></button>
                  </div>
               </div>

               <div>
                 <p className={`text-[10px] font-black tracking-widest uppercase mb-1 ${style.text}`}>{shift.category}</p>
                 <h3 className="text-2xl font-black text-[#0f172a]">{shift.name}</h3>
                 <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed line-clamp-2">
                    {shift.description || 'Tidak ada deskripsi tambahan untuk shift ini.'}
                 </p>
               </div>

               <div className="mt-auto bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <Clock className="text-indigo-500" size={18} />
                     <span className="text-lg font-black text-[#0f172a]">{shift.startTime} - {shift.endTime}</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/40`} />
               </div>
            </div>
          );
        })}
      </div>

      {/* Modal Add/Edit Shift */}
      {(modalMode === 'add' || modalMode === 'edit') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0f172a]/90 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/20">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                 <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-3 rounded-xl text-white">
                       <Edit size={20} />
                    </div>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter">{modalMode === 'add' ? 'Buat Shift Baru' : 'Edit Konfigurasi Shift'}</h3>
                 </div>
                 <button onClick={closeModal} className="p-2 hover:bg-white rounded-full"><X size={24} /></button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-10 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Shift</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold"
                      placeholder="Contoh: Pagi Ops / Marketing Siang"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jam Masuk</label>
                       <input 
                         required
                         type="time" 
                         value={formData.startTime}
                         onChange={e => setFormData({...formData, startTime: e.target.value})}
                         className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jam Keluar</label>
                       <input 
                         required
                         type="time" 
                         value={formData.endTime}
                         onChange={e => setFormData({...formData, endTime: e.target.value})}
                         className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold"
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Departemen / Kategori</label>
                    <select 
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value as any})}
                      className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold"
                    >
                      {categories.map(cat => <option key={cat} value={cat}>{cat.toUpperCase()}</option>)}
                    </select>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Deskripsi Opsional</label>
                    <textarea 
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold resize-none"
                      rows={2}
                      placeholder="Catatan tambahan untuk shift ini..."
                    />
                 </div>

                 <button type="submit" className="w-full bg-indigo-600 text-white font-black py-5 rounded-3xl shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3">
                    <Save size={18} />
                    {modalMode === 'add' ? 'SIMPAN SHIFT' : 'UPDATE SHIFT'}
                 </button>
              </form>
           </div>
        </div>
      )}

      {/* Modal Confirm Rotation (Existing Guard) */}
      {modalMode === 'rotate' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0f172a]/95 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-xl rounded-[3.5rem] shadow-2xl overflow-hidden border border-white/20">
              <div className={`p-10 border-b border-slate-100 text-white flex justify-between items-center ${!isMonday ? 'bg-rose-500' : isAlreadyRotatedToday ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                 <div className="flex items-center gap-4">
                    {!isMonday ? <AlertTriangle size={32} /> : isAlreadyRotatedToday ? <ShieldCheck size={32} /> : <RefreshCw className={isRotating ? "animate-spin" : ""} size={32} />}
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">
                       {!isMonday ? 'System Locked' : isAlreadyRotatedToday ? 'Success' : 'Monday Rotation'}
                    </h3>
                 </div>
                 <button onClick={closeModal} className="p-2 hover:bg-black/10 rounded-full transition-all"><X size={24} /></button>
              </div>
              
              <div className="p-12 space-y-8 text-center">
                 {!isMonday ? (
                    <div className="space-y-6">
                       <CalendarDays size={64} className="mx-auto text-rose-500" />
                       <p className="text-sm font-bold text-slate-600 leading-relaxed">
                          Aksi rotasi hanya diperbolehkan pada hari <span className="text-rose-600 font-black">SENIN</span>. Hal ini untuk mencegah kerancuan data mingguan.
                       </p>
                       <button onClick={closeModal} className="w-full bg-slate-100 text-slate-600 font-black py-5 rounded-2xl uppercase tracking-widest text-[10px]">Tutup</button>
                    </div>
                 ) : isAlreadyRotatedToday ? (
                    <div className="space-y-6">
                       <CheckCircle size={64} className="mx-auto text-emerald-500" />
                       <p className="text-sm font-bold text-slate-600">Rotasi minggu ini sudah berhasil dilakukan. Menekan tombol lagi akan merusak siklus jadwal.</p>
                       <button onClick={closeModal} className="w-full bg-slate-100 text-slate-600 font-black py-5 rounded-2xl uppercase tracking-widest text-[10px]">Kembali</button>
                    </div>
                 ) : (
                    <>
                       <div className={`p-8 rounded-[2.5rem] border ${isGoldenWindow ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'} text-left space-y-4`}>
                          <div className="flex items-center gap-3">
                             <Info size={20} className={isGoldenWindow ? 'text-emerald-500' : 'text-amber-500'} />
                             <span className="font-black text-xs uppercase tracking-widest">Waktu Terdeteksi</span>
                          </div>
                          <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
                             {isGoldenWindow 
                               ? "Sekarang adalah Jendela Emas (07:00-15:00). Aman untuk melakukan rotasi tanpa mengganggu operasional karyawan malam yang baru pulang."
                               : "Peringatan: Anda berada di luar jam rekomendasi. Disarankan menunggu hingga jam 07:00 pagi besok Senin."}
                          </p>
                       </div>

                       <div className="space-y-4">
                          <button 
                             onClick={executeRotation}
                             disabled={isRotating}
                             className="w-full bg-slate-900 text-white font-black py-6 rounded-3xl shadow-xl hover:bg-black transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-3"
                          >
                             {isRotating ? <RefreshCw className="animate-spin" size={18} /> : <ArrowRightLeft size={18} />}
                             KONFIRMASI EKSEKUSI
                          </button>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Aksi ini akan meriset kuota izin karyawan.</p>
                       </div>
                    </>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Shifts;
