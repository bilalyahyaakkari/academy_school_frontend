import Image from "next/image";
import { LoginForm } from "./login-form";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Users, Wallet, Shirt, ShieldCheck, Clock } from "lucide-react";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n";

export async function generateMetadata() {
  const t = await getT();
  return { title: t("login.metaTitle") };
}

const FEATURES: { icon: typeof Users; title: TranslationKey; desc: TranslationKey }[] = [
  {
    icon: Users,
    title: "login.feature.students.title",
    desc: "login.feature.students.desc",
  },
  {
    icon: Wallet,
    title: "login.feature.payments.title",
    desc: "login.feature.payments.desc",
  },
  {
    icon: Shirt,
    title: "login.feature.uniforms.title",
    desc: "login.feature.uniforms.desc",
  },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ expired?: string | string[] }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  const t = await getT();
  const { expired } = await searchParams;
  // Set by /session-expired after the backend rejected the old token.
  const sessionExpired = (Array.isArray(expired) ? expired[0] : expired) === "1";

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ---------- LEFT — branded panel (desktop only) ---------- */}
      <div className="relative hidden overflow-hidden bg-sea-900 lg:flex lg:flex-col lg:justify-between lg:p-12 lg:text-white">
        {/* Calm palette backdrop — static sea-900 → sea-800 wash */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-sea-900 via-sea-900 to-sea-800"
        />

        {/* Soft, static glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute -start-32 -top-32 size-[28rem] rounded-full bg-sea-700/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -end-32 size-[32rem] rounded-full bg-sea-500/15 blur-3xl"
        />

        {/* Subtle dot grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, var(--sea-100) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* Top: logo */}
        <div className="relative z-10 flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Sakafa Academy"
            width={56}
            height={56}
            className="size-14 rounded-full bg-white/95 object-contain p-1 shadow-xl ring-2 ring-sea-300/50"
            priority
          />
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-sea-300">
              {t("brand.adminConsole")}
            </p>
            <p className="text-xl font-bold tracking-tight">Sakafa Academy</p>
          </div>
        </div>

        {/* Middle: hero copy */}
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            {t("login.hero.title")}
          </h2>
          <p className="mt-4 text-lg text-sea-100/85">
            {t("login.hero.sub")}
          </p>

          <ul className="mt-10 space-y-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <li key={f.title} className="flex items-start gap-4">
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-sea-100/10 text-sea-300 ring-1 ring-sea-300/25">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{t(f.title)}</p>
                    <p className="mt-0.5 text-sm text-sea-100/75">
                      {t(f.desc)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Bottom: trust badge */}
        <div className="relative z-10 flex items-center gap-2 text-sm text-sea-100/75">
          <ShieldCheck className="size-4" />
          <span>{t("login.trust")}</span>
        </div>
      </div>

      {/* ---------- RIGHT — form panel ---------- */}
      <div className="relative flex flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6 lg:px-12">
        {/* Soft static tint on the right */}
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -end-40 size-[24rem] rounded-full bg-sea-300/20 blur-3xl"
        />

        {/* Mobile-only branded header */}
        <div className="relative z-10 mb-8 flex flex-col items-center gap-3 text-center lg:hidden">
          <Image
            src="/logo.png"
            alt="Sakafa Academy"
            width={72}
            height={72}
            className="size-18 rounded-full object-contain shadow-md ring-1 ring-border"
            priority
          />
          <p className="text-xl font-bold tracking-tight">Sakafa Academy</p>
        </div>

        <div className="relative z-10 w-full max-w-sm space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-sea-900">
              {t("login.title")}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("login.subtitle")}
            </p>
          </div>

          {sessionExpired && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-md border border-sea-300/60 bg-sea-100 px-3 py-2 text-sm text-sea-900"
            >
              <Clock className="mt-0.5 size-4 shrink-0" />
              <span>{t("login.expired")}</span>
            </div>
          )}

          <LoginForm />

          <p className="text-center text-xs text-muted-foreground">
            {t("login.help")}
          </p>
        </div>
      </div>
    </div>
  );
}
