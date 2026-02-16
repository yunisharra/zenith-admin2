
import React, { useState, useMemo } from 'react';
import { Search, Plus, Filter, Edit, Trash2, Clock, X, Briefcase } from 'lucide-react';
import { Employee, Shift } from '../types';

interface EmployeesProps {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  shifts: Shift[];
}

const Employees: React.FC<EmployeesProps> = ({ employees, setEmployees, shifts }) => {
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('Semua Role');
  const [shiftFilter, setShiftFilter] = useState<string>('Semua Shift');
  
  const [formData, setFormData] = useState<Partial<Employee>>({
    name: '',
    username: '',
    telegramId: '',
    role: 'Operasional',
    shiftId: shifts[0]?.id || '',
    status: 'Aktif'
  });

  // Role list defined here to keep it consistent
  const roles: Employee['role'][] = ['Operasional', 'Marketing', 'Telemarketing', 'Sosmed'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'add') {
      const newEmp: Employee = {
        ...(formData as Employee),
        id: 'emp-' + Math.random().toString(36).substr(2, 9),
      };
      setEmployees([newEmp, ...employees]);
    } else if (modalMode === 'edit' && editingId) {
      setEmployees(employees.map(emp => 
        emp.id === editingId ? { ...(formData as Employee), id: editingId } : emp
      ));
    }
    closeModal();
  };

  const openEditModal = (emp: Employee) => {
    setFormData({ ...emp });
    setEditingId(emp.id);
    setModalMode('edit');
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingId(null);
    setFormData({ name: '', username: '', telegramId: '', role: 'Operasional', shiftId: shifts[0]?.id || '', status: 'Aktif' });
  };

  const handleDelete = (id: string) => {
    if (confirm('Hapus karyawan ini?')) {
      setEmployees(employees.filter(e => e.id !== id));
    }
  };

  const getRoleBadgeStyles = (role: string) => {
    switch (role) {
      case 'Operasional': return 'bg-indigo-50 text-indigo-500';
      case 'Marketing': return 'bg-rose-50 text-rose-500';
      case 'Telemarketing': return 'bg-amber-50 text-amber-500';
      case 'Sosmed': return 'bg-sky-50 text-sky-500';
      default: return 'bg-slate-50 text-slate-500';
    }
  };

  // Logic Filtering - Menggunakan useMemo agar performa tetap cepat saat data banyak
  const filtered = useMemo(() => {
    return employees.filter(e => {
      const searchLower = search.toLowerCase();
      const matchSearch = e.name.toLowerCase().includes(searchLower) || 
                         e.username.toLowerCase().includes(searchLower) ||
                         e.telegramId.includes(search);
      
      const matchRole = roleFilter === 'Semua Role' || e.role === roleFilter;
      const matchShift = shiftFilter === 'Semua Shift' || e.shiftId === shiftFilter;

      return matchSearch && matchRole && matchShift;
    });
  }, [employees, search, roleFilter, shiftFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-[#0f172a] tracking-tighter italic uppercase">Data Karyawan</h1>
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mt-1">Total: {filtered.length} Karyawan Terfilter</p>
        </div>
        <button 
          onClick={() => setModalMode('add')}
          className="bg-[#6366f1] text-white px-8 py-4 rounded-3xl text-[11px] font-black tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 transition-all flex items-center gap-2"
        >
          <Plus size={18} strokeWidth={3} />
          TAMBAH KARYAWAN
        </button>
      </header>

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex flex-col xl:flex-row gap-6 items-center justify-between bg-slate-50/20">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, ID, atau username..." 
              className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold shadow-sm"
            />
          </div>
          
          <div className="flex flex-wrap gap-4 w-full xl:w-auto">
             {/* Filter Role (Kategori) */}
             <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm min-w-[180px]">
                <Briefcase size={16} className="text-slate-400" />
                <select 
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest focus:ring-0 w-full cursor-pointer"
                >
                  <option>Semua Role</option>
                  {roles.map(role => <option key={role} value={role}>{role.toUpperCase()}</option>)}
                </select>
             </div>

             {/* Filter Shift - Otomatis terupdate jika ada shift baru di menu "Atur Shift" */}
             <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm min-w-[200px]">
                <Clock size={16} className="text-slate-400" />
                <select 
                  value={shiftFilter}
                  onChange={(e) => setShiftFilter(e.target.value)}
                  className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest focus:ring-0 w-full cursor-pointer"
                >
                  <option>Semua Shift</option>
                  {shifts.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                </select>
             </div>

             {(search || roleFilter !== 'Semua Role' || shiftFilter !== 'Semua Shift') && (
               <button 
                onClick={() => {
                  setSearch('');
                  setRoleFilter('Semua Role');
                  setShiftFilter('Semua Shift');
                }}
                className="flex items-center gap-2 text-rose-500 hover:text-rose-600 px-4 text-[10px] font-black uppercase tracking-widest"
               >
                 <X size={14} /> Reset
               </button>
             )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="px-10 py-6">Profil Karyawan</th>
                <th className="px-10 py-6">Username / ID</th>
                <th className="px-10 py-6">Shift & Kategori</th>
                <th className="px-10 py-6">Status</th>
                <th className="px-10 py-6 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((emp) => {
                const shift = shifts.find(s => s.id === emp.shiftId);
                return (
                  <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center font-black text-indigo-600 border border-indigo-100 uppercase">
                           {emp.name.charAt(0)}
                         </div>
                         <h4 className="font-black text-[#0f172a] text-lg">{emp.name}</h4>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <p className="text-sm font-bold text-slate-700">{emp.username}</p>
                      <p className="text-[10px] font-bold text-slate-400">ID: {emp.telegramId}</p>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex flex-col gap-1">
                        <span className="flex items-center gap-1.5 text-xs font-black text-indigo-600">
                          <Clock size={12} /> {shift?.name || 'Manual'}
                        </span>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full w-fit ${getRoleBadgeStyles(emp.role)}`}>
                          {emp.role}
                        </span>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${emp.status === 'Aktif' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        <span className="text-xs font-black text-slate-700">{emp.status}</span>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right">
                       <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => openEditModal(emp)}
                            className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:shadow-md transition-all"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(emp.id)}
                            className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-rose-500 hover:shadow-md transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                       </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-20 text-center text-slate-400 uppercase font-black text-xs tracking-widest flex flex-col items-center gap-4">
               <div className="p-6 bg-slate-50 rounded-full">
                 <Search size={32} className="opacity-20" />
               </div>
               Data tidak ditemukan dengan filter saat ini
            </div>
          )}
        </div>
      </div>

      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#0f172a]/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden border border-white/20">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
               <h3 className="text-xl font-black italic uppercase">{modalMode === 'add' ? 'TAMBAH KARYAWAN' : 'UBAH DATA KARYAWAN'}</h3>
               <button onClick={closeModal} className="p-2 hover:bg-white rounded-xl transition-all"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-10 space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap</label>
                 <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold" 
                  placeholder="Contoh: Rafly Zenith" 
                 />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Username Telegram</label>
                    <input 
                      required
                      type="text" 
                      value={formData.username}
                      onChange={e => setFormData({...formData, username: e.target.value})}
                      className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold" 
                      placeholder="@username" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Telegram ID</label>
                    <input 
                      required
                      type="text" 
                      value={formData.telegramId}
                      onChange={e => setFormData({...formData, telegramId: e.target.value})}
                      className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold" 
                      placeholder="87654321" 
                    />
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Departemen / Role</label>
                    <select 
                      value={formData.role}
                      onChange={e => setFormData({...formData, role: e.target.value as any})}
                      className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold"
                    >
                      {roles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Shift</label>
                    <select 
                      value={formData.shiftId}
                      onChange={e => setFormData({...formData, shiftId: e.target.value})}
                      className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold"
                    >
                      {shifts.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status Keaktifan</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                    className="w-full bg-slate-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-indigo-500/20 text-sm font-bold"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
               </div>
               <button type="submit" className="w-full bg-indigo-600 text-white font-black py-5 rounded-3xl shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs mt-4">
                 {modalMode === 'add' ? 'Simpan Karyawan' : 'Update Karyawan'}
               </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
