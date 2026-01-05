import { mapClientColumns } from "@/lib/gemini";
import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import DashboardCharts from "@/components/DashboardCharts";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BrainCircuit, ArrowLeft, Layout, AlertCircle } from "lucide-react";
import Link from "next/link";

// Inisialisasi Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Fungsi untuk mendapatkan analisis naratif dari AI
 */
async function getAIInsight(total: number, success: number, keyword: string) {
    if (!process.env.GEMINI_API_KEY) return "Konfigurasi AI belum lengkap.";

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `Analisis data singkat: Total data ${total}, jumlah status '${keyword}' adalah ${success}. 
        Berikan 1 kalimat insight strategis dalam Bahasa Indonesia yang profesional.`;

        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (e) {
        console.error("AI Insight Error:", e);
        return "Analisis otomatis sedang disiapkan...";
    }
}

/**
 * Fungsi untuk mengambil data proyek dan data spreadsheet
 */
async function getProjectData(id: string) {
    const numericId = parseInt(id);
    if (isNaN(numericId)) return null;

    // 1. Ambil data dashboard dari Supabase
    const { data: project, error: projectError } = await supabase
        .from("dashboards")
        .select("*")
        .eq("id", numericId)
        .single();

    if (projectError || !project) return null;

    // 2. Ambil data dari Google Sheets
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${project.sheet_id}/values/A1:Z500?key=${apiKey}`;

    try {
        const res = await fetch(sheetUrl, { next: { revalidate: 60 } });
        const sheetData = await res.json();

        if (sheetData.error) {
            console.error("Google Sheets API Error:", sheetData.error.message);
            return { project, rows: [], config: project.mapping_config, error: "Akses Google Sheets gagal." };
        }

        const rows = sheetData.values || [];
        if (rows.length === 0) return { project, rows: [], config: project.mapping_config };

        // 3. LOGIKA DINAMIS MAPPING AI
        let config = project.mapping_config;

        // Jika belum ada mapping di DB, minta AI buatkan secara otomatis
        if (!config || typeof config.status_index === 'undefined') {
            const headers = rows[0];
            config = await mapClientColumns(headers);

            // Simpan mapping baru ke database agar permanen
            await supabase
                .from("dashboards")
                .update({ mapping_config: config })
                .eq("id", numericId);
        }

        return { project, rows, config };
    } catch (err) {
        console.error("Fetch Data Error:", err);
        return null;
    }
}

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function DashboardPage({ params }: PageProps) {
    // Unwrapping params (Next.js 15 Standar)
    const resolvedParams = await params;
    const data = await getProjectData(resolvedParams.id);

    // Proteksi jika data tidak ditemukan
    if (!data) return notFound();

    const { rows, config, project } = data;

    // Tampilan jika sheet kosong atau ada error API Google
    if (rows.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-white text-center">
                <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Data Tidak Dapat Diakses</h1>
                <p className="text-gray-500 max-w-md mb-6">
                    Pastikan Google Sheet Anda diatur ke "Anyone with the link can view" dan memiliki data.
                </p>
                <Link href="/" className="text-blue-600 font-semibold hover:underline flex items-center gap-2">
                    <ArrowLeft size={18} /> Kembali ke Home
                </Link>
            </div>
        );
    }

    const headers = rows[0];
    const content = rows.slice(1);

    // Mengambil index kolom dan keyword dari hasil mapping AI
    const statusIdx = config?.status_index ?? 0;
    const keyword = config?.success_keyword ?? "Success";

    // Menghitung statistik berdasarkan kolom status yang ditemukan AI
    const total = content.length;
    const successCount = content.filter((row: any) =>
        row[statusIdx]?.toString().toLowerCase().includes(keyword.toLowerCase())
    ).length;

    // Mendapatkan analisis AI secara real-time
    const aiInsight = await getAIInsight(total, successCount, keyword);

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-black font-sans">
            <div className="max-w-6xl mx-auto">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 mb-6 transition-all font-medium">
                    <ArrowLeft size={18} /> Kembali ke Dashboard Utama
                </Link>

                <header className="mb-8">
                    <div className="flex items-center gap-3 mb-2">
                        <span className="bg-blue-100 text-blue-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                            Live Report
                        </span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
                        {project.name}
                    </h1>
                    <p className="text-gray-500 mt-2">Dianalisis secara otomatis menggunakan Smart AI Mapping</p>
                </header>

                {/* AI Insight Card */}
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 text-white mb-8 shadow-2xl shadow-blue-200 flex items-start gap-5 border border-white/10">
                    <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md shrink-0">
                        <BrainCircuit size={28} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-lg mb-1 flex items-center gap-2">
                            AI Strategic Insight
                        </h3>
                        <p className="text-blue-50 leading-relaxed text-sm italic font-medium">
                            "{aiInsight}"
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-white p-7 rounded-3xl border border-gray-100 shadow-sm transition-hover hover:shadow-md">
                        <p className="text-gray-400 text-xs font-black uppercase tracking-widest mb-1">Total Entries</p>
                        <p className="text-5xl font-black text-gray-900 tabular-nums">{total}</p>
                    </div>
                    <div className="bg-white p-7 rounded-3xl border border-green-100 shadow-sm transition-hover hover:shadow-md">
                        <p className="text-green-500 text-xs font-black uppercase tracking-widest mb-1">Total {keyword}</p>
                        <p className="text-5xl font-black text-green-600 tabular-nums">{successCount}</p>
                    </div>
                </div>

                {/* Visualization */}
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm mb-8">
                    <h3 className="font-bold text-gray-800 mb-4 px-2">Performance Overview</h3>
                    <DashboardCharts sent={total} opened={successCount} />
                </div>

                {/* Adaptive Data Table */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Layout size={18} className="text-gray-400" />
                            <h3 className="font-bold text-gray-700 uppercase text-xs tracking-wider">Raw Spreadsheet Data</h3>
                        </div>
                        <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-1 rounded-md font-bold uppercase">
                            Auto-mapped
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50/30">
                                <tr>
                                    {headers.map((h: string, i: number) => (
                                        <th key={i} className="p-4 text-[11px] font-black text-gray-400 uppercase tracking-wider border-b border-gray-50">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {content.map((row: any[], i: number) => (
                                    <tr key={i} className="hover:bg-blue-50/30 transition-colors group">
                                        {row.map((cell: any, ci: number) => (
                                            <td key={ci} className="p-4 text-sm text-gray-600 whitespace-nowrap font-medium">
                                                {ci === statusIdx ? (
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm ${cell?.toString().toLowerCase().includes(keyword.toLowerCase())
                                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                                            : 'bg-blue-100 text-blue-700 border border-blue-200'
                                                        }`}>
                                                        {cell || "N/A"}
                                                    </span>
                                                ) : (
                                                    cell || "-"
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}