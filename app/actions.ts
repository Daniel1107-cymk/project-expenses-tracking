"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql, ensureSchema } from "@/lib/db";
import { parseRupiah } from "@/lib/rupiah";

// ponytail: one shared password, not accounts. Cookie holds the digest, so it is
// no easier to forge than the password itself. Swap for real auth when there is
// more than one editor.
const digest = () => createHash("sha256").update(process.env.ADMIN_PASSWORD ?? "").digest("hex");

export async function isAuthed() {
  const c = (await cookies()).get("et_auth")?.value ?? "";
  const want = digest();
  return c.length === want.length && timingSafeEqual(Buffer.from(c), Buffer.from(want));
}

async function gate() {
  if (!(await isAuthed())) throw new Error("Unauthorized");
}

export async function login(form: FormData) {
  const given = String(form.get("password") ?? "");
  const back = String(form.get("back") ?? "/");
  if (createHash("sha256").update(given).digest("hex") !== digest()) redirect(`${back}?err=Password+salah`);
  (await cookies()).set("et_auth", digest(), { httpOnly: true, sameSite: "lax", secure: true, maxAge: 60 * 60 * 24 * 90, path: "/" });
  redirect(back);
}

export async function logout(form: FormData) {
  (await cookies()).delete("et_auth");
  redirect(String(form.get("back") ?? "/"));
}

export async function addProject(form: FormData) {
  await gate();
  const name = String(form.get("name") ?? "").trim();
  if (!name) redirect("/?err=Nama+proyek+kosong");
  await ensureSchema();
  await sql`insert into projects (name) values (${name}) on conflict (name) do nothing`;
  revalidatePath("/");
}

export async function addExpense(form: FormData) {
  await gate();
  const projectId = Number(form.get("project_id"));
  const back = `/projects/${projectId}`;
  const spentOn = String(form.get("spent_on") ?? "");
  let amount: number;
  try {
    amount = parseRupiah(String(form.get("amount") ?? ""));
  } catch {
    redirect(`${back}?err=Jumlah+tidak+valid`);
  }
  if (!Number.isInteger(projectId) || !/^\d{4}-\d{2}-\d{2}$/.test(spentOn)) redirect(`${back}?err=Tanggal+tidak+valid`);
  await ensureSchema();
  await sql`insert into expenses (project_id, spent_on, category, person, amount, note)
            values (${projectId}, ${spentOn},
                    ${String(form.get("category") ?? "").trim() || "Lainnya"},
                    ${String(form.get("person") ?? "").trim()},
                    ${amount!},
                    ${String(form.get("note") ?? "").trim()})`;
  revalidatePath("/");
  // ponytail: lompat ke bulan catatan yang baru dibuat, supaya tidak "hilang"
  // saat halaman sedang difilter ke bulan lain.
  redirect(`${back}?bulan=${spentOn.slice(0, 7)}`);
}

export async function deleteExpense(form: FormData) {
  await gate();
  const id = Number(form.get("id"));
  await ensureSchema();
  const [row] = (await sql`delete from expenses where id = ${id} returning project_id`) as { project_id: number }[];
  if (row) revalidatePath(`/projects/${row.project_id}`);
  revalidatePath("/");
}

// ponytail: the theme is a cookie, so the server renders the right colours on
// the first byte. No client JS, no flash of the wrong theme on load.
export async function setTheme(form: FormData) {
  const theme = String(form.get("theme"));
  if (!["auto", "light", "dark"].includes(theme)) return;
  (await cookies()).set("theme", theme, { maxAge: 60 * 60 * 24 * 365, sameSite: "lax", path: "/" });
  revalidatePath("/", "layout");
}

// ponytail: hapus proyek ikut menghapus SEMUA catatannya (on delete cascade)
// dan tidak bisa dibatalkan -- jadi konfirmasinya minta mengetik nama proyek,
// bukan sekadar satu klik "ya". Dicek di server, bukan cuma di layar.
export async function deleteProject(form: FormData) {
  await gate();
  const id = Number(form.get("id"));
  const typed = String(form.get("konfirmasi") ?? "").trim();
  await ensureSchema();
  const [p] = (await sql`select name from projects where id = ${id}`) as { name: string }[];
  if (!p) redirect("/");
  if (typed !== p.name)
    redirect(`/projects/${id}?hapus=1&err=${encodeURIComponent("Nama proyek tidak cocok, penghapusan dibatalkan")}`);
  await sql`delete from projects where id = ${id}`;
  revalidatePath("/");
  redirect("/");
}
