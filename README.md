# Catatan Pengeluaran

Pencatatan pengeluaran per proyek (kos) dengan ringkasan per kategori, per orang,
dan per bulan. Ringkasan bisa dilihat siapa saja yang punya link; menambah dan
menghapus butuh password.

## Setup lokal

```bash
cp .env.example .env.local   # isi DATABASE_URL dan ADMIN_PASSWORD
npm install
npm run dev
```

Tabel dibuat otomatis saat halaman pertama kali dibuka.

## Deploy ke Vercel

1. Push repo ini ke GitHub, lalu **Add New > Project** di Vercel.
2. **Storage > Create Database > Neon** (free tier), hubungkan ke project ini.
   `DATABASE_URL` terisi otomatis — pakai connection string yang `-pooler`.
3. **Settings > Environment Variables**: tambahkan `ADMIN_PASSWORD`.
4. Redeploy. Kirim URL-nya ke manajer — dia cukup membuka halamannya,
   tidak perlu password untuk melihat ringkasan.

## Catatan

- Jumlah disimpan sebagai Rupiah bulat (tanpa sen). Input menerima
  `20000000` maupun `Rp 20.000.000`.
- Halaman proyek disaring per bulan; bawaannya bulan berjalan (kalau bulan itu
  kosong, dipakai bulan terakhir yang ada isinya). Klik baris di kolom
  "per bulan" untuk pindah bulan, atau "lihat semua bulan" untuk melihat semua.
  Bulannya ada di URL (`?bulan=2026-07`), jadi bisa dikirim ke manajer apa adanya.
- Mengubah pengeluaran = hapus lalu tambah lagi.
- Menghapus proyek ikut menghapus semua catatannya dan tidak bisa dibatalkan,
  jadi konfirmasinya minta mengetik ulang nama proyek (dicek di server).
- Tema: tombol `tema:` di pojok kanan atas, berputar otomatis (ikut sistem) ->
  terang -> gelap. Pilihannya disimpan di cookie, jadi tidak ada kedipan
  warna saat halaman dimuat.
- Cek parser Rupiah: `npx tsx lib/rupiah.test.ts`
