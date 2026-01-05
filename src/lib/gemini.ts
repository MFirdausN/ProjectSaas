import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateDashboardSchema(headers: string[]) {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Saya memiliki data spreadsheet dengan kolom: ${headers.join(", ")}.
    Tugas Anda adalah membuat skema dashboard JSON.
    Tentukan:
    1. Mana kolom yang cocok jadi "Status" (misal: Status Kirim).
    2. Mana kolom yang cocok dihitung jumlahnya (Stats).
    3. Pilih warna tema (HEX) yang profesional.
    
    Kembalikan hanya JSON murni dengan format:
    {
      "status_column": "nama_kolom",
      "stats": ["kolom_a", "kolom_b"],
      "theme_color": "#colorcode"
    }
  `;

  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}