
import React, { useState } from 'react';
import { 
  ShieldCheck, Mail, Lock, ArrowRight, Loader2, 
  Database, RefreshCw, KeyRound, Globe, Cloud, LogIn
} from 'lucide-react';

interface LoginProps {
  onLogin: (email: string) => void;
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
        if (!supabaseUrl || !supabaseKey) {
          setError('Mohon lengkapi Kunci Cloud Supabase Anda.');
          setIsLoading(false);
          return;
        }

        // Simpan kunci secara lokal untuk sesi ini
        const storageKey = `zenith_cloud_key_${email.replace(/[@.]/g, '_')}`;
        localStorage.setItem(storageKey, JSON.stringify({ supabaseUrl, supabaseKey }));
        
        // Buat akun lokal otomatis agar bisa login biasa nanti
        const accounts = JSON.parse(localStorage.getItem('zenith_accounts') || '[]');
        if (!accounts.find((a: any) => a.email === email)) {
          accounts.push({ email, password: 'cloud_user' });
          localStorage.setItem('zenith_accounts', JSON.stringify(accounts));
        }
        
        localStorage.setItem('zenith_active_session', email);
        onLogin(email);
        return;
      }

      // Mode Login Biasa
      const accounts = JSON.parse(localStorage.getItem('zenith_accounts') || '[]');
      const user = accounts.find((a: any) => a.email === email && (a.password === password || a.password === 'cloud_user'));
      
      if (!user) {
        setError('Akun tidak ditemukan di browser ini. Gunakan "Cloud Recovery" jika Anda baru pindah perangkat.');
        setIsLoading(false);
        return;
      }

      localStorage.setItem('zenith_active_session', email);
      onLogin(email);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
      
      <div className="w-full max-w-[480px] z-10 space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-3xl shadow-2xl border border-white/10">
             <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">ZENITH<span className="text-indigo-500">BOT</span></h1>
          <p className="text-[9px] text-indigo-400 font-black uppercase tracking-[0.3em]">Auto-Sync Intelligence Active</p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-[3.5rem] backdrop-blur-3xl shadow-2xl overflow-hidden">
          <div className="flex border-b border-white/10">
            <button 
              onClick={() => setMode('login')} 
              className={`flex-1 py-5 text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'login' ? 'text-white bg-white/5 border-b-2 border-indigo-500' : 'text-slate-500'}`}
            >
              <LogIn className="inline mr-2" size={12} /> Login Biasa
            </button>
            <button 
              onClick={() => setMode('recovery')} 
              className={`flex-1 py-5 text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'recovery' ? 'text-white bg-white/5 border-b-2 border-amber-500' : 'text-slate-500'}`}
            >
              <Cloud className="inline mr-2" size={12} /> Cloud Recovery
            </button>
          </div>

          <form onSubmit={handleAuth} className="p-10 space-y-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Administrator</label>
                <input 
                  required type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-800 text-white px-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="admin@zenith.com"
                />
              </div>

              {mode === 'login' ? (
                <div className="space-y-1">
                   <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Kata Sandi</label>
                   <input 
                    required type="password" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 text-white px-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              ) : (
                <div className="space-y-4 animate-in slide-in-from-top-4">
                   <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                      <p className="text-[9px] text-amber-500 font-black uppercase leading-relaxed text-center">
                        Masukkan Kunci Supabase Anda untuk memulihkan seluruh data dari cloud ke perangkat ini.
                      </p>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Supabase URL</label>
                      <input required value={supabaseUrl} onChange={e => setSupabaseUrl(e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 text-white px-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500" placeholder="https://xyz.supabase.co" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-1">Supabase Anon Key</label>
                      <input required type="password" value={supabaseKey} onChange={e => setSupabaseKey(e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 text-white px-6 py-4 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500" placeholder="eyJhbGci..." />
                   </div>
                </div>
              )}
            </div>

            {error && <p className="text-rose-500 text-[10px] font-black uppercase text-center bg-rose-500/10 py-3 rounded-xl">{error}</p>}

            <button 
              disabled={isLoading} 
              className={`w-full ${mode === 'recovery' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'} text-white font-black py-5 rounded-2xl uppercase text-xs tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all active:scale-95`}
            >
              {isLoading ? <Loader2 className="animate-spin" /> : mode === 'recovery' ? 'PULIHKAN DATA CLOUD' : 'MASUK KE DASHBOARD'} <ArrowRight size={18} />
            </button>
          </form>
        </div>
        
        <p className="text-center text-[9px] text-slate-600 font-black uppercase tracking-[0.2em]">
          Powered by Zenith Cloud Protocol v2.5
        </p>
      </div>
    </div>
  );
};

export default Login;
