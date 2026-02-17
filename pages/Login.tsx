
import React, { useState, useEffect } from 'react';
import { 
  DatabaseZap, Mail, KeyRound, Globe, ArrowRight, Loader2, 
  CheckCircle2, AlertCircle, ShieldCheck, History
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface LoginProps {
  onLogin: (email: string, cloudUrl: string, cloudKey: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberedUsers, setRememberedUsers] = useState<any[]>([]);

  useEffect(() => {
    // Ambil daftar user yang pernah login di perangkat ini
    const users = JSON.parse(localStorage.getItem('zenith_vault') || '[]');
    setRememberedUsers(users);
  }, []);

  const handleQuickLogin = (user: any) => {
    setEmail(user.email);
    setUrl(user.url);
    setKey(user.key);
    // Langsung coba login
    performLogin(user.email, user.url, user.key);
  };

  const performLogin = async (eEmail: string, eUrl: string, eKey: string) => {
    setError('');
    setIsLoading(true);

    try {
      // 1. Tes Koneksi Supabase
      const supabase = createClient(eUrl, eKey);
      
      // Kita coba ping auth atau tabel apapun untuk cek validitas Key
      const { error: testErr } = await supabase.from('profiles').select('count').limit(1).maybeSingle();
      
      // Jika errornya bukan "tabel tidak ada", berarti URL/Key salah
      if (testErr && !testErr.message.includes('relation "profiles" does not exist')) {
        throw new Error("URL atau Anon Key Supabase Anda salah.");
      }

      // 2. Simpan ke Vault Lokal untuk login cepat nanti
      const vault = JSON.parse(localStorage.getItem('zenith_vault') || '[]');
      const filteredVault = vault.filter((u: any) => u.email !== eEmail);
      filteredVault.unshift({ email: eEmail, url: eUrl, key: eKey });
      localStorage.setItem('zenith_vault', JSON.stringify(filteredVault.slice(0, 5)));

      // 3. Masuk ke Aplikasi
      onLogin(eEmail, eUrl, eKey);
    } catch (err: any) {
      setError(err.message || "Gagal terhubung ke cloud. Periksa koneksi internet.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performLogin(email, url, key);
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[1000px] grid grid-cols-1 lg:grid-cols-2 bg-white/5 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-xl">
        
        {/* Sisi Kiri: Welcome & Recent */}
        <div className="p-12 lg:p-16 flex flex-col justify-between border-r border-white/5 bg-gradient-to-b from-indigo-600/10 to-transparent">
          <div>
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl">
              <DatabaseZap className="text-white" size={32} />
            </div>
            <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">
              Zenith <span className="text-indigo-500">Cloud</span>
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-10">
              Selamat datang kembali. Hubungkan akun Supabase Anda untuk sinkronisasi data bot secara real-time.
            </p>

            {rememberedUsers.length > 0 && (
              <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <History size={14} /> Sesi Terakhir
                </p>
                <div className="grid gap-3">
                  {rememberedUsers.map((user, i) => (
                    <button 
                      key={i}
                      onClick={() => handleQuickLogin(user)}
                      className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400 font-bold text-xs">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-bold text-white">{user.email}</span>
                      </div>
                      <ArrowRight size={14} className="text-slate-600 group-hover:text-white transition-all" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="pt-10 flex items-center gap-4 opacity-30">
            <ShieldCheck size={16} className="text-indigo-400" />
            <span className="text-[9px] font-black text-white uppercase tracking-widest">End-to-End Cloud Persistence</span>
          </div>
        </div>

        {/* Sisi Kanan: Form */}
        <div className="p-12 lg:p-16 bg-black/20">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email Administrator</label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  required type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white pl-14 pr-6 py-5 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="admin@email.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Supabase URL</label>
              <div className="relative">
                <Globe className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  required type="text" value={url} onChange={e => setUrl(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white pl-14 pr-6 py-5 rounded-2xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="https://xyz.supabase.co"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Anon Key / API Key</label>
              <div className="relative">
                <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                <input 
                  required type="password" value={key} onChange={e => setKey(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 text-white pl-14 pr-6 py-5 rounded-2xl text-sm font-mono focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Masukkan Anon Key..."
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 bg-rose-500/10 p-5 rounded-2xl border border-rose-500/20 text-rose-500">
                <AlertCircle size={20} className="shrink-0" />
                <p className="text-[10px] font-black uppercase leading-relaxed">{error}</p>
              </div>
            )}

            <button 
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-900/20 transition-all flex items-center justify-center gap-3"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : (
                <>HUBUNGKAN & MASUK <CheckCircle2 size={18} /></>
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 text-[9px] mt-8 uppercase font-bold tracking-widest">
            Belum punya database? <a href="https://supabase.com" target="_blank" className="text-indigo-400 hover:underline">Daftar di Supabase.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
