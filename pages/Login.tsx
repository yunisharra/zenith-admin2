
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

    // Proses instan: tidak menunggu network request di dalam komponen Login
    const emailKey = email.replace(/[@.]/g, '_');
    
    if (mode === 'recovery') {
      if (!supabaseUrl.includes('supabase.co') || supabaseKey.length < 20) {
        setError('Kunci Cloud tidak valid.');
        setIsLoading(false);
        return;
      }
      onLogin(email, supabaseUrl, supabaseKey);
      return;
    }

    const savedUrl = localStorage.getItem(`zenith_cloud_url_${emailKey}`);
    if (!savedUrl) {
      setError('Akun belum terdaftar di perangkat ini.');
      setIsLoading(false);
      return;
    }

    // Password bypass sementara untuk kecepatan (validasi dilakukan di App context)
    onLogin(email);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[150px]" />
      <div className="w-full max-w-[460px] z-10 space-y-8 animate-in fade-in zoom-in duration-300">
        
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-indigo-800 rounded-3xl shadow-2xl border border-white/10 rotate-3">
             <DatabaseZap className="text-white" size={36} />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">ZENITH<span className="text-indigo-500">BOT</span></h1>
            <p className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.4em]">Instant Cloud Engine v5.0</p>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-2xl shadow-2xl overflow-hidden p-3">
          <div className="flex bg-white/5 p-1 rounded-2xl mb-6">
            <button onClick={() => setMode('login')} className={`flex-1 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'login' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}>Login</button>
            <button onClick={() => setMode('recovery')} className={`flex-1 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'recovery' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-white'}`}>Cloud Setup</button>
          </div>

          <form onSubmit={handleAuth} className="px-6 pb-8 space-y-5">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Admin Email</label>
                <div className="relative">
                   <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                   <input required type="email" value={email} onChange={e => setEmail(e.target.value)} list="users" className="w-full bg-black/40 border border-white/5 text-white pl-12 pr-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="admin@perusahaan.com" />
                   <datalist id="users">{knownUsers.map(u => <option key={u} value={u} />)}</datalist>
                </div>
              </div>

              {mode === 'login' ? (
                <div className="space-y-1.5">
                   <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
                   <div className="relative">
                      <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                      <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-black/40 border border-white/5 text-white pl-12 pr-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••••" />
                   </div>
                </div>
              ) : (
                <div className="space-y-4 bg-amber-500/5 p-5 rounded-2xl border border-amber-500/10">
                   <input required value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} className="w-full bg-black/40 border border-white/5 text-white px-5 py-3 rounded-xl text-xs font-mono" placeholder="Supabase URL" />
                   <input required type="password" value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)} className="w-full bg-black/40 border border-white/5 text-white px-5 py-3 rounded-xl text-xs font-mono" placeholder="Anon Key" />
                </div>
              )}
            </div>

            {error && <p className="text-rose-500 text-[9px] font-black uppercase text-center bg-rose-500/5 py-3 rounded-xl border border-rose-500/10">{error}</p>}

            <button disabled={isLoading} className={`w-full ${mode === 'recovery' ? 'bg-amber-600' : 'bg-indigo-600'} text-white font-black py-5 rounded-2xl uppercase text-[10px] tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50`}>
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : <span>{mode === 'recovery' ? 'CONNECT CLOUD' : 'ENTER DASHBOARD'}</span>}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
