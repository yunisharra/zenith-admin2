
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

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // MENGHAPUS jeda setTimeout 1.5 detik - Login sekarang instan!
    const emailKey = email.replace(/[@.]/g, '_');
    
    if (mode === 'recovery') {
      if (!supabaseUrl.includes('supabase.co') || supabaseKey.length < 20) {
        setError('Kunci Supabase tidak valid.');
        setIsLoading(false);
        return;
      }
      onLogin(email, supabaseUrl, supabaseKey);
      return;
    }

    const savedUrl = localStorage.getItem(`zenith_cloud_url_${emailKey}`);
    if (!savedUrl) {
      setError('Akun belum terdaftar di perangkat ini. Gunakan Cloud Registration.');
      setIsLoading(false);
      return;
    }

    if (password.length < 4) {
      setError('Password minimal 4 karakter.');
      setIsLoading(false);
      return;
    }

    onLogin(email);
    // Tidak perlu setIsLoading(false) karena component akan unmount jika login sukses
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[150px]" />
      <div className="w-full max-w-[480px] z-10 space-y-10 animate-in fade-in zoom-in duration-500">
        <div className="text-center space-y-5">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-800 rounded-[2rem] shadow-2xl border border-white/10 rotate-6 group hover:rotate-0 transition-transform duration-500">
             <DatabaseZap className="text-white group-hover:scale-110 transition-transform" size={36} />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">ZENITH<span className="text-indigo-500">BOT</span></h1>
            <p className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.5em] flex items-center justify-center gap-2">
               <Globe size={10} /> Cloud Sync v4.9
            </p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[3rem] backdrop-blur-3xl shadow-2xl overflow-hidden p-3">
          <div className="flex bg-white/5 p-1.5 rounded-[2rem] mb-6">
            <button 
              onClick={() => setMode('login')} 
              className={`flex-1 py-3.5 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'login' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}
            >
              Login
            </button>
            <button 
              onClick={() => setMode('recovery')} 
              className={`flex-1 py-3.5 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'recovery' ? 'bg-amber-600 text-white shadow-xl shadow-amber-500/20' : 'text-slate-500 hover:text-white'}`}
            >
              Cloud Setup
            </button>
          </div>

          <form onSubmit={handleAuth} className="px-6 pb-8 space-y-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                <div className="relative">
                   <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                   <input 
                    required type="email" value={email} onChange={e => setEmail(e.target.value)}
                    list="known-users"
                    className="w-full bg-black/40 border border-white/10 text-white pl-12 pr-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="email@perusahaan.com"
                  />
                  <datalist id="known-users">
                    {knownUsers.map(u => <option key={u} value={u} />)}
                  </datalist>
                </div>
              </div>

              {mode === 'login' ? (
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                   <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                      <input 
                        required type="password" value={password} onChange={e => setPassword(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 text-white pl-12 pr-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="••••••••"
                      />
                   </div>
                </div>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-bottom-2 bg-amber-500/5 p-6 rounded-3xl border border-amber-500/20">
                   <input required value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white px-5 py-3 rounded-xl text-xs font-mono" placeholder="Supabase URL" />
                   <input required type="password" value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)} className="w-full bg-black/40 border border-white/10 text-white px-5 py-3 rounded-xl text-xs font-mono" placeholder="Anon Key" />
                </div>
              )}
            </div>

            {error && <p className="text-rose-500 text-[9px] font-black uppercase text-center bg-rose-500/10 py-3 rounded-xl border border-rose-500/20">{error}</p>}

            <button 
              disabled={isLoading} 
              className={`w-full ${mode === 'recovery' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'} text-white font-black py-5 rounded-[1.5rem] uppercase text-[10px] tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50`}
            >
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <span>{mode === 'recovery' ? 'Sync & Register' : 'Login Dashboard'}</span>}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
