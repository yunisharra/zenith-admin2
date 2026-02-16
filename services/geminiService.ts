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
      onChunk("⚠️ API_KEY belum terpasang di Vercel. Bot tidak bisa berpikir tanpa kunci.");
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

    // Short & Punchy system instruction for speed
    const systemInstruction = `Role: Zenith HR Bot. User: ${senderUsername}. 
    Mission: If user asks for permission (izin), reply using exactly: "${customTemplate}".
    Values: Category=${identifiedCategory || 'Umum'}, Duration=${config?.maxMinutes || 15}m.
    If not asking for permission, be extremely brief (max 10 words). No yapping.`;

    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-flash-lite-latest', // Model paling ringan & cepat
      contents: userMessage,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingBudget: 0 },
        temperature: 0.3, // Lebih rendah agar lebih konsisten & cepat
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
    console.error("Gemini Error:", error);
    onChunk("❌ Koneksi AI sibuk. Coba lagi sebentar lagi.");
    return "";
  }
};

export const processBotLogic = async (userMessage: string, context: BotContext, senderUsername: string = "@user") => {
  let result = "";
  await processBotLogicStream(userMessage, context, (chunk) => { result += chunk; }, senderUsername);
  return result;
};
