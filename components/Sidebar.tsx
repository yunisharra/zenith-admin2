import React from 'react';
import { PageType } from '../types';
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  History, 
  BrainCircuit, 
  Settings, 
  LogOut,
  ShieldAlert,
  Zap,
  MessageSquare,
  Terminal,
  Globe,
  Bot
} from 'lucide-react';

interface SidebarProps {
  activePage: PageType;
  setActivePage: (page: PageType) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage, onLogout }) => {
  const NavItem = ({ id, label, icon }: { id: PageType, label: string, icon: React.ReactNode }) => (
    <button
      onClick={() => setActivePage(id)}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-3xl text-[11px] font-black tracking-[0.1em] transition-all duration-300 ${
        activePage === id
          ? 'bg-[#6366f1] text-white shadow-xl shadow-indigo-500/30'
          : 'text-slate-500 hover:text-white hover:bg-slate-800/40'
      }`}
    >
      {icon}
      <span>{label.toUpperCase()}</span>
    </button>
  );

  return (
    <aside className="w-80 bg-[#0f172a] text-white h-screen sticky top-0 flex flex-col p-8 border-r border-slate-800/50">
      <div className="flex items-center gap-4 mb-14 px-2">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-lg">
          <Bot className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-xl font-black italic tracking-tighter leading-none">ZENITH<span className="text-indigo-400">BOT</span></h1>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-1">Telegram Manager</p>
        </div>
      </div>

      <nav className="flex-1 space-y-3 overflow-y-auto custom-scrollbar">
        <NavItem id="dashboard" label="Monitoring Bot" icon={<LayoutDashboard size={20} />} />
        <NavItem id="karyawan" label="Manajemen User" icon={<Users size={20} />} />
        <NavItem id="shift" label="Jadwal Operator" icon={<Clock size={20} />} />
        <NavItem id="histori" label="Log Aktivitas" icon={<History size={20} />} />
        
        <div className="pt-8 pb-4">
          <p className="px-6 text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4">Core Engine</p>
          <NavItem id="koneksi" label="Koneksi Server" icon={<Zap size={20} />} />
          <NavItem id="bot-intelligence" label="Brain & Logic" icon={<BrainCircuit size={20} />} />
          <NavItem id="respon" label="Template Pesan" icon={<MessageSquare size={20} />} />
          <NavItem id="simulator" label="Debug Tool" icon={<Terminal size={20} />} />
          <NavItem id="deployment" label="Vercel Cloud" icon={<Globe size={20} />} />
          <NavItem id="pengaturan" label="Sistem & Limit" icon={<Settings size={20} />} />
        </div>
      </nav>

      <div className="mt-auto pt-6 border-t border-slate-800/50">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-6 py-4 text-[11px] font-black text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-50 rounded-3xl transition-all"
        >
          <LogOut size={20} />
          <span>KELUAR SISTEM</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;