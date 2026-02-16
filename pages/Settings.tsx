import React, { useState, useRef } from 'react';
import { Save, Clock, ShieldAlert, Zap, CheckCircle, DownloadCloud, UploadCloud, FileJson, AlertTriangle, RefreshCw } from 'lucide-react';
import { LeaveConfig } from '../types';

interface SettingsProps {
  configs: LeaveConfig[];
  setConfigs: React.Dispatch<React.SetStateAction<LeaveConfig[]>>;
  userEmail: string;
}

const Settings: React.FC<SettingsProps> = ({ configs, setConfigs, userEmail }) => {
  const [localConfigs, setLocalConfigs] = useState(configs);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdate = (type: string, field: keyof LeaveConfig, value: number) => {
    setLocalConfigs(localConfigs.map(c => 
      c.type === type ? { ...c, [field]: value } : c
    ));
  };

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setConfigs(localConfigs);
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1000);
  };

  const handleExportData = () => {
    const getDataKey = (key: string) => `zenith_user_${userEmail.replace(/[@.]/g, '_')}_${key}`;
    
    const backupData = {
      email: userEmail,
      timestamp: new Date().toISOString(),
      employees: JSON.parse(localStorage.getItem(getDataKey('employees')) || '[]'),
      shifts: JSON.parse(localStorage.getItem(getDataKey('shifts')) || '[]'),
      history: JSON.parse(localStorage.getItem(getDataKey('history')) || '[]'),
      aliases: JSON.parse(localStorage.getItem(getDataKey('aliases')) || '[]'),
      configs: JSON.parse(localStorage.getItem(getDataKey('configs')) || '[]'),
      bot_settings: JSON.parse(localStorage.getItem(getDataKey('bot_settings')) || '{}'),
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zenith_backup_${userEmail}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      // Perbaikan error TS18047: Cek target secara eksplisit
      if (!e.target || !e.target.result) return;
      
      const result = e.target.result;
      if (typeof result !== 'string') return;
      
      try {
        const data = JSON.parse(result);
        const getDataKey = (key: string) => `zenith_user_${userEmail.replace(/[@.]/g, '_')}_${key}`;

        if (confirm(`Peringatan: Mengimpor data akan menimpa semua data saat ini untuk akun ${userEmail}. Lanjutkan?`)) {
          localStorage.setItem(getDataKey('employees'), JSON.stringify(data.employees || []));
          localStorage.setItem(getDataKey('shifts'), JSON.stringify(data.shifts || []));
          localStorage.setItem(getDataKey('history'), JSON.stringify(data.history || []));
          localStorage.setItem(getDataKey('aliases'), JSON.stringify(data.aliases || []));
          localStorage.setItem(getDataKey('configs'), JSON.stringify(data.configs || []));
          localStorage.setItem(getDataKey('bot_settings'), JSON.stringify(data.bot_settings || {}));
          
          alert("✅ Data berhasil dipulihkan! Aplikasi akan memuat ulang.");
          window.location.reload();
        }
      } catch (err) {
        alert("❌ File tidak valid atau rusak.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-5xl pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-[#0f172a] tracking-tighter italic uppercase">Limit & Kuota</h1>
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mt-1">Konfigurasi Pembatasan Izin Karyawan</p>
        </div>
        <div className="flex items-center gap-4">
          {showSuccess && (
            <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest animate-in slide-in-from-right-4">
              <CheckCircle size={16} /> Data Tersimpan!
            </div>
          )}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-[#6366f1] text-white px-10 py-4 rounded-3xl text-[11px] font-black tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-500 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : <Save size={18} />}
            SIMPAN PERUBAHAN
          </button>
        </div>
      </header>

      <section className="bg-slate-900 rounded-[3.5rem] p-10 text-white overflow-hidden relative shadow-2xl">
         <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
         <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
               <div className="flex items-center gap-6">
                  <div className="bg-indigo-600 p-5 rounded-[2rem] shadow-lg shadow-indigo-500/20">
                     <FileJson size={32} />
                  </div>
                  <div>
                     <h3 className="text-2xl font-black italic uppercase tracking-tight">System Backup & Recovery</h3>
                     <p className="text-xs text-slate-400 font-medium max-w-md mt-1">Unduh semua data Anda ke dalam file JSON agar bisa dibuka kembali besok atau di komputer lain.</p>
                  </div>
               </div>
               
               <div className="flex gap-4 w-full md:w-auto">
                  <button 
                    onClick={handleExportData}
                    className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 border border-white/10 px-8 py-4 rounded-2xl transition-all group"
                  >
                     <DownloadCloud size={20} className="group-hover:-translate-y-1 transition-transform" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Unduh Cadangan</span>
                  </button>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImportData} 
                    accept=".json" 
                    className="hidden" 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 px-8 py-4 rounded-2xl shadow-xl shadow-indigo-900 transition-all group"
                  >
                     <UploadCloud size={20} className="group-hover:translate-y-1 transition-transform" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Unggah Data</span>
                  </button>
               </div>
            </div>
         </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {localConfigs.map((config, i) => (
          <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col gap-10 hover:shadow-xl transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                {config.type === 'Merokok' ? <Zap size={28} /> : config.type === 'Makan' ? <Clock size={28} /> : <ShieldAlert size={28} />}
              </div>
              <div>
                <h3 className="text-xl font-black text-[#0f172a] uppercase">{config.type}</h3>
                <p className="text-[9px] font-bold text-slate-400 tracking-widest">Kategori Izin</p>
              </div>
            </div>

            <div className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Durasi Maksimal (Menit)</label>
                 <div className="relative">
                    <input 
                      type="number" 
                      value={config.maxMinutes} 
                      onChange={e => handleUpdate(config.type, 'maxMinutes', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border-2 border-slate-50 focus:border-indigo-500/20 rounded-2xl p-4 text-xl font-black text-[#0f172a] focus:outline-none transition-all" 
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-400 uppercase">Min</span>
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kuota per Hari</label>
                 <div className="relative">
                    <input 
                      type="number" 
                      value={config.maxPerDay} 
                      onChange={e => handleUpdate(config.type, 'maxPerDay', parseInt(e.target.value) || 0)}
                      className="w-full bg-slate-50 border-2 border-slate-50 focus:border-indigo-500/20 rounded-2xl p-4 text-xl font-black text-[#0f172a] focus:outline-none transition-all" 
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-indigo-400 uppercase">Kali</span>
                 </div>
               </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-50 p-12 rounded-[3.5rem] border border-indigo-100 relative group">
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="bg-indigo-600 p-6 rounded-[2rem] text-white">
               <ShieldAlert size={40} />
            </div>
            <div className="flex-1">
               <h3 className="text-2xl font-black italic mb-2 uppercase text-indigo-900">Proteksi Limit Bot</h3>
               <p className="text-sm text-indigo-600/70 leading-relaxed font-medium">
                  Sistem ini memastikan kepatuhan karyawan. Jika limit terlampaui, bot akan otomatis menolak permintaan dan administrator akan menerima notifikasi pelanggaran.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Settings;