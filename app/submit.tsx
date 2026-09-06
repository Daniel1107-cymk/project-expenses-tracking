"use client";

import { useFormStatus } from "react-dom";

// ponytail: satu-satunya komponen klien di aplikasi ini. useFormStatus sudah
// ada di React 19 -- tidak perlu state sendiri, tidak perlu pustaka tambahan.
// Tombolnya juga dinonaktifkan saat mengirim, jadi tidak bisa terkirim dua kali
// (penting: satu klik ganda = satu catatan pengeluaran ganda).
// Tanpa JavaScript form tetap terkirim seperti biasa, hanya tanpa indikator.
export function Submit({
  className = "btn",
  label,
  title,
  children,
}: {
  className?: string;
  label?: string;
  title?: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending} aria-busy={pending} aria-label={label} title={title}>
      {pending && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
