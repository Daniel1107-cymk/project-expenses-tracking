import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { getTheme } from "./ui";

export const metadata: Metadata = { title: "Catatan Pengeluaran", description: "Ringkasan pengeluaran per proyek" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-theme={await getTheme()} className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="mx-auto max-w-6xl px-5 py-10 sm:px-8">{children}</body>
    </html>
  );
}
