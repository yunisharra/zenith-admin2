
import React, { useState } from 'react';
import { 
  ShieldCheck, Mail, Lock, ArrowRight, Loader2, 
  Eye, EyeOff, Shield, Fingerprint, Globe, KeyRound, 
  UserPlus, CheckCircle2, Cloud, LogIn, Database
} from 'lucide-react';

interface LoginProps {
  onLogin: (email: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'recovery'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const accounts = JSON.parse(localStorage.getItem('zenith_accounts') || '[]');

      if (mode === 'recovery') {
        // Mode Spesial untuk Incognito: Buat akun lokal berdasarkan kunci cloud
        const storageKey = `zenith_cloud_key_${email.replace(/[@.]/g, '_')}`;
        localStorage.setItem(storageKey, JSON.stringify({ supabaseUrl, supabaseKey }));
        
        // Daftarkan akun ini secara lokal otomatis
        if (!accounts.find((a: any) => a.email === email)) {
          accounts.push({ email, password: 'cloud_synced_user' });
          localStorage.setItem('zenith_accounts', JSON.stringify(accounts));
        }
        
        localStorage.setItem('zenith_active_session', email);
        onLogin(email);
        return;
      }

      if (mode === 'register') {
        if (accounts.find((a: any) => a.email === email)) {
          setError('Email sudah terdaftar.');
          setIsLoading(false);
          return;
        }
        accounts.push({ email, password });
        localStorage.setItem('zenith_accounts', JSON.stringify(accounts));
        setMode('login');
        alert('Pendaftaran Berhasil!');
      } else {
        const user = accounts.find((a: any) => a.email === email && a.password === password);
        if (!user) {
          setError('Akun tidak ditemukan atau password salah. Gunakan "Cloud Recovery" jika di perangkat baru.');
          setIsLoading(false);
          return;
        }
        localStorage.setItem('zenith_active_session', email);
        onLogin(email);
      }
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
      
      <div className="w-full max-w-[480px] z-10 space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-3xl shadow-2xl border border-white/10">
             <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">ZENITH<span className="text-indigo-500">.</span></h1>
          <p className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.3em]">Cloud Infrastructure Admin</p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-[3.5rem] backdrop-blur-3xl shadow-2xl overflow-hidden">
          <div className="flex border-b border-white/10">
            <button onClick={() => setMode('login')} className={`flex-1 py-5 text-[9px] font-black uppercase tracking-widest ${mode === 'login' ? 'text-white bg-white/5 border-b-2 border-indigo-500' : 'text-slate-500'}`}>Masuk</button>
            <button onClick={() => setMode('register')} className={`flex-1 py-5 text-[9px] font-black uppercase tracking-widest ${mode === 'register' ? 'text-white bg-white/5 border-b-2 border-indigo-500' : 'text-slate-500'}`}>Daftar</button>
            <button onClick={() => setMode('recovery')} className={`flex-1 py-5 text-[9px] font-black uppercase tracking-widest ${mode === 'recovery' ? 'text-white bg-white/5 border-b-2 border-amber-500' : 'text-slate-500'}`}>Cloud Recovery</button>
          </div>

          <form onSubmit={handleAuth} className="p-10 space-y-6">
            <div className="space-y-4">
              <input 
                required type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 text-white px-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Email Akun"
              />
              {mode !== 'recovery' && (
                <input 
                  required type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 text-white px-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Password"
                />
              )}
              
              {mode === 'recovery' && (
                <div className="space-y-4 animate-in slide-in-from-top-4">
                   <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                      <p className="text-[9px] text-amber-500 font-black uppercase leading-relaxed">Masukkan Kunci Supabase Anda untuk memulihkan sesi di perangkat ini.</p>
                   </div>
                   <input required value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 text-white px-6 py-4 rounded-2xl text-sm font-bold" placeholder="Supabase URL" />
                   <input required type="password" value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 text-white px-6 py-4 rounded-2xl text-sm font-bold" placeholder="Supabase Anon Key" />
                </div>
              )}
            </div>

            {error && <p className="text-rose-500 text-[10px] font-black uppercase text-center">{error}</p>}

            <button disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl uppercase text-xs tracking-widest shadow-xl flex items-center justify-center gap-3">
              {isLoading ? <Loader2 className="animate-spin" /> : mode === 'recovery' ? 'PULIHKAN DARI CLOUD' : 'LANJUTKAN'} <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
