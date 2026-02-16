import React, { useState } from 'react';
import { 
  Globe, Server, Rocket, Cloud, ShieldAlert, ArrowRight, 
  Terminal, FileCode, CheckCircle, Info, Copy, Check,
  Github, Layout, ExternalLink, ShieldCheck, Zap, Laptop, BrainCircuit
} from 'lucide-react';

// Fix for TypeScript compilation in Vercel
declare const process: any;

const Deployment: React.FC = () => {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const gitCode = `git init
git add .
git commit -m "initial commit for zenith-admin2"
git branch -M main
git remote add origin https://github.com/USERNAME/zenith-admin2.git
git push -u origin main`;

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20 max-w-6xl mx-auto">
      <header className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
           <Rocket size={14} /> Vercel Cloud Deployment
        </div>
        <h1 className="text-5xl font-black text-[#0f172a] tracking-tighter italic uppercase">Zenith Admin 2</h1>
        <p className="text-sm font-medium text-slate-400 max-w-2xl mx-auto">
           Alur otomatis menggunakan GitHub dan Vercel. Pastikan repository Anda bernama <b>zenith-admin2</b>.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* STEP 1: GITHUB */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col gap-6 relative group overflow-hidden">
           <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg">1</div>
           <div>
              <h4 className="font-black text-slate-900 uppercase text-[10px] tracking-widest mb-2">GitHub Repo</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                 Push kode ke GitHub. Nama repo bebas, disarankan: <b className="text-slate-900">zenith-admin2</b>.
              </p>
           </div>
           <button 
             onClick={() => handleCopy(gitCode, 'git')}
             className="mt-auto bg-slate-900 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all"
           >
              {copied === 'git' ? <Check size={12} /> : <Copy size={12} />} COPY COMMANDS
           </button>
        </div>

        {/* STEP 2: VERCEL CONNECT */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col gap-6 relative group overflow-hidden">
           <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg">2</div>
           <div>
              <h4 className="font-black text-indigo-600 uppercase text-[10px] tracking-widest mb-2">Vercel Import</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                 Import repo tersebut di dashboard Vercel Anda dan klik <b>Deploy</b>.
              </p>
           </div>
           <a href="https://vercel.com/new" target="_blank" className="mt-auto bg-indigo-600 text-white py-3 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all">
              OPEN VERCEL <ExternalLink size={12} />
           </a>
        </div>

        {/* STEP 3: ENVIRONMENT VARIABLES */}
        <div className="bg-indigo-900 p-8 rounded-[3rem] text-white shadow-2xl flex flex-col gap-6 relative group overflow-hidden border-b-4 border-amber-400">
           <div className="w-12 h-12 bg-amber-400 text-indigo-900 rounded-2xl flex items-center justify-center font-black text-lg shadow-lg">3</div>
           <div>
              <h4 className="font-black text-amber-400 uppercase text-[10px] tracking-widest mb-2">AI Config (WAJIB)</h4>
              <p className="text-[10px] text-indigo-100/70 leading-relaxed font-medium">
                 Masuk ke <b>Settings {" > "} Env Variables</b> di Vercel. Tambahkan: <br/>
                 <code className="text-white bg-white/10 px-1">API_KEY</code> = [Gemini API Key]
              </p>
           </div>
           <div className="mt-auto flex items-center gap-2 text-[9px] font-black uppercase text-amber-400">
              <ShieldCheck size={14} /> Security Critical Step
           </div>
        </div>

        {/* STEP 4: SPA REDIRECTS */}
        <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col gap-6 relative group overflow-hidden">
           <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg">4</div>
           <div>
              <h4 className="font-black text-emerald-600 uppercase text-[10px] tracking-widest mb-2">SPA Redirects</h4>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                 File <b className="text-slate-900">vercel.json</b> sudah otomatis menangani routing SPA.
              </p>
           </div>
           <div className="mt-auto flex items-center gap-2 text-[9px] font-black uppercase text-emerald-500">
              <CheckCircle size={14} /> Ready to go
           </div>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[4rem] p-12 text-white shadow-2xl relative overflow-hidden">
         <div className="absolute bottom-0 right-0 p-12 opacity-10"><Zap size={120} /></div>
         <div className="flex flex-col md:flex-row items-center gap-10">
            <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-2xl">
               <BrainCircuit size={48} className="text-white" />
            </div>
            <div className="space-y-4">
               <h3 className="text-3xl font-black italic uppercase tracking-tight">Kunci Keamanan AI</h3>
               <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-3xl">
                  Ingat: Aplikasi ini tidak akan meminta <b>API_KEY Gemini</b> di dalam UI demi alasan keamanan (agar tidak tercuri saat Anda melakukan screenshot panel). Selalu gunakan <b>Vercel Environment Variables</b> untuk memasukkan kunci AI Anda.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Deployment;