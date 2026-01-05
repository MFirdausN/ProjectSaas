import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Ambil ID dari URL (contoh: ?id=1A2B3C...)
  const sheetId = searchParams.get('id'); 

  if (!sheetId) {
    return NextResponse.json({ error: 'ID Sheet diperlukan' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
  // Kita coba ambil range A1 sampai C10 sebagai tes
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A1:C10?key=${apiKey}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: "Koneksi Berhasil!",
      rows: data.values
    });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menghubungi Google API' }, { status: 500 });
  }
}