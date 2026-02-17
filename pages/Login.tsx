
import React, { useState } from 'react';
import { 
  ShieldCheck, Mail, Lock, ArrowRight, Loader2, 
  Cloud, LogIn, KeyRound
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
          setError('Format Supabase URL atau Key tidak valid.');
          setIsLoading(false);
          return;
        }
        // Masuk lewat jalur Recovery (Sinkronisasi Awal)
        onLogin(email, supabaseUrl, supabaseKey);
        return;
      }

      // Login Biasa: Hanya bekerja jika perangkat sudah pernah login atau data ada di local
      const savedEmail = localStorage.getItem('zenith_active_session');
      const savedUrl = localStorage.getItem(`zenith_cloud_url_${email.replace(/[@.]/g, '_')}`);
      
      if (!savedUrl && mode === 'login') {
        setError('Perangkat ini belum terhubung ke Cloud. Gunakan "Cloud Recovery" untuk sinkronisasi pertama kali.');
        setIsLoading(false);
        return;
      }

      onLogin(email);
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px]" />
      
      <div className="w-full max-w-[460px] z-10 space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-3xl shadow-2xl border border-white/10 rotate-3">
             <ShieldCheck className="text-white" size={36} />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">ZENITH<span className="text-indigo-500">BOT</span></h1>
          <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.4em]">Multi-Device Cloud Sync</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[3rem] backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="flex border-b border-white/5">
            <button 
              onClick={() => setMode('login')} 
              className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'login' ? 'text-white bg-white/5 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <LogIn className="inline mr-2" size={14} /> Login
            </button>
            <button 
              onClick={() => setMode('recovery')} 
              className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'recovery' ? 'text-white bg-white/5 border-b-2 border-amber-500' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Cloud className="inline mr-2" size={14} /> Sinkronisasi Baru
            </button>
          </div>

          <form onSubmit={handleAuth} className="p-10 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Administrator Email</label>
                <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                   <input 
                    required type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white pl-12 pr-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="admin@zenith.com"
                  />
                </div>
              </div>

              {mode === 'login' ? (
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                   <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                      <input 
                        required type="password" value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 text-white pl-12 pr-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="••••••••"
                      />
                   </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                   <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                      <p className="text-[9px] text-amber-500 font-black uppercase leading-relaxed text-center">
                        Masukkan Kunci Supabase Anda untuk memulihkan data di perangkat ini.
                      </p>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Supabase URL</label>
                      <input required value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white px-6 py-4 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-amber-500" placeholder="https://xyz.supabase.co" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Supabase Anon Key</label>
                      <input required type="password" value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white px-6 py-4 rounded-2xl text-xs font-mono focus:ring-2 focus:ring-amber-500" placeholder="eyJhbGci..." />
                   </div>
                </div>
              )}
            </div>

            {error && <p className="text-rose-500 text-[10px] font-black uppercase text-center bg-rose-500/10 py-3 rounded-xl border border-rose-500/20">{error}</p>}

            <button 
              disabled={isLoading} 
              className={`w-full ${mode === 'recovery' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'} text-white font-black py-5 rounded-2xl uppercase text-[11px] tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50`}
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : mode === 'recovery' ? 'MULAI SINKRONISASI CLOUD' : 'MASUK KE PANEL'} 
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>
        </div>
        
        <div className="flex justify-center items-center gap-3 opacity-30">
           <div className="h-px w-8 bg-white" />
           <p className="text-[9px] text-white font-black uppercase tracking-[0.2em]">Zenith v4.0.0 Stable</p>
           <div className="h-px w-8 bg-white" />
        </div>
      </div>
    </div>
  );
};

export default Login;
