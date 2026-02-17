
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Mail, Lock, ArrowRight, Loader2, 
  Cloud, LogIn, KeyRound, DatabaseZap, Globe, UserCheck, AlertCircle, CheckCircle2, Server
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface LoginProps {
  onLogin: (email: string, cloudUrl?: string, cloudKey?: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [knownUsers, setKnownUsers] = useState<string[]>([]);

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('zenith_known_users') || '[]');
    setKnownUsers(users);
    if (users.length > 0) {
      setMode('login');
      setEmail(users[0]);
    }
  }, []);

  const validateAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const targetUrl = mode === 'register' ? supabaseUrl : localStorage.getItem(`zenith_cloud_url_${email.replace(/[@.]/g, '_')}`);
    const targetKey = mode === 'register' ? supabaseKey : localStorage.getItem(`zenith_cloud_key_${email.replace(/[@.]/g, '_')}`);

    if (!targetUrl || !targetKey) {
      setError('Data Cloud (URL/Key) tidak ditemukan untuk email ini. Silakan gunakan menu "Hubungkan Baru".');
      setMode('register');
      setIsLoading(false);
      return;
    }

    try {
      // Validasi koneksi Supabase sebelum masuk
      const supabase = createClient(targetUrl, targetKey);
      const { error: connError } = await supabase.from('profiles').select('count').limit(1).maybeSingle();
      
      // Jika errornya adalah tabel tidak ada (42P01), kita tetap izinkan masuk tapi beri peringatan nanti
      if (connError && !connError.message.includes('relation "profiles" does not exist')) {
        throw new Error(connError.message);
      }

      // Berhasil tervalidasi
      onLogin(email, mode === 'register' ? targetUrl : undefined, mode === 'register' ? targetKey : undefined);
    } catch (err: any) {
      console.error("Connection Failed:", err);
      setError('Koneksi Gagal: ' + (err.message || 'Periksa kembali URL dan Anon Key Anda.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[150px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[100px]" />
      
      <div className="w-full max-w-[500px] z-10 space-y-10 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-5">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-indigo-500 to-indigo-800 rounded-[2.5rem] shadow-2xl border border-white/10 rotate-6 group hover:rotate-0 transition-transform duration-500">
             <DatabaseZap className="text-white group-hover:scale-110 transition-transform" size={44} />
          </div>
          <div className="space-y-1">
            <h1 className="text-5xl font-black text-white tracking-tighter italic uppercase">ZENITH<span className="text-indigo-500">BOT</span></h1>
            <p className="text-[11px] text-indigo-400 font-black uppercase tracking-[0.5em] flex items-center justify-center gap-2">
               <Globe size={12} /> Cloud Persistence Engine
            </p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[4rem] backdrop-blur-3xl shadow-2xl overflow-hidden p-4">
          <div className="flex bg-white/5 p-2 rounded-[2.5rem] mb-8">
            <button 
              onClick={() => { setMode('login'); setError(''); }} 
              className={`flex-1 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'login' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}
            >
              <LogIn size={14} /> Masuk Sesi
            </button>
            <button 
              onClick={() => { setMode('register'); setError(''); }} 
              className={`flex-1 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'register' ? 'bg-amber-600 text-white shadow-xl shadow-amber-500/20' : 'text-slate-500 hover:text-white'}`}
            >
              <Cloud size={14} /> Hubungkan Baru
            </button>
          </div>

          <form onSubmit={validateAndLogin} className="px-8 pb-10 space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Administrator Email</label>
                <div className="relative">
                   <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                   <input 
                    required type="email" value={email} onChange={e => setEmail(e.target.value)}
                    list="known-users"
                    className="w-full bg-black/40 border border-white/10 text-white pl-14 pr-6 py-5 rounded-[1.5rem] text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700"
                    placeholder="nama@perusahaan.com"
                  />
                  <datalist id="known-users">
                    {knownUsers.map(u => <option key={u} value={u} />)}
                  </datalist>
                </div>
              </div>

              {mode === 'register' && (
                <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500 bg-white/5 p-8 rounded-[2.5rem] border border-white/5">
                   <div className="flex items-center gap-3 mb-2">
                      <KeyRound className="text-amber-500" size={18} />
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Supabase Setup</span>
                   </div>
                   <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Project URL</label>
                        <input required value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white px-5 py-4 rounded-xl text-xs font-mono focus:ring-1 focus:ring-amber-500" placeholder="https://xyz.supabase.co" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Anon Key</label>
                        <input required type="password" value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white px-5 py-4 rounded-xl text-xs font-mono focus:ring-1 focus:ring-amber-500" placeholder="eyJhbGc..." />
                      </div>
                   </div>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-rose-500/10 p-5 rounded-3xl border border-rose-500/20 text-rose-500 animate-in slide-in-from-top-2">
                <AlertCircle size={20} className="shrink-0" />
                <p className="text-[10px] font-black uppercase leading-relaxed">{error}</p>
              </div>
            )}

            <button 
              disabled={isLoading} 
              className={`w-full py-5 rounded-[1.5rem] font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${
                mode === 'register' ? 'bg-amber-600 text-white hover:bg-amber-500 shadow-xl shadow-amber-900/20' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-xl shadow-indigo-900/20'
              }`}
            >
               {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {mode === 'register' ? 'VERIFIKASI & DAFTARKAN CLOUD' : 'LANJUTKAN KE DASHBOARD'} 
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="flex flex-col items-center gap-4 opacity-40">
           <div className="flex items-center gap-6">
              <p className="text-[8px] text-white font-black uppercase tracking-[0.5em]">ZENITH v5.0</p>
              <div className="w-1 h-1 bg-white rounded-full" />
              <p className="text-[8px] text-white font-black uppercase tracking-[0.5em]">REALTIME DATABASE</p>
           </div>
           <p className="text-[7px] text-slate-500 font-medium max-w-[300px] text-center uppercase tracking-widest leading-relaxed">
             Semua data disimpan di Supabase. Anda bisa login di HP lain dan data tetap sinkron.
           </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
