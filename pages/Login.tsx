
import React, { useState } from 'react';
import { 
  ShieldCheck, Mail, Lock, ArrowRight, Loader2, 
  Cloud, LogIn, KeyRound, DatabaseZap, Globe
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

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      if (mode === 'recovery') {
        if (!supabaseUrl.includes('supabase.co') || supabaseKey.length < 20) {
          setError('Kunci Supabase tidak valid. Periksa URL dan Anon Key.');
          setIsLoading(false);
          return;
        }
        onLogin(email, supabaseUrl, supabaseKey);
        return;
      }

      // Login Biasa
      const savedUrl = localStorage.getItem(`zenith_cloud_url_${email.replace(/[@.]/g, '_')}`);
      if (!savedUrl) {
        setError('Akun ini belum pernah disinkronkan. Gunakan menu "Cloud Sync" di atas.');
        setIsLoading(false);
        return;
      }

      onLogin(email);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[150px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[100px]" />
      
      <div className="w-full max-w-[480px] z-10 space-y-10 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-5">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-indigo-500 to-indigo-800 rounded-[2.5rem] shadow-2xl border border-white/10 rotate-6 group hover:rotate-0 transition-transform duration-500">
             <DatabaseZap className="text-white group-hover:scale-110 transition-transform" size={44} />
          </div>
          <div className="space-y-1">
            <h1 className="text-5xl font-black text-white tracking-tighter italic uppercase">ZENITH<span className="text-indigo-500">BOT</span></h1>
            <p className="text-[11px] text-indigo-400 font-black uppercase tracking-[0.5em] flex items-center justify-center gap-2">
               <Globe size={12} /> Multi-Device Cloud Sync
            </p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[4rem] backdrop-blur-3xl shadow-2xl overflow-hidden">
          <div className="flex bg-white/5 p-2 m-4 rounded-[2.5rem]">
            <button 
              onClick={() => setMode('login')} 
              className={`flex-1 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'login' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}
            >
              <LogIn size={14} /> Login Biasa
            </button>
            <button 
              onClick={() => setMode('recovery')} 
              className={`flex-1 py-4 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${mode === 'recovery' ? 'bg-amber-600 text-white shadow-xl shadow-amber-500/20' : 'text-slate-500 hover:text-white'}`}
            >
              <Cloud size={14} /> Cloud Sync
            </button>
          </div>

          <form onSubmit={handleAuth} className="p-12 pt-6 space-y-7">
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Admin Email</label>
                <div className="relative">
                   <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                   <input 
                    required type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white pl-14 pr-6 py-5 rounded-[1.5rem] text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-700"
                    placeholder="email@perusahaan.com"
                  />
                </div>
              </div>

              {mode === 'login' ? (
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
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
                <div className="space-y-5 animate-in slide-in-from-top-4 duration-500 bg-white/5 p-8 rounded-[2rem] border border-white/5">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1">Supabase URL</label>
                      <input required value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white px-6 py-4 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-amber-500" placeholder="https://..." />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-amber-500 uppercase tracking-widest ml-1">Anon Key</label>
                      <input required type="password" value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white px-6 py-4 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-amber-500" placeholder="eyJhbG..." />
                   </div>
                </div>
              )}
            </div>

            {error && <p className="text-rose-500 text-[10px] font-black uppercase text-center bg-rose-500/10 py-4 rounded-2xl border border-rose-500/20">{error}</p>}

            <button 
              disabled={isLoading} 
              className={`w-full ${mode === 'recovery' ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-500/20' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20'} text-white font-black py-6 rounded-[1.5rem] uppercase text-[11px] tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50`}
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : mode === 'recovery' ? 'SINKRONKAN SEKARANG' : 'MASUK KE DASHBOARD'} 
              {!isLoading && <ArrowRight size={20} />}
            </button>
          </form>
        </div>
        
        <div className="text-center opacity-40">
           <p className="text-[9px] text-white font-black uppercase tracking-[0.5em]">System Version 4.5.2 Cloud Native</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
