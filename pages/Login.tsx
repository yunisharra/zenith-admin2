
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Mail, Lock, ArrowRight, Loader2, 
  Cloud, LogIn, KeyRound, DatabaseZap, Globe, UserCheck, AlertCircle
} from 'lucide-react';

interface LoginProps {
  onLogin: (email: string, cloudUrl?: string, cloudKey?: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'recovery'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [knownUsers, setKnownUsers] = useState<string[]>([]);

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('zenith_known_users') || '[]');
    setKnownUsers(users);
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulasi delay sinkronisasi agar user merasa data sedang divalidasi ke cloud
    setTimeout(() => {
      const emailKey = email.replace(/[@.]/g, '_');
      
      if (mode === 'recovery') {
        if (!supabaseUrl.includes('supabase.co') || supabaseKey.length < 20) {
          setError('Format Kunci Cloud tidak valid. Cek kembali di Dashboard Supabase.');
          setIsLoading(false);
          return;
        }
        // Registrasi & Login Cloud
        onLogin(email, supabaseUrl, supabaseKey);
        return;
      }

      // Login Biasa - Validasi apakah user sudah pernah registrasi cloud di browser ini
      const savedUrl = localStorage.getItem(`zenith_cloud_url_${emailKey}`);
      if (!savedUrl) {
        setError('Akun belum terdaftar di perangkat ini. Gunakan mode "Cloud Sync" untuk pendaftaran pertama.');
        setIsLoading(false);
        return;
      }

      // Simulasi validasi password (bisa dikembangkan dengan Supabase Auth nantinya)
      if (password.length < 4) {
        setError('Password harus minimal 4 karakter.');
        setIsLoading(false);
        return;
      }

      onLogin(email);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Visual background decor */}
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
               <Globe size={12} /> Global Database System
            </p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[4rem] backdrop-blur-3xl shadow-2xl overflow-hidden p-4">
          <div className="flex bg-white/5 p-2 rounded-[2.5rem] mb-8">
            <button 
              onClick={() => { setMode('login'); setError(''); }} 
              className={`flex-1 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'login' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}
            >
              <LogIn size={14} /> Login Browser
            </button>
            <button 
              onClick={() => { setMode('recovery'); setError(''); }} 
              className={`flex-1 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'recovery' ? 'bg-amber-600 text-white shadow-xl shadow-amber-500/20' : 'text-slate-500 hover:text-white'}`}
            >
              <Cloud size={14} /> Cloud Registration
            </button>
          </div>

          <form onSubmit={handleAuth} className="px-8 pb-10 space-y-6">
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

              {mode === 'login' ? (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password Sesi</label>
                   <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                      <input 
                        required type="password" value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 text-white pl-14 pr-6 py-5 rounded-[1.5rem] text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700"
                        placeholder="••••••••"
                      />
                   </div>
                </div>
              ) : (
                <div className="space-y-5 animate-in slide-in-from-bottom-4 duration-500 bg-amber-500/5 p-8 rounded-[2.5rem] border border-amber-500/20">
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
                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">API Anon Key</label>
                        <input required type="password" value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white px-5 py-4 rounded-xl text-xs font-mono focus:ring-1 focus:ring-amber-500" placeholder="eyJhbGc..." />
                      </div>
                   </div>
                   <p className="text-[8px] text-amber-500/60 italic font-medium leading-relaxed mt-2">
                      * Mode ini akan menghubungkan email Anda ke database Supabase secara permanen.
                   </p>
                </div>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-rose-500/10 p-4 rounded-2xl border border-rose-500/20 text-rose-500 animate-shake">
                <AlertCircle size={16} className="shrink-0" />
                <p className="text-[9px] font-black uppercase">{error}</p>
              </div>
            )}

            <button 
              disabled={isLoading} 
              className={`w-full group relative ${mode === 'recovery' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-50'}`}
            >
               {isLoading ? (
                <Loader2 className="animate-spin mx-auto" size={20} />
              ) : (
                <span className="flex items-center justify-center gap-3">
                  {mode === 'recovery' ? 'HUBUNGKAN KE CLOUD' : 'MULAI SESI ADMIN'} 
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </button>
          </form>
        </div>
        
        <div className="flex items-center justify-center gap-6 opacity-40">
           <p className="text-[8px] text-white font-black uppercase tracking-[0.5em]">ZENITH CORE v4.8</p>
           <div className="w-1 h-1 bg-white rounded-full" />
           <p className="text-[8px] text-white font-black uppercase tracking-[0.5em]">ENCRYPTED SYNC</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
