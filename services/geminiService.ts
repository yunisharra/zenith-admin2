import { GoogleGenAI } from "@google/genai";
import { Employee, Shift, LeaveHistory, LeaveConfig, BotAlias } from "../types";

interface BotContext {
  employees: Employee[];
  shifts: Shift[];
  history: LeaveHistory[];
  configs: LeaveConfig[];
  aliases: BotAlias[];
}

// FUNGSI 1: Untuk Streaming (Mengetik Kata demi Kata)
export const processBotLogicStream = async (
  userMessage: string, 
  context: BotContext, 
  onChunk: (chunk: string) => void,
  senderUsername: string = "@raflyz"
) => {
  try {
    const apiKey = process.env.API_KEY;
    
    if (!apiKey || apiKey === "" || apiKey === "undefined") {
      onChunk("⚠️ API_KEY tidak terdeteksi. Pastikan variabel bernama API_KEY sudah diisi di Vercel dan sudah melakukan REDEPLOY.");
      return "";
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

    const systemInstruction = `
      Anda adalah "Zenith Bot", asisten HR perusahaan.
      User saat ini: ${senderUsername}.
      
      MISI: Berikan izin jika pesan mengandung kata kunci izin. 
      TEMPLATE WAJIB: "${customTemplate}"
      DATA: Durasi=${config?.maxMinutes || 15}m, Kategori=${identifiedCategory || 'umum'}.
      
      Jika user tidak minta izin, jawab sangat singkat & profesional.
      JANGAN bertele-tele. Jawab langsung to-the-point.
    `;

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: userMessage,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.5,
      },
    });

    let fullText = "";
    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        fullText += text;
        onChunk(text);
      }
    }

    return fullText;
  } catch (error: any) {
    console.error("Gemini Stream Error:", error);
    onChunk("❌ Terjadi kesalahan koneksi AI. Mohon coba lagi.");
    return "";
  }
};

// FUNGSI 2: Fallback (Tanpa Streaming) - UNTUK MEMPERBAIKI ERROR BUILD VERCEL
export const processBotLogic = async (userMessage: string, context: BotContext, senderUsername: string = "@raflyz") => {
  let result = "";
  await processBotLogicStream(userMessage, context, (chunk) => { result += chunk; }, senderUsername);
  return result;
};
