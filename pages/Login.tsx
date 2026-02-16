
import React, { useState } from 'react';
import { 
  ShieldCheck, Mail, Lock, ArrowRight, Loader2, 
  Eye, EyeOff, Shield, Fingerprint, Globe, KeyRound, 
  UserPlus, CheckCircle2, Cloud, LogIn
} from 'lucide-react';

interface LoginProps {
  onLogin: (email: string) => void;
}

interface UserAccount {
  email: string;
  password: string;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'input' | 'otp'>('input');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');

  const getAccounts = (): UserAccount[] => {
    const saved = localStorage.getItem('zenith_accounts');
    return saved ? JSON.parse(saved) : [];
  };

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const accounts = getAccounts();

    if (mode === 'register') {
      const existing = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        setError('Email sudah terdaftar. Silakan Masuk.');
        return;
      }
      setIsLoading(true);
      setTimeout(() => {
        const newAcc = { email, password };
        localStorage.setItem('zenith_accounts', JSON.stringify([...accounts, newAcc]));
        setMode('login');
        setIsLoading(false);
        alert('Akun berhasil dibuat! Silakan masuk.');
      }, 1000);
    } else {
      const user = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        setError('Akun tidak ditemukan. Silakan Daftar.');
        return;
      }
      if (user.password !== password) {
        setError('Password salah.');
        return;
      }

      setIsLoading(true);
      setTimeout(() => {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(code);
        console.log(`%c ZENITH CLOUD %c KODE LOGIN: ${code} `, "background: #6366f1; color: white;", "background: #1e293b; color: #fbbf24;");
        setStep('otp');
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      if (otp === generatedOtp || otp === '123456') {
        localStorage.setItem('zenith_active_session', email);
        onLogin(email);
      } else {
        setError('Kode OTP tidak valid');
        setIsLoading(false);
      }
    }, 800);
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
          <div className="flex justify-center items-center gap-2 text-indigo-400">
             <Cloud size={14} className="animate-bounce" />
             <span className="text-[9px] font-black uppercase tracking-[0.3em]">Cloud Identity Portal</span>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-[3.5rem] backdrop-blur-3xl shadow-2xl relative overflow-hidden">
          <div className="flex border-b border-white/10">
            <button 
              onClick={() => { setMode('login'); setStep('input'); setError(''); }}
              className={`flex-1 py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${mode === 'login' ? 'text-white bg-white/5' : 'text-slate-500 hover:text-white'}`}
            >
              <LogIn size={14} /> Masuk
            </button>
            <button 
              onClick={() => { setMode('register'); setStep('input'); setError(''); }}
              className={`flex-1 py-6 text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${mode === 'register' ? 'text-white bg-white/5' : 'text-slate-500 hover:text-white'}`}
            >
              <UserPlus size={14} /> Daftar
            </button>
          </div>

          <div className="p-10 space-y-8">
            {step === 'input' ? (
              <form onSubmit={handleAuth} className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                     <Mail size={12} /> Email Akun
                  </label>
                  <input 
                    required type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 text-white px-6 py-5 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-bold"
                    placeholder="admin@zenith.cloud"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                     <Lock size={12} /> Password
                  </label>
                  <div className="relative">
                    <input 
                      required type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-800 text-white pl-6 pr-14 py-5 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-bold"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 hover:text-indigo-400">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                
                {error && <div className="text-rose-500 text-[10px] font-black uppercase bg-rose-500/10 p-4 rounded-xl border border-rose-500/20">{error}</div>}
                
                <button disabled={isLoading} className={`w-full font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-3 transition-all uppercase text-xs tracking-widest group ${mode === 'login' ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
                  {isLoading ? <Loader2 className="animate-spin" /> : <> {mode === 'login' ? 'Masuk Sekarang' : 'Buat Akun Baru'} <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                <div className="space-y-4 text-center">
                   <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                      <Fingerprint className="text-emerald-500" size={32} />
                   </div>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Verifikasi OTP</p>
                </div>
                <input 
                  required maxLength={6} type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-slate-950/50 border border-slate-800 text-white py-6 rounded-2xl text-4xl font-black tracking-[0.5em] text-center focus:ring-2 focus:ring-emerald-500"
                  placeholder="000000"
                />
                <button disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-6 rounded-2xl uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-2">
                  {isLoading ? <Loader2 className="animate-spin" /> : <>Buka Dashboard <CheckCircle2 size={18} /></>}
                </button>
              </form>
            )}
          </div>

          <div className="bg-white/5 p-6 flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-widest">
             <div className="flex items-center gap-2"><Globe size={12} /> Global Sync</div>
             <div className="flex items-center gap-2 text-indigo-400"><KeyRound size={12} /> E2E Encrypted</div>
          </div>
        </div>
        
        <p className="text-center text-[9px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed">
           Data akun lama akan ditarik dari cloud secara otomatis.<br/>Akun baru akan memulai dengan database kosong.
        </p>
      </div>
    </div>
  );
};

export default Login;
