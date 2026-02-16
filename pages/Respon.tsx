
import React, { useState } from 'react';
import { MessageSquare, Save, Info, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { LeaveConfig } from '../types';

interface ResponProps {
  configs: LeaveConfig[];
  setConfigs: React.Dispatch<React.SetStateAction<LeaveConfig[]>>;
}

const Respon: React.FC<ResponProps> = ({ configs, setConfigs }) => {
  const [localConfigs, setLocalConfigs] = useState(configs);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleUpdate = (type: string, field: 'responseTemplate' | 'warningTemplate', value: string) => {
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
    }, 800);
  };

  const resetToDefault = (type: string) => {
    const defaultRes: Record<string, string> = {
      'Merokok': 'Izin merokok diterima. ({durasi} menit)',
      'Makan': 'Selamat makan. Izin dikonfirmasi {durasi} menit.',
      'Ibadah': 'Izin ibadah diterima. Waktu Anda {durasi} menit.',
      'Toilet': 'Izin ke toilet diterima. ({durasi} menit)'
    };
    const defaultWarn: Record<string, string> = {
      'Merokok': '{username} WOI BALIK! Waktu udud sudah lewat {lewat} menit!',
      'Makan': '{username} makan mulu! Cepat kembali, sudah telat {lewat} menit!',
      'Ibadah': '{username} segera kembali, waktu ibadah sudah lewat {lewat} menit.',
      'Toilet': '{username} ke toilet atau bertelur? Sudah lewat {lewat} menit!'
    };
    
    setLocalConfigs(localConfigs.map(c => 
      c.type === type ? { ...c, responseTemplate: defaultRes[type], warningTemplate: defaultWarn[type] } : c
    ));
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-[1400px] mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-[#0f172a] tracking-tighter italic uppercase">Respon Bot</h1>
          <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase mt-1">Atur Template Pesan Konfirmasi & Peringatan Telat</p>
        </div>
        <div className="flex items-center gap-4">
          {showSuccess && (
            <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest animate-in slide-in-from-right-4">
              <CheckCircle size={16} /> Berhasil Diupdate!
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {localConfigs.map((config) => (
          <div key={config.type} className="bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 flex flex-col gap-8 hover:shadow-xl transition-all border-l-8 border-l-transparent hover:border-l-indigo-500">
            <div className="flex justify-between items-center">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-black italic">
                    {config.type.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[#0f172a] uppercase">{config.type}</h3>
                    <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">Konfigurasi Pesan</p>
                  </div>
               </div>
               <button onClick={() => resetToDefault(config.type)} className="p-2 text-slate-300 hover:text-indigo-600 transition-all"><RefreshCw size={16} /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               {/* Template Konfirmasi */}
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={14} className="text-emerald-500" /> Pesan Konfirmasi Izin
                  </label>
                  <textarea 
                    value={config.responseTemplate}
                    onChange={(e) => handleUpdate(config.type, 'responseTemplate', e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border-2 border-slate-50 focus:border-emerald-500/20 rounded-[2rem] p-6 text-sm font-bold text-[#0f172a] focus:outline-none transition-all resize-none"
                    placeholder="Contoh: Izin diterima..."
                  />
                  <div className="text-[9px] font-black text-slate-400 italic">Tag: {"{durasi}"}</div>
               </div>

               {/* Template Peringatan */}
               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle size={14} className="text-rose-500" /> Pesan Peringatan Telat
                  </label>
                  <textarea 
                    value={config.warningTemplate}
                    onChange={(e) => handleUpdate(config.type, 'warningTemplate', e.target.value)}
                    rows={3}
                    className="w-full bg-slate-50 border-2 border-slate-50 focus:border-rose-500/20 rounded-[2rem] p-6 text-sm font-bold text-[#0f172a] focus:outline-none transition-all resize-none"
                    placeholder="Contoh: @username cepat balik..."
                  />
                  <div className="text-[9px] font-black text-slate-400 italic">Tag: {"{username}"}, {"{lewat}"}</div>
               </div>
            </div>

            <div className="bg-[#0f172a] rounded-[2.5rem] p-8 text-white/90 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10"><Info size={40} /></div>
               <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3">Preview Output Bot:</p>
               <div className="space-y-3 font-medium text-xs leading-relaxed">
                  <div className="flex gap-2">
                    <span className="text-emerald-400 font-black flex-shrink-0">START:</span>
                    <span>"{config.responseTemplate?.replace('{durasi}', config.maxMinutes.toString())}"</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-rose-400 font-black flex-shrink-0">WARN:</span>
                    <span>"{config.warningTemplate?.replace('{username}', '@raflyz').replace('{lewat}', '5')}"</span>
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Respon;
