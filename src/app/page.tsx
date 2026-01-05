"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { mapClientColumns } from "@/lib/gemini";
import { Loader2, Send, LayoutDashboard, Sparkles } from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [generatedId, setGeneratedId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    // 1. Ekstrak Sheet ID dari URL
    const sheetIdMatch = url.match(/\/d\/([^/]+)/);
    const sheetId = sheetIdMatch ? sheetIdMatch[1] : null;

    if (!sheetId) {
      setMessage("❌ URL Google Sheet tidak valid!");
      setLoading(false);
      return;
    }

    try {
      // 2. Ambil API Key (Gunakan NEXT_PUBLIC agar terbaca di Client Side)
      const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

      if (!apiKey) {
        throw new Error("API Key tidak ditemukan. Pastikan prefix NEXT_PUBLIC_ sudah ditambahkan.");
      }

      // 3. Ambil data Header
      const sheetRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/A1:Z1?key=${apiKey}`
      );

      const sheetData = await sheetRes.json();

      if (sheetData.error) {
        // Jika API Key salah atau Sheet tidak publik, Google akan mengirim objek error
        console.error("Google API Error:", sheetData.error);
        throw new Error(`Google API: ${sheetData.error.message}`);
      }

      if (!sheetData.values) {
        throw new Error("Gagal membaca data. Pastikan Sheet sudah di-set 'Anyone with the link can view'.");
      }

      const headers = sheetData.values[0];

      // 4. Analisis AI
      setMessage("🤖 AI sedang menganalisis struktur data...");
      const config = await mapClientColumns(headers);

      // 5. Simpan ke Supabase
      const { data, error: dbError } = await supabase
        .from("dashboards")
        .insert([{
          name,
          sheet_id: sheetId,
          sheet_url: url,
          mapping_config: config
        }])
        .select()
        .single();

      if (dbError) throw dbError;

      setMessage("✅ Berhasil! Dashboard telah siap.");
      setGeneratedId(data.id);
      setName("");
      setUrl("");
    } catch (error: any) {
      console.error("Detail Error:", error);
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-black">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
        <div className="flex items-center gap-3 mb-8 text-blue-600">
          <LayoutDashboard size={28} />
          <div>
            <h1 className="text-2xl font-black leading-none">SheetToStatus</h1>
            <p className="text-xs font-bold text-blue-500 uppercase mt-1 tracking-widest">AI-Powered</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <input
            type="text" required value={name} onChange={(e) => setName(e.target.value)}
            className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nama Proyek"
          />
          <input
            type="url" required value={url} onChange={(e) => setUrl(e.target.value)}
            className="w-full p-4 bg-gray-50 border rounded-2xl outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Link Google Sheet"
          />
          <button
            type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            {loading ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> Generate Report</>}
          </button>
        </form>

        {message && (
          <div className="mt-8 p-4 bg-blue-50 rounded-2xl border border-blue-100 text-center">
            <p className="text-sm font-bold text-blue-700 mb-3">{message}</p>
            {generatedId && (
              <Link href={`/dashboard/${generatedId}`} className="block bg-white py-2 rounded-xl text-blue-600 font-black shadow-sm">
                Buka Dashboard 🚀
              </Link>
            )}
          </div>
        )}
      </div>
    </main>
  );
}