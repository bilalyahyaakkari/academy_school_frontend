import Image from "next/image";
import { LoginForm } from "./login-form";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Users, Wallet, Shirt, ShieldCheck } from "lucide-react";

export const metadata = { title: "Sign in — Academy" };

const FEATURES = [
  {
    icon: Users,
    title: "Student management",
    desc: "Profiles, groups, schedules — all in one place.",
  },
  {
    icon: Wallet,
    title: "Payments tracking",
    desc: "Auto-generated invoices, partial payments, reminders.",
  },
  {
    icon: Shirt,
    title: "Uniforms & extras",
    desc: "Track every order and what's still owed.",
  },
];

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ---------- LEFT — branded panel (desktop only) ---------- */}
      <div className="relative hidden overflow-hidden bg-primary lg:flex lg:flex-col lg:justify-between lg:p-12 lg:text-primary-foreground">
        {/* Animated aurora gradient — slowly shifts across the panel */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 animate-aurora bg-gradient-to-br from-primary via-blue-700 to-primary/60"
          style={{ backgroundSize: "200% 200%" }}
        />

        {/* Drifting glow orbs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-32 size-[28rem] animate-drift-1 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-32 size-[32rem] animate-drift-2 rounded-full bg-white/5 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/3 top-1/4 size-[18rem] animate-drift-3 rounded-full bg-cyan-300/15 blur-3xl"
        />

        {/* Slowly rotating conic accent */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 top-1/3 size-[26rem] animate-spin-slow rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "conic-gradient(from 0deg, transparent, rgba(255,255,255,0.15), transparent 60%)",
          }}
        />

        {/* Subtle dot grid */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 animate-pulse-glow opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
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
            className="size-14 rounded-full bg-white/95 object-contain p-1 shadow-xl ring-2 ring-white/40"
            priority
          />
          <div>
            <p className="text-sm font-medium uppercase tracking-widest text-primary-foreground/70">
              Admin Console
            </p>
            <p className="text-xl font-bold tracking-tight">Sakafa Academy</p>
          </div>
        </div>

        {/* Middle: hero copy */}
        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold leading-tight tracking-tight">
            Run your academy without the spreadsheets.
          </h2>
          <p className="mt-4 text-lg text-primary-foreground/80">
            Students, groups, payments, uniforms — every detail in a single,
            sharp dashboard.
          </p>

          <ul className="mt-10 space-y-5">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <li key={f.title} className="flex items-start gap-4">
                  <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
                    <Icon className="size-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{f.title}</p>
                    <p className="mt-0.5 text-sm text-primary-foreground/70">
                      {f.desc}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Bottom: trust badge */}
        <div className="relative z-10 flex items-center gap-2 text-sm text-primary-foreground/70">
          <ShieldCheck className="size-4" />
          <span>Secure admin access · JWT-protected sessions</span>
        </div>
      </div>

      {/* ---------- RIGHT — form panel ---------- */}
      <div className="relative flex flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6 lg:px-12">
        {/* Subtle drifting glow on the right too */}
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -right-40 size-[24rem] animate-drift-1 rounded-full bg-primary/[0.06] blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -left-20 size-[20rem] animate-drift-3 rounded-full bg-primary/[0.05] blur-3xl"
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
            <h1 className="text-3xl font-bold tracking-tight">Sign in</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Welcome back. Enter your admin credentials below.
            </p>
          </div>

          <LoginForm />

          <p className="text-center text-xs text-muted-foreground">
            Need help? Contact your academy admin.
          </p>
        </div>
      </div>
    </div>
  );
}
