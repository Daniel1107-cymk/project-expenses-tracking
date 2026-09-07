// Pemeriksaan asap satu-satunya untuk halaman proyek: menyemai proyek sementara,
// mengambil halamannya dari server yang sedang jalan, memastikan pengelompokan,
// filter, dan totalnya benar, lalu menghapus proyek itu lagi.
//   npm run build && npm start   (di terminal lain)
//   node check.cjs
const fs = require("fs");
const assert = require("assert");
const { Pool } = require("pg");
for (const l of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
// ponytail: pemeriksaan ini menulis ke database (proyek sementara, lalu dihapus),
// jadi ia menolak jalan kalau bukan localhost.
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(process.env.DATABASE_URL || "")) {
  console.error("Batal: check.cjs hanya untuk database lokal.");
  process.exit(1);
}
const p = new Pool({ connectionString: process.env.DATABASE_URL });
const rp = (n) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

(async () => {
  const { rows: [proj] } = await p.query("insert into projects (name) values ('__tmp_check__') returning id");
  const id = proj.id;
  const seed = [
    ["2026-08-03", "Material", "Budi", 1000],
    ["2026-08-03", "Material", "Ani", 2000],
    ["2026-08-10", "Gaji", "Budi", 4000],
    ["2026-09-01", "Material", "", 8000],
  ];
  for (const [d, c, per, a] of seed)
    await p.query("insert into expenses (project_id, spent_on, category, person, amount) values ($1,$2,$3,$4,$5)", [id, d, c, per, a]);

  // React menyisipkan <!-- --> di antara simpul teks; buang dulu supaya cocokannya sederhana.
  const get = async (qs) =>
    (await (await fetch(`http://localhost:3031/projects/${id}${qs}`)).text()).replaceAll("<!-- -->", "");
  const has = (h, s) => assert.ok(h.includes(s), `missing: ${s}`);

  // default month = current (2026-09) -> only the 8000 row
  let h = await get("");
  has(h, rp(8000));
  has(h, "September 2026");
  assert.ok(!h.includes(rp(4000)), "August row leaked into September view");
  has(h, "(tanpa nama)");

  // all months
  h = await get("?bulan=semua");
  has(h, rp(15000));           // grand total for the period
  has(h, "4 entri");

  // one month, breakdowns
  h = await get("?bulan=2026-08");
  has(h, rp(7000));            // month total
  has(h, "3 entri");
  has(h, rp(3000));            // Material in August
  has(h, rp(5000));            // Budi in August

  // category filter within August
  h = await get("?bulan=2026-08&kategori=Material");
  has(h, "2 entri");
  has(h, rp(3000));
  // Gaji tetap muncul SEKALI di ringkasan "Per kategori" (ringkasan memang tidak ikut disaring),
  // tapi tidak boleh muncul kedua kalinya sebagai baris catatan.
  assert.equal((h.match(/>Gaji</g) || []).length, 1, "Gaji row survived the Material filter");

  // person filter within August
  h = await get("?bulan=2026-08&orang=Budi");
  has(h, "2 entri");
  has(h, rp(5000));

  // daily grouping: both 3 Aug rows sit under one date header
  h = await get("?bulan=2026-08");
  // dijangkar ke HTML-nya: muatan RSC memuat teks yang sama sekali lagi.
  assert.equal((h.match(/class="muted">Senin, 3 Agustus</g) || []).length, 1, "date header repeated or missing");

  await p.query("delete from projects where id = $1", [id]);
  await p.end();
  console.log("OK - semua pemeriksaan lolos");
})().catch(async (e) => {
  await p.query("delete from projects where name = '__tmp_check__'").catch(() => {});
  await p.end();
  console.error("GAGAL:", e.message);
  process.exit(1);
});
