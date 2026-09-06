import Link from "next/link";
import { sql, ensureSchema } from "@/lib/db";
import { formatRupiah } from "@/lib/rupiah";
import { addProject, isAuthed } from "./actions";
import { Controls, Err } from "./ui";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: Promise<{ err?: string }> }) {
  const { err } = await searchParams;
  await ensureSchema();
  const rows = (await sql`select p.id, p.name,
                                 coalesce(sum(e.amount), 0)::text as total,
                                 count(e.id)::text as n,
                                 to_char(max(e.spent_on), 'YYYY-MM-DD') as last_on
                          from projects p left join expenses e on e.project_id = p.id
                          group by p.id order by p.name`) as
    { id: number; name: string; total: string; n: string; last_on: string | null }[];
  const projects = rows.map((r) => ({ ...r, total: Number(r.total) }));
  const grand = projects.reduce((s, p) => s + p.total, 0);
  const authed = await isAuthed();

  return (
    <main className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Pengeluaran</h1>
        <Controls back="/" />
      </header>

      <Err msg={err} />

      <section className="card rise p-6">
        <p className="label">Total semua proyek</p>
        <p className="num mt-1 text-4xl font-semibold tracking-tight">{formatRupiah(grand)}</p>
        <p className="muted mt-1 text-sm">{projects.length} proyek</p>
      </section>

      <section className="card rise divide-y divide-[var(--color-line)]" style={{ animationDelay: "60ms" }}>
        {projects.map((p) => (
          <Link key={p.id} href={`/projects/${p.id}`} className="block p-5 hover:bg-[var(--color-track)]">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <span className="font-medium">{p.name}</span>
              <span className="num font-medium">{formatRupiah(p.total)}</span>
            </div>
            <div className="mt-2.5 flex items-center gap-3">
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-track)]">
                <span
                  className="block h-full rounded-full bg-[var(--color-fg)]"
                  style={{ width: `${grand ? (p.total / grand) * 100 : 0}%` }}
                />
              </span>
              <span className="muted num shrink-0 text-sm">{grand ? Math.round((p.total / grand) * 100) : 0}%</span>
            </div>
            <p className="muted mt-2 text-sm">
              {p.n} catatan{p.last_on ? ` · terakhir ${p.last_on}` : ""}
            </p>
          </Link>
        ))}
        {!projects.length && <p className="muted p-10 text-center">Belum ada proyek.</p>}
      </section>

      {authed && (
        <form action={addProject} className="flex gap-2">
          <input name="name" placeholder="Nama proyek baru" className="field" />
          <button className="btn shrink-0">Tambah</button>
        </form>
      )}
    </main>
  );
}
