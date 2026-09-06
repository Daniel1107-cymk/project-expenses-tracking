import Link from "next/link";
import { notFound } from "next/navigation";
import { sql, ensureSchema } from "@/lib/db";
import { formatRupiah } from "@/lib/rupiah";
import { addExpense, deleteExpense, deleteProject, isAuthed } from "@/app/actions";
import { Controls, Err } from "@/app/ui";

export const dynamic = "force-dynamic";

type Row = { label: string; total: number };

// ponytail: lebar batang dari baris terbesar, tanpa pustaka grafik.
function Breakdown({ title, rows }: { title: string; rows: Row[] }) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  return (
    <section className="card p-5">
      <h2 className="label">{title}</h2>
      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span>{r.label}</span>
              <span className="num shrink-0">{formatRupiah(r.total)}</span>
            </div>
            <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-[var(--color-track)]">
              <span
                className="block h-full rounded-full bg-[var(--color-fg)]"
                style={{ width: `${(r.total / max) * 100}%` }}
              />
            </span>
          </div>
        ))}
        {!rows.length && <p className="muted text-sm">Belum ada data.</p>}
      </div>
    </section>
  );
}

// ponytail: server berjalan UTC di Vercel, penggunanya tidak. sv-SE = YYYY-MM-DD.
const today = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
const namaBulan = (m: string, short = false) =>
  new Date(`${m}-01T00:00:00`).toLocaleDateString("id-ID", { month: short ? "short" : "long", year: "numeric" });

const CATEGORIES = ["SIPIL", "Material", "Gaji / Tenaga Kerja", "Operasional", "Tagihan Bulanan", "Lainnya"];

