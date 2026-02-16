
export interface Employee {
  id: string;
  name: string;
  telegramId: string;
  username: string;
  role: 'Operasional' | 'Marketing' | 'Telemarketing' | 'Sosmed';
  shiftId: string;
  status: 'Aktif' | 'Nonaktif';
}

export interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  category: 'Operasional' | 'Marketing' | 'Telemarketing' | 'Sosmed';
  description?: string;
}

export interface LeaveHistory {
  id: string;
  employeeName: string;
  type: 'Merokok' | 'Makan' | 'Ibadah' | 'Toilet' | 'Lainnya';
  timeOut: string;
  timeIn: string;
  date: string;
  status: 'Tepat' | 'Telat';
}

export interface BotAlias {
  id: string;
  category: 'Merokok' | 'Makan' | 'Ibadah' | 'Toilet';
  keywords: string[];
}

export interface LeaveConfig {
  type: 'Merokok' | 'Makan' | 'Ibadah' | 'Toilet';
  maxMinutes: number;
  maxPerDay: number;
  responseTemplate?: string;
  warningTemplate?: string;
}

export interface BotSettings {
  botToken: string;
  groupId: string;
  botUsername: string;
  isOnline: boolean;
  serverUrl: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

export interface Message {
  id: string;
  sender: 'user' | 'bot' | 'system';
  text: string;
  timestamp: Date;
  json?: string;
}

export interface Category {
  id: string;
  name: string;
  command: string;
  limitPerDay: number;
  status: 'Active' | 'Inactive';
}

export type PageType = 'dashboard' | 'karyawan' | 'shift' | 'histori' | 'bot-intelligence' | 'simulator' | 'pengaturan' | 'respon' | 'koneksi' | 'deployment';
