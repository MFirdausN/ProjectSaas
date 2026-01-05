import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sheetId = searchParams.get('id');

  if (!sheetId) {
    return NextResponse.json({
      error: 'ID Sheet diperlukan. Gunakan format ?id=KODE_SHEET_ANDA'
    }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;

  try {
    // 1. Langkah Pertama: Ambil Metadata Spreadsheet untuk mendapatkan nama Tab
    const metaUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?key=${apiKey}`;
    const metaRes = await fetch(metaUrl);
    const metaData = await metaRes.json();

    if (metaData.error) {
      return NextResponse.json({
        error: `Google API Error: ${metaData.error.message}`,
        help: "Pastikan ID Sheet benar dan sudah di-set 'Anyone with the link can view'"
      }, { status: metaData.error.code });
    }

    // Ambil nama tab pertama secara otomatis
    const firstSheetName = metaData.sheets[0].properties.title;

    // 2. Langkah Kedua: Ambil Data dari Tab tersebut (Range A1 ke Z50)
    const dataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/'${firstSheetName}'!A1:Z50?key=${apiKey}`;
    const dataRes = await fetch(dataUrl);
    const sheetValues = await dataRes.json();

    return NextResponse.json({
      message: "🚀 Koneksi Google API Sempurna!",
      spreadsheet_info: {
        title: metaData.properties.title,
        detected_sheet_name: firstSheetName,
        total_sheets: metaData.sheets.length
      },
      preview_data: sheetValues.values || []
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Gagal menghubungi Google API',
      details: error.message
    }, { status: 500 });
  }
}