import { cookies } from "next/headers";
import { SunDim, MoonStars, CircleHalf, SignIn, SignOut, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { login, logout, isAuthed, setTheme } from "./actions";
import { Submit } from "./submit";

export function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="rise flex items-center gap-2 rounded-lg border border-[var(--color-danger)] px-4 py-3 text-[var(--color-danger)]">
      <WarningCircle size={18} weight="bold" />
      {msg}
    </p>
  );
}

// ponytail: kotak password langsung di halaman, tanpa modal dan tanpa JS di
// sisi klien. Semua form biasa mengirim ke server action, jadi tetap jalan
// walau JavaScript dimatikan.
async function Gate({ back }: { back: string }) {
  if (await isAuthed())
    return (
      <form action={logout}>
        <input type="hidden" name="back" value={back} />
        <Submit className="link text-sm">
          <SignOut size={16} weight="bold" />
          Keluar
        </Submit>
      </form>
    );
  return (
    <form action={login} className="flex items-center gap-2">
      <input type="hidden" name="back" value={back} />
      <input
        name="password"
        type="password"
        placeholder="Password"
        aria-label="Password untuk mengedit"
        className="field max-w-36"
      />
      <Submit>
        <SignIn size={16} weight="bold" />
        Masuk
      </Submit>
    </form>
  );
}

const THEMES = { auto: "Auto", light: "Terang", dark: "Gelap" } as const;
const NEXT = { auto: "light", light: "dark", dark: "auto" } as const;
const ICONS = { auto: CircleHalf, light: SunDim, dark: MoonStars } as const;

export async function getTheme() {
  const v = (await cookies()).get("theme")?.value;
  return v === "light" || v === "dark" ? v : "auto";
}

// ponytail: satu tombol berputar Auto -> Terang -> Gelap, bukan halaman setelan.
async function ThemeToggle() {
  const theme = await getTheme();
  const Icon = ICONS[theme];
  return (
    <form action={setTheme}>
      <input type="hidden" name="theme" value={NEXT[theme]} />
      <Submit className="link text-sm" title="Ganti tema" label={`Tema ${THEMES[theme]}, klik untuk ganti`}>
        <Icon size={16} weight="bold" />
        {THEMES[theme]}
      </Submit>
    </form>
  );
}

export function Controls({ back }: { back: string }) {
  return (
    <div className="flex items-center gap-4">
      <ThemeToggle />
      <Gate back={back} />
    </div>
  );
}
