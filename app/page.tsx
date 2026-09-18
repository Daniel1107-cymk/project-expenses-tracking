import Link from "next/link";
import { Plus, FolderOpen } from "@phosphor-icons/react/dist/ssr";
import { sql, ensureSchema } from "@/lib/db";
import { formatRupiah } from "@/lib/rupiah";
import { addProject, isAuthed } from "./actions";
import { Controls, Err } from "./ui";
import { Submit } from "./submit";
import { AnimatedRupiah } from "./number";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const { err } = await searchParams;
  await ensureSchema();
  const rows = (await sql`select p.id, p.name,
                                 coalesce(sum(e.amount), 0)::text as total,
                                 count(e.id)::text as n,
                                 to_char(max(e.spent_on), 'YYYY-MM-DD') as last_on
                          from projects p left join expenses e on e.project_id = p.id
                          group by p.id order by sum(e.amount) desc nulls last, p.name`) as
    { id: number; name: string; total: string; n: string; last_on: string | null }[];
  const projects = rows.map((r) => ({ ...r, total: Number(r.total) }));
  const grand = projects.reduce((s, p) => s + p.total, 0);
  const authed = await isAuthed();
  const pct = (n: number) => (grand ? Math.round((n / grand) * 100) : 0);

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Pengeluaran</h1>
        <Controls back="/" />
      </header>

      <Err msg={err} />

      <section className="banner rise p-6">
        <p className="label">Total semua proyek</p>
        <AnimatedRupiah value={grand} className="num mt-1 block text-3xl font-semibold tracking-tight sm:text-5xl" />
        <p className="muted mt-1 text-sm">{projects.length} proyek</p>
      </section>

      {/* ponytail: satu grid bento -- proyek terbesar melebar dua kolom sebagai
          sorotan, sisanya kotak biasa, dan kotak "tambah" ikut jadi bagian
          grid (bukan form terpisah di luar). Tidak ada sel kosong: jumlah
          kotak selalu mengikuti jumlah proyek + satu kotak tambah. */}
      <section className="rise grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" style={{ animationDelay: "60ms" }}>
        {projects.map((p, i) => (
          <Link
            key={p.id}
            href={`/projects/${p.id}`}
            className={`card card-hover block p-5 ${i === 0 && projects.length > 1 ? "sm:col-span-2" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className="font-medium">{p.name}</span>
              <FolderOpen size={18} className="text-[var(--color-muted)]" />
            </div>
            <span
              className={`num mt-3 block font-semibold tracking-tight ${
                i === 0 && projects.length > 1 ? "text-4xl" : "text-2xl"
              }`}
            >
              {formatRupiah(p.total)}
            </span>
            <div className="mt-3 flex items-center gap-3">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-track)]">
                <span
                  className="block h-full rounded-full bg-[var(--color-accent)]"
                  style={{ width: `${pct(p.total)}%` }}
                />
              </span>
              <span className="muted num shrink-0 text-xs">{pct(p.total)}%</span>
            </div>
            <p className="muted mt-3 text-sm">
              {p.n} catatan{p.last_on ? ` · terakhir ${p.last_on}` : ""}
            </p>
          </Link>
        ))}

        {authed && (
          <form action={addProject} className="card card-dashed grid gap-2 p-5">
            <p className="label">Proyek baru</p>
            <input name="name" placeholder="Nama proyek" className="field" />
            <Submit className="btn justify-self-start">
              <Plus size={16} weight="bold" />
              Tambah
            </Submit>
          </form>
        )}

        {!projects.length && !authed && (
          <p className="card muted p-10 text-center sm:col-span-2 lg:col-span-3">Belum ada proyek.</p>
        )}
      </section>
    </main>
  );
}
