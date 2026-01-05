import { supabase } from "@/lib/supabase";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
    title: "🔧 JSON Debugger | SheetToStatus",
};

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
};

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function DebugPage({ params }: PageProps) {
    // 1. Resolve params
    const resolvedParams = await params;
    const id = resolvedParams.id;

    // 2. Ambil data dari Supabase
    const { data: project, error: dbError } = await supabase
        .from("dashboards")
        .select("*")
        .eq("id", parseInt(id))
        .single();

    if (dbError || !project) {
        return (
            <div className="p-6 bg-red-950 min-h-screen font-mono">
                <h1 className="text-red-400 font-bold mb-2">❌ Database Error</h1>
                <pre className="p-4 bg-black rounded text-red-500 border border-red-900 shadow-xl overflow-auto">
                    {JSON.stringify(dbError, null, 2) || "Project tidak ditemukan di database."}
                </pre>
                <p className="mt-4 text-gray-500">ID yang dicari: {id}</p>
            </div>
        );
    }

    // 3. Tarik data dari Google Sheets API
    // Gunakan NEXT_PUBLIC_ jika itu yang Anda tulis di .env.local
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY || process.env.GOOGLE_SHEETS_API_KEY;
    const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${project.sheet_id}/values/A1:Z500?key=${apiKey}`;

    try {
        const res = await fetch(sheetUrl, { cache: 'no-store' });
        const sheetData = await res.json();

        // Cek jika Google mengembalikan error (misal API Key salah atau Permission denied)
        const isError = sheetData.error || !sheetData.values;

        return (
            <div className="p-6 bg-gray-950 min-h-screen text-green-400 font-mono text-sm">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
                    <h1 className="text-white text-xl font-black italic">🔧 SYSTEM DEBUGGER</h1>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${isError ? 'bg-red-900/20 text-red-500 border-red-800' : 'bg-green-900/20 text-green-500 border-green-800'
                            }`}>
                            {isError ? 'API CONNECTION FAILED' : 'API CONNECTION LIVE'}
                        </span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-gray-900 rounded-xl border border-gray-800">
                        <p className="text-gray-500 text-[10px] font-bold uppercase mb-1">Project Name</p>
                        <p className="text-white font-bold truncate">{project.name}</p>
                    </div>
                    <div className="p-4 bg-gray-900 rounded-xl border border-gray-800">
                        <p className="text-gray-500 text-[10px] font-bold uppercase mb-1">Database ID</p>
                        <p className="text-blue-400 font-bold">{id}</p>
                    </div>
                    <div className="p-4 bg-gray-900 rounded-xl border border-gray-800">
                        <p className="text-gray-500 text-[10px] font-bold uppercase mb-1">Mapping Status</p>
                        <p className={`${project.mapping_config ? 'text-green-400' : 'text-yellow-500'} font-bold`}>
                            {project.mapping_config ? '✅ CONFIGURED' : '⚠️ UNCONFIGURED'}
                        </p>
                    </div>
                </div>

                <div className="bg-gray-900 p-4 rounded-xl border border-gray-800 mb-6">
                    <p className="text-gray-500 text-[10px] font-bold uppercase mb-1">Target Sheet ID</p>
                    <p className="text-orange-400 break-all">{project.sheet_id}</p>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full animate-pulse ${isError ? 'bg-red-500' : 'bg-green-500'}`}></span>
                            RAW JSON RESPONSE:
                        </p>
                        <p className="text-gray-500 text-[10px]">Endpoint: Google V4 API</p>
                    </div>
                    <pre className={`p-6 rounded-2xl overflow-auto border shadow-2xl max-h-[60vh] scrollbar-hide ${isError ? 'bg-red-950/20 border-red-900/50 text-red-400' : 'bg-black border-gray-800 text-green-400'
                        }`}>
                        {JSON.stringify(sheetData, null, 2)}
                    </pre>
                </div>

                {isError && (
                    <div className="mt-6 p-4 bg-red-900/20 border border-red-800 rounded-xl">
                        <p className="text-red-400 text-xs">
                            <strong>Tip:</strong> Jika muncul error "API Key not found", pastikan variabel di .env.local sudah benar dan terminal sudah di-restart. Jika "Permission Denied", pastikan Google Sheet sudah diset ke <strong>"Anyone with the link can view"</strong>.
                        </p>
                    </div>
                )}
            </div>
        );
    } catch (error: any) {
        return (
            <div className="p-6 bg-red-950 min-h-screen font-mono text-red-400">
                <h1 className="font-bold border-b border-red-800 pb-2 mb-4 uppercase">❌ Fatal Fetch Error</h1>
                <pre className="bg-black p-4 rounded border border-red-900 overflow-auto">
                    {error.message}
                </pre>
            </div>
        );
    }
}