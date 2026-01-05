import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // 1. Tes Menulis Data (Insert) dengan struktur kolom baru
    const { data: insertData, error: insertError } = await supabase
      .from('dashboards')
      .insert([{
        name: 'Tes Proyek Global',
        sheet_id: '1UKcYPh1yLhddK8Qurfr2AUH3aY3_C3A0hTqPm1bjNrQ',
        sheet_url: 'https://docs.google.com/spreadsheets/d/1UKcYPh1yLhddK8Qurfr2AUH3aY3_C3A0hTqPm1bjNrQ',
        mapping_config: { status_index: 3, success_keyword: "Sent" } // Contoh config dummy
      }])
      .select();

    if (insertError) {
      // Jika muncul error "column mapping_config does not exist", 
      // pastikan kamu sudah menambahkannya di dashboard Supabase
      throw insertError;
    }

    // 2. Tes Membaca Data (Select)
    const { data: selectData, error: selectError } = await supabase
      .from('dashboards')
      .select('*')
      .order('created_at', { ascending: false }) // Urutkan dari yang terbaru
      .limit(5);

    if (selectError) throw selectError;

    return NextResponse.json({
      status: 'Koneksi & Skema Supabase Berhasil!',
      pesan: 'Berhasil menulis data dengan config dinamis',
      data_terbaru: insertData,
      database_rows: selectData
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'Koneksi Gagal',
      error: error.message,
      tip: 'Pastikan kolom sheet_url dan mapping_config sudah ada di Supabase'
    }, { status: 500 });
  }
}