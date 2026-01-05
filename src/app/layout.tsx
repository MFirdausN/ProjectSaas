import "./globals.css";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: 'swap', // Memastikan teks muncul cepat sebelum font terunduh
});

export const metadata = {
  title: "SheetToStatus | AI-Powered Report",
  description: "Ubah Google Sheets menjadi Dashboard Profesional secara otomatis",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${inter.className} antialiased bg-gray-50 text-gray-900`}
      >
        {/* Kamu bisa menambahkan Navbar global di sini jika perlu */}
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
}