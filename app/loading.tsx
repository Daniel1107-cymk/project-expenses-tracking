// ponytail: satu loading.tsx di root -- App Router memakainya sebagai fallback
// untuk semua ruas di bawahnya (beranda dan halaman proyek), jadi rangkanya
// dibuat umum. Bikin loading.tsx sendiri per ruas kalau bentuknya perlu beda.
const Bar = ({ w, h = "h-4" }: { w: string; h?: string }) => (
  <span className={`skeleton block ${h} rounded`} style={{ width: w }} />
);

export default function Loading() {
  return (
    <main className="space-y-6" aria-busy="true" aria-label="Memuat data">
      <Bar w="40%" h="h-8" />
      <section className="card space-y-3 p-6">
        <Bar w="30%" />
        <Bar w="55%" h="h-10" />
      </section>
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <section key={i} className="card space-y-3 p-5">
            <Bar w="45%" />
            <Bar w="90%" />
            <Bar w="70%" />
          </section>
        ))}
      </div>
    </main>
  );
}
