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
    // Pastikan API_KEY terbaca dari process.env (di-inject oleh Vite/Vercel)
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || apiKey === "" || apiKey === "undefined") {
      return "⚠️ API_KEY tidak terdeteksi. \n\n1. Pastikan sudah diisi di Vercel Env.\n2. LAKUKAN REDEPLOY di Vercel agar perubahan tersimpan.";
    }

    const ai = new GoogleGenAI({ apiKey });
    
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
      Anda adalah "Zenith Bot", asisten HR untuk perusahaan.
      Jika user meminta izin, berikan jawaban sesuai template ini:
      TEMPLATE: "${customTemplate}"
      Ganti {durasi} dengan: ${config?.maxMinutes || 15}
      Ganti {kategori} dengan: ${identifiedCategory || 'umum'}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: systemPrompt + `\nPesan User: "${userMessage}"`,
    });

    return response.text || "Bot sedang sibuk.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "❌ Eror Koneksi AI. Pastikan API Key di Vercel sudah benar dan lakukan Redeploy.";
  }
};
