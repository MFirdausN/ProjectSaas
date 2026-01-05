import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function mapClientColumns(headers: string[]) {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
    Saya memiliki data spreadsheet dengan kolom: ${headers.join(", ")}.
    Tentukan kolom mana yang paling cocok untuk:
    1. 'status_column': Kolom yang menunjukkan progres atau status (misal: "Status Kirim", "Progress", "Kondisi").
    2. 'label_column': Kolom identitas utama (misal: "Nama", "Email", "ID").
    3. 'count_value': Nilai positif yang ingin dihitung (misal: "Sent", "Done", "Lunas").

    Kembalikan HANYA JSON murni format: 
    {"status_index": number, "label_index": number, "success_keyword": string}
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        // Membersihkan teks jika AI menyertakan markdown ```json
        const cleanedJson = response.replace(/```json|```/g, "");
        return JSON.parse(cleanedJson);
    } catch (e) {
        // Default jika AI gagal (asumsi kolom standar)
        return { status_index: 3, label_index: 1, success_keyword: "Sent" };
    }
}