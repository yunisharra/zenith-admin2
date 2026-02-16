import { GoogleGenAI } from "@google/genai";
import { Employee, Shift, LeaveHistory, LeaveConfig, BotAlias } from "../types";

interface BotContext {
  employees: Employee[];
  shifts: Shift[];
  history: LeaveHistory[];
  configs: LeaveConfig[];
  aliases: BotAlias[];
}

export const processBotLogic = async (userMessage: string, context: BotContext, senderUsername: string = "@raflyz") => {
  try {
    // Inisialisasi dilakukan di sini agar aplikasi tidak crash saat load pertama kali
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return "⚠️ Konfigurasi AI belum lengkap di Vercel. Harap atur API_KEY di Environment Variables.";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const employee = context.employees.find(e => e.username === senderUsername);
    
    let identifiedCategory: string | null = null;
    for (const alias of context.aliases) {
      if (alias.keywords.some(k => userMessage.toLowerCase().includes(k.toLowerCase()))) {
        identifiedCategory = alias.category;
        break;
      }
    }

    const config = context.configs.find(c => c.type === identifiedCategory);
    const customTemplate = config?.responseTemplate || "Izin {kategori} diterima. ({durasi} menit)";

    const systemPrompt = `
      Anda adalah "Zenith Bot", asisten HR.
      TUGAS UTAMA:
      Jika user meminta izin, Anda WAJIB memberikan jawaban PERSIS SESUAI TEMPLATE.
      TEMPLATE IZIN: "${customTemplate}"
      Ganti {durasi} dengan angka: ${config?.maxMinutes || 15}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: systemPrompt + `\nPesan User: "${userMessage}"`,
    });

    return response.text || "Bot sedang sibuk.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Gangguan sistem koneksi AI. Periksa API Key Anda.";
  }
};