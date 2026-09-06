import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { getTheme } from "./ui";

const sans = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--f-sans" });

export const metadata: Metadata = { title: "Catatan Pengeluaran", description: "Ringkasan pengeluaran per proyek" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" data-theme={await getTheme()} className={sans.variable}>
      <body className="mx-auto max-w-4xl px-5 py-10 sm:px-8">{children}</body>
    </html>
  );
}