export default async function Project({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ err?: string; bulan?: string; hapus?: string }>;
}) {
  const id = Number((await params).id);
  const { err, bulan, hapus } = await searchParams;
  if (!Number.isInteger(id)) notFound();
  await ensureSchema();

  const num = (rows: unknown[]) =>
    (rows as { label: string; total: string }[]).map((r) => ({ label: r.label, total: Number(r.total) }));

  // Daftar bulan tidak ikut disaring -- dia yang jadi pilihan filternya.
  const [projects, byMonthRaw] = await Promise.all([
    sql`select id, name from projects where id = ${id}`.then((r) => r as { id: number; name: string }[]),
    sql`select to_char(spent_on, 'YYYY-MM') as label, sum(amount)::text as total, count(*)::text as n
        from expenses where project_id = ${id} group by 1 order by 1`.then(
      (r) => r as { label: string; total: string; n: string }[],
    ),
  ]);
  const byMonth = num(byMonthRaw);
  const allCount = byMonthRaw.reduce((s, r) => s + Number(r.n), 0);
  const project = projects[0];
  if (!project) notFound();

  const months = byMonth.map((m) => m.label);
  const thisMonth = today().slice(0, 7);
  const asked = /^\d{4}-\d{2}$/.test(bulan ?? "") ? bulan! : null;
  // ponytail: bawaannya bulan berjalan seperti diminta; kalau bulan itu kosong,
  // jatuh ke bulan terakhir yang ada isinya -- halaman kosong bikin salah paham.
  const month =
    bulan === "semua"
      ? null
      : asked ?? (months.includes(thisMonth) ? thisMonth : months[months.length - 1] ?? thisMonth);

  // ponytail: satu predikat, null = semua bulan. to_char cukup untuk ratusan
  // baris; ganti ke rentang tanggal kalau tabelnya nanti besar.
  const [byCategory, byPerson, expenses] = await Promise.all([
    sql`select category as label, sum(amount)::text as total from expenses
        where project_id = ${id} and (${month}::text is null or to_char(spent_on, 'YYYY-MM') = ${month})
        group by 1 order by sum(amount) desc`.then(num),
    sql`select coalesce(nullif(person, ''), '(tanpa nama)') as label, sum(amount)::text as total from expenses
        where project_id = ${id} and (${month}::text is null or to_char(spent_on, 'YYYY-MM') = ${month})
        group by 1 order by sum(amount) desc`.then(num),
    sql`select id, to_char(spent_on, 'YYYY-MM-DD') as spent_on, category, person, amount::text as amount, note
        from expenses
        where project_id = ${id} and (${month}::text is null or to_char(spent_on, 'YYYY-MM') = ${month})
        order by spent_on desc, id desc`.then(
      (r) => r as { id: number; spent_on: string; category: string; person: string; amount: string; note: string }[],
    ),
  ]);

  const shown = byCategory.reduce((s, r) => s + r.total, 0);
  const allTime = byMonth.reduce((s, r) => s + r.total, 0);
  const authed = await isAuthed();
  const back = `/projects/${id}`;
  const people = [...new Set(expenses.map((e) => e.person).filter(Boolean))];
  const periode = month ? namaBulan(month) : "Semua bulan";

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/" className="link text-sm">
            ← Semua proyek
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{project.name}</h1>
        </div>
        <Controls back={back} />
      </header>

      <Err msg={err} />

      <section className="card rise p-6">
        <p className="label">Total · {periode}</p>
        <p className="num mt-1 text-4xl font-semibold tracking-tight">{formatRupiah(shown)}</p>
        <p className="muted mt-1 text-sm">
          {expenses.length} catatan · seluruh proyek {formatRupiah(allTime)}
        </p>

        {/* ponytail: pilihan bulan sebagai chip -- lebih jelas bisa diklik
            daripada baris rincian. Kalau bulannya sudah puluhan, ganti ke select. */}
        {months.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={`${back}?bulan=semua`} className={`chip ${!month ? "chip-on" : ""}`}>
              Semua
            </Link>
            {months.map((m) => (
              <Link key={m} href={`${back}?bulan=${m}`} className={`chip ${month === m ? "chip-on" : ""}`}>
                {namaBulan(m, true)}
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="rise grid gap-4 sm:grid-cols-3" style={{ animationDelay: "60ms" }}>
        <Breakdown title="Per kategori" rows={byCategory} />
        <Breakdown title="Per orang" rows={byPerson} />
        <Breakdown title="Per bulan" rows={byMonth.map((r) => ({ ...r, label: namaBulan(r.label, true) }))} />
      </div>

      {authed && (
        <form action={addExpense} className="card grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-6">
          <input type="hidden" name="project_id" value={id} />
          <p className="label sm:col-span-2 lg:col-span-6">Catatan baru</p>
          <input name="spent_on" type="date" required defaultValue={today()} aria-label="Tanggal" className="field" />
          <input name="category" list="categories" placeholder="Kategori" aria-label="Kategori" className="field" />
          <datalist id="categories">
            {CATEGORIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <input name="person" list="people" placeholder="Nama" aria-label="Nama atau penerima" className="field" />
          <datalist id="people">
            {people.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
          <input name="amount" required placeholder="Jumlah" aria-label="Jumlah dalam Rupiah" className="field" />
          <input name="note" placeholder="Keterangan" aria-label="Keterangan" className="field" />
          <button className="btn">Tambah</button>
        </form>
      )}

      <section className="card rise overflow-hidden" style={{ animationDelay: "120ms" }}>
        <h2 className="label border-b border-[var(--color-line)] px-5 py-4">Catatan · {periode}</h2>
        <div className="divide-y divide-[var(--color-line)]">
          {expenses.map((e) => (
            <div key={e.id} className="flex items-start gap-4 px-5 py-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{e.category}</p>
                <p className="muted mt-0.5 text-sm">
                  {e.spent_on}
                  {e.person && ` · ${e.person}`}
                  {e.note && ` · ${e.note}`}
                </p>
              </div>
              <span className="num shrink-0 font-medium">{formatRupiah(Number(e.amount))}</span>
              {authed && (
                <form action={deleteExpense}>
                  <input type="hidden" name="id" value={e.id} />
                  <button className="link text-sm" title="Hapus" aria-label={`Hapus ${e.category} ${e.spent_on}`}>
                    Hapus
                  </button>
                </form>
              )}
            </div>
          ))}
          {!expenses.length && (
            <p className="muted p-10 text-center">Tidak ada pengeluaran pada {periode.toLowerCase()}.</p>
          )}
        </div>
      </section>

      {authed &&
        (hapus === "1" ? (
          <section className="card rise border-[var(--color-danger)] p-5">
            <h2 className="font-medium text-[var(--color-danger)]">Hapus proyek</h2>
            <p className="mt-2 max-w-prose text-sm">
              Menghapus <strong>{project.name}</strong> juga menghapus {allCount} catatan senilai{" "}
              {formatRupiah(allTime)}. Tindakan ini tidak bisa dibatalkan.
            </p>
            <form action={deleteProject} className="mt-4 flex flex-wrap items-center gap-3">
              <input type="hidden" name="id" value={id} />
              <input
                name="konfirmasi"
                required
                autoComplete="off"
                placeholder={`Ketik: ${project.name}`}
                aria-label={`Ketik ${project.name} untuk memastikan penghapusan`}
                className="field max-w-xs"
              />
              <button className="btn btn-danger">Hapus permanen</button>
              <Link href={back} className="link text-sm">
                Batal
              </Link>
            </form>
          </section>
        ) : (
          <p>
            <Link href={`${back}?hapus=1`} className="link text-sm">
              Hapus proyek ini
            </Link>
          </p>
        ))}
    </main>
  );
}
