
import { Employee, Shift, LeaveHistory, BotAlias, LeaveConfig, Category } from './types';

export const MOCK_EMPLOYEES: Employee[] = [];

export const MOCK_SHIFTS: Shift[] = [
  { id: 's-pagi', name: 'Shift Pagi', startTime: '06:00', endTime: '15:10', category: 'Operasional', description: 'Masuk Pagi, Pulang Sore' },
  { id: 's-siang', name: 'Shift Siang', startTime: '15:00', endTime: '23:00', category: 'Operasional', description: 'Masuk Sore, Pulang Malam' },
  { id: 's-malam', name: 'Shift Malam', startTime: '23:00', endTime: '07:00', category: 'Operasional', description: 'Masuk Malam, Pulang Pagi' },
];

export const MOCK_LEAVE_CONFIGS: LeaveConfig[] = [
  { 
    type: 'Merokok', 
    maxMinutes: 15, 
    maxPerDay: 3, 
    responseTemplate: 'Izin merokok diterima. ({durasi} menit)',
    warningTemplate: '{username} WOI BALIK! Waktu udud sudah lewat {lewat} menit!' 
  },
  { 
    type: 'Makan', 
    maxMinutes: 60, 
    maxPerDay: 1, 
    responseTemplate: 'Selamat makan. Izin dikonfirmasi {durasi} menit.',
    warningTemplate: '{username} makan mulu! Cepat kembali, sudah telat {lewat} menit!'
  },
  { 
    type: 'Ibadah', 
    maxMinutes: 20, 
    maxPerDay: 5, 
    responseTemplate: 'Izin ibadah diterima. Waktu Anda {durasi} menit.',
    warningTemplate: '{username} tolong segera kembali ke posisi, waktu ibadah sudah lewat {lewat} menit.'
  },
  { 
    type: 'Toilet', 
    maxMinutes: 10, 
    maxPerDay: 10, 
    responseTemplate: 'Izin ke toilet diterima. ({durasi} menit)',
    warningTemplate: '{username} ke toilet atau bertelur? Sudah lewat {lewat} menit!'
  },
];

export const MOCK_BOT_ALIASES: BotAlias[] = [
  { id: 'a1', category: 'Merokok', keywords: ['sebat', 'nyebat', 'udud'] },
  { id: 'a2', category: 'Makan', keywords: ['makan', 'mam', 'lapar'] },
  { id: 'a3', category: 'Ibadah', keywords: ['sholat', 'pray', 'masjid'] },
  { id: 'a4', category: 'Toilet', keywords: ['wc', 'toilet', 'pipis'] },
];

export const MOCK_HISTORY: LeaveHistory[] = [];
export const MOCK_HISTORI_7_HARI: LeaveHistory[] = [];

export const QUOTA_SETTINGS = {
  dailyBotLimit: 1000,
  sholatLimitMinutes: 20,
  makanLimitMinutes: 60,
  otherLimitMinutes: 15
};

export const MOCK_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Izin Merokok', command: '/merokok', limitPerDay: 3, status: 'Active' },
  { id: 'c2', name: 'Izin Makan', command: '/makan', limitPerDay: 1, status: 'Active' },
  { id: 'c3', name: 'Izin Ibadah', command: '/ibadah', limitPerDay: 5, status: 'Active' },
  { id: 'c4', name: 'Izin Toilet', command: '/toilet', limitPerDay: 10, status: 'Active' },
];
