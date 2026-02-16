import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Mail, Lock, ArrowRight, ChevronLeft, Loader2, 
  Eye, EyeOff, ShieldAlert, Fingerprint, Globe, Shield, 
  UserPlus, HelpCircle, KeyRound, Sparkles, CheckCircle2
} from 'lucide-react';

interface LoginProps {
  onLogin: (email: string) => void;
}

interface UserAccount {
  email: string;
  password: string;
  recoveryWord: string;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [step, setStep] = useState<'email' | 'password' | 'otp' | 'recovery' | 'newpass'>('email');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryWord, setRecoveryWord] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');

  const [ipAddress] = useState('182.1.22.41'); 

  const getAccounts = (): UserAccount[] => {
    const saved = localStorage.getItem('zenith_accounts');
    return saved ? JSON.parse(saved) : [];
  };

  const handleLoginFlow = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const accounts = getAccounts();

    if (step === 'email') {
      const user = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
      if (!user) {
        setError('Email tidak terdaftar. Silahkan daftar akun baru.');
        return;
      }
      setIsLoading(true);
      setTimeout(() => {
        setStep('password');
        setIsLoading(false);
      }, 600);
    } 
    else if (step === 'password') {
      const user = accounts.find(a => a.email.toLowerCase() === email.toLowerCase());
      if (user?.password !== password) {
        setError('Password salah. Silahkan coba lagi.');
        return;
      }
      setIsLoading(true);
      setTimeout(() => {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        setGeneratedOtp(code);
        console.log(`%c ZENITH SECURITY %c KODE LOGIN: ${code} `, "background: #6366f1; color: white;", "background: #1e293b; color: #fbbf24;");
        setStep('otp');
        setIsLoading(false);
      }, 1000);
    }
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const accounts = getAccounts();
      if (accounts.some(a => a.email.toLowerCase() === email.toLowerCase())) {
        setError('Email sudah terdaftar.');
        setIsLoading(false);
        return;
      }

      const newAccount: UserAccount = { email, password, recoveryWord };
      const updatedAccounts = [...accounts, newAccount];
      localStorage.setItem('zenith_accounts', JSON.stringify(updatedAccounts));
      
      alert("✅ Registrasi Berhasil! Silahkan login dengan akun baru Anda.");
      setMode('login');
      setStep('email');
      setIsLoading(false);
    }, 1200);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      // Izinkan kode master 123456 untuk kemudahan bypass dev
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
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 rounded-full blur-[120px]" />
      
      <div className="w-full max-w-[480px] z-10 space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-3xl shadow-2xl border border-white/10 group transition-all">
             <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">ZENITH<span className="text-indigo-500">.</span></h1>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-[3.5rem] backdrop-blur-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
             <div className={`h-full bg-indigo-500 transition-all duration-700 ${
               mode === 'signup' ? 'w-full bg-purple-500' :
               step === 'email' ? 'w-1/3' : step === 'password' ? 'w-2/3' : 'w-full'
             }`} />
          </div>

          <div className="p-10 space-y-8">
            <div className="flex justify-between items-start">
               <div>
                  <h3 className="text-2xl font-black text-white italic tracking-tight uppercase">
                    {mode === 'signup' ? 'Create Account' : mode === 'forgot' ? 'Recovery' : 'Admin Login'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                    {mode === 'signup' ? 'Join Zenith Network' : 'Security Gateway v4.5'}
                  </p>
               </div>
               {mode !== 'login' || step !== 'email' ? (
                 <button onClick={() => { setMode('login'); setStep('email'); setError(''); }} className="p-2 bg-white/5 hover:bg-white/10 text-slate-400 rounded-xl transition-all">
                    <ChevronLeft size={20} />
                 </button>
               ) : (
                 <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <Shield size={20} />
                 </div>
               )}
            </div>

            {mode === 'login' && (step === 'email' || step === 'password') && (
              <form onSubmit={handleLoginFlow} className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                {step === 'email' ? (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                       <Mail size={12} /> Email Corporate
                    </label>
                    <input 
                      required type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-800 text-white px-6 py-5 rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-bold"
                      placeholder="admin@perusahaan.com"
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                          <Lock size={12} /> Password
                       </label>
                       <button type="button" onClick={() => { setMode('forgot'); setStep('recovery'); }} className="text-[9px] font-black text-indigo-400 uppercase hover:underline">Lupa Password?</button>
                    </div>
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
                )}
                {error && <div className="text-rose-500 text-[10px] font-black uppercase bg-rose-500/10 p-4 rounded-xl border border-rose-500/20">{error}</div>}
                <button disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 transition-all uppercase text-xs tracking-[0.2em]">
                  {isLoading ? <Loader2 className="animate-spin" /> : <>Next <ArrowRight size={18} /></>}
                </button>
                <div className="text-center pt-2">
                   <p className="text-[10px] text-slate-500 font-bold uppercase">Belum punya akun? <button type="button" onClick={() => { setMode('signup'); setStep('email'); }} className="text-indigo-400 hover:underline">Daftar Sekarang</button></p>
                </div>
              </form>
            )}

            {mode === 'signup' && (
               <form onSubmit={handleSignup} className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</label>
                        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 text-white px-6 py-4 rounded-2xl text-sm font-bold" placeholder="your@email.com" />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Set Password</label>
                        <input required type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950/50 border border-slate-800 text-white px-6 py-4 rounded-2xl text-sm font-bold" placeholder="Min 6 chars" />
                     </div>
                     <div className="space-y-2">
                        <div className="flex justify-between items-center">
                           <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                              <HelpCircle size={12} /> Security Question
                           </label>
                        </div>
                        <input required type="text" value={recoveryWord} onChange={e => setRecoveryWord(e.target.value)} className="w-full bg-amber-500/5 border border-amber-500/20 text-white px-6 py-4 rounded-2xl text-sm font-bold placeholder:text-slate-700" placeholder="Contoh: Nama kucing pertama" />
                     </div>
                  </div>
                  {error && <div className="text-rose-500 text-[10px] font-black uppercase bg-rose-500/10 p-4 rounded-xl">{error}</div>}
                  <button disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-black py-5 rounded-2xl uppercase text-xs tracking-widest flex items-center justify-center gap-2">
                    {isLoading ? <Loader2 className="animate-spin" /> : <><UserPlus size={18} /> Register Account</>}
                  </button>
               </form>
            )}

            {step === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                <div className="space-y-4 text-center">
                   <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto border border-emerald-500/20">
                      <Fingerprint className="text-emerald-500" size={32} />
                   </div>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Enter 6-Digit Verification Code</p>
                </div>
                <input 
                  required maxLength={6} type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full bg-slate-950/50 border border-slate-800 text-white py-6 rounded-2xl text-4xl font-black tracking-[0.5em] text-center focus:ring-2 focus:ring-emerald-500"
                  placeholder="000000"
                />
                {error && <div className="text-rose-500 text-center text-[10px] font-black uppercase">{error}</div>}
                <button disabled={isLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-6 rounded-2xl uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-2">
                  {isLoading ? <Loader2 className="animate-spin" /> : <>Authorize Access <CheckCircle2 size={18} /></>}
                </button>
              </form>
            )}
          </div>

          <div className="bg-white/5 p-6 flex justify-between items-center text-[9px] font-black text-slate-500 uppercase tracking-widest">
             <div className="flex items-center gap-2"><Globe size={12} /> IP: {ipAddress}</div>
             <div className="flex items-center gap-2 text-indigo-400"><KeyRound size={12} /> Multi-User SaaS Mode</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;