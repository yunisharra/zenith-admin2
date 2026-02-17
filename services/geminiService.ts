
import { GoogleGenAI } from "@google/genai";
import { Employee, Shift, LeaveHistory, LeaveConfig, BotAlias } from "../types";

interface BotContext {
  employees: Employee[];
  shifts: Shift[];
  history: LeaveHistory[];
  configs: LeaveConfig[];
  aliases: BotAlias[];
}

export const processBotLogicStream = async (
  userMessage: string, 
  context: BotContext, 
  onChunk: (chunk: string) => void,
  senderUsername: string = "@user"
) => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey || apiKey === "" || apiKey === "undefined") {
      onChunk("⚠️ [ERROR]: API_KEY TIDAK DITEMUKAN.\nSilakan tambahkan Environment Variable 'API_KEY' di Vercel.");
      return "";
    }

    const ai = new GoogleGenAI({ apiKey });
    
    let identifiedCategory: string | null = null;
    let foundKeyword: string = "";
    
    for (const alias of context.aliases) {
      for (const k of alias.keywords) {
        if (userMessage.toLowerCase().includes(k.toLowerCase())) {
          identifiedCategory = alias.category;
          foundKeyword = k;
          break;
        }
      }
      if (identifiedCategory) break;
    }

    const config = context.configs.find(c => c.type === identifiedCategory);
    const customTemplate = config?.responseTemplate || "Izin {kategori} diterima. ({durasi} menit)";

    const systemInstruction = `Anda adalah Zenith HR Bot. User: ${senderUsername}.
    
    ATURAN:
    - Jika user minta izin (${foundKeyword || 'merokok, makan, ibadah, toilet'}), balas HANYA: "${customTemplate}"
    - Ganti {kategori} dengan ${identifiedCategory || 'Izin'}
    - Ganti {durasi} dengan ${config?.maxMinutes || 15}
    - Jika bukan permintaan izin, balas sangat singkat (maks 5 kata).
    - Bahasa Indonesia sopan.`;

    // Gunakan gemini-3-flash-preview (Kuota lebih besar & lebih cerdas)
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', 
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      config: {
        systemInstruction,
        temperature: 0.1,
      },
    });

    const finalResult = response.text || "";
    onChunk(finalResult);

    return finalResult;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    const errorMsg = error.message || "";
    
    if (errorMsg.includes('429')) {
      onChunk("⚠️ [LIMIT TERCAPAI]: Kuota gratis API Gemini Anda sedang penuh. Mohon tunggu 60 detik sebelum mengirim pesan lagi atau gunakan API Key dari akun Google lain.");
    } else if (errorMsg.includes('403')) {
      onChunk("❌ [API KEY INVALID]: Kunci API yang Anda masukkan di Vercel salah atau tidak aktif.");
    } else {
      onChunk("❌ [AI ERROR]: " + errorMsg);
    }
    return "";
  }
};

export const processBotLogic = async (userMessage: string, context: BotContext, senderUsername: string = "@user") => {
  let result = "";
  await processBotLogicStream(userMessage, context, (chunk) => { result = chunk; }, senderUsername);
  return result;
};
