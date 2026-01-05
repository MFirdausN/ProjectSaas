import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 1. Tes Menulis Data (Insert)
    const { data: insertData, error: insertError } = await supabase
      .from('dashboards')
      .insert([{ name: 'Proyek Percobaan', sheet_id: '12345' }])
      .select();

    if (insertError) throw insertError;

    // 2. Tes Membaca Data (Select)
    const { data: selectData, error: selectError } = await supabase
      .from('dashboards')
      .select('*')
      .limit(5);

    if (selectError) throw selectError;

    return NextResponse.json({
      status: 'Koneksi Supabase Berhasil!',
      data_baru_masuk: insertData,
      semua_data: selectData
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'Koneksi Gagal', 
      error: error.message 
    }, { status: 500 });
  }
}