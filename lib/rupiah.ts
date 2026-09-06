// Parse "Rp 20.000.000" / "20.000.000" / "20000000" -> 20000000 (whole Rupiah).
// ponytail: no cents, no other currencies. IDR only until someone needs otherwise.
export function parseRupiah(s: string): number {
  const digits = s.replace(/[^\d]/g, "");
  if (!digits) throw new Error("Jumlah tidak valid");
  return Number(digits);
}

export const formatRupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
