import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import DashboardCharts from "@/components/DashboardCharts";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { BrainCircuit, Info } from "lucide-react";

// Inisialisasi Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function getProjectData(id: string) {
  // 1. Ambil data dari Supabase
  const { data: project } = await supabase
    .from("dashboards")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) return null;

  // 2. Ambil data dari Google Sheets
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${project.sheet_id}/values/Sheet1!A1:Z100?key=${apiKey}`;

  const res = await fetch(sheetUrl, { next: { revalidate: 60 } });
  const sheetData = await res.json();

  return {
    project,
    rows: sheetData.values || [],
  };
}

// Fungsi AI Insight
async function getAIInsight(sent: number, opened: number) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Analisis data kampanye email ini: Total Terkirim: ${sent}, Total Dibuka: ${opened}. Berikan 1 kalimat saran singkat dan profesional untuk klien agensi marketing.`;
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (e) {
    return "Gagal memuat insight AI saat ini.";
  }
}

export default async function DashboardPage({ params }: { params: { id: string } }) {
  const data = await getProjectData(params.id);

  if (!data) notFound();

  const headers = data.rows[0];
  const content = data.rows.slice(1);

  const totalData = content.length;

  // Menambahkan tipe string[] pada parameter row
  const sentCount = content.filter((row: string[]) => row[3] === "Sent").length;
  const openedCount = content.filter((row: string[]) => row[3] === "Opened").length;

  const aiInsight = await getAIInsight(sentCount, openedCount);

  return (
    <div className="min-h-screen bg-gray-50 p-8 text-black">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{data.project.name}</h1>
            <p className="text-gray-500">Live Campaign Analytics Dashboard</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-600">Syncing with Google Sheets</span>
          </div>
        </header>

        {/* AI Insight Section */}
        <div className="mb-8 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg flex items-start gap-4">
          <div className="bg-white/20 p-2 rounded-lg">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              AI Campaign Insight
            </h3>
            <p className="text-blue-100 mt-1 italic">"{aiInsight}"</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Database</p>
            <p className="text-3xl font-bold mt-1">{totalData}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50">
            <p className="text-sm font-medium text-blue-500 uppercase tracking-wider">Emails Sent</p>
            <p className="text-3xl font-bold mt-1">{sentCount}</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-50">
            <p className="text-sm font-medium text-green-500 uppercase tracking-wider">Emails Opened</p>
            <p className="text-3xl font-bold mt-1">{openedCount}</p>
          </div>
        </div>

        {/* Chart Section */}
        <DashboardCharts sent={sentCount} opened={openedCount} />

        {/* Data Table */}
        <div className="bg-white shadow-xl border border-gray-200 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">Detailed Delivery Logs</h3>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Info size={14} /> Showing last 100 entries
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50">
                <tr>
                  {headers?.map((header: string, i: number) => (
                    <th key={i} className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {content.map((row: string[], rowIndex: number) => (
                  <tr key={rowIndex} className="hover:bg-blue-50/30 transition-colors">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-6 py-4 text-sm text-gray-600">
                        {cellIndex === 3 ? (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${cell === "Sent" ? "bg-blue-100 text-blue-700" :
                            cell === "Opened" ? "bg-green-100 text-green-700" :
                              "bg-gray-100 text-gray-600"
                            }`}>
                            {cell}
                          </span>
                        ) : (
                          cell
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