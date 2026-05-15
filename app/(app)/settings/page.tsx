import { settingsApi } from "@/lib/api/settings";
import { studentsApi } from "@/lib/api/students";
import { groupsApi } from "@/lib/api/groups";
import { paymentsApi } from "@/lib/api/payments";
import { ApiError } from "@/lib/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { GeneralSection } from "@/components/settings/general-section";
import { WhatsAppSection } from "@/components/settings/whatsapp-section";
import { SecuritySection } from "@/components/settings/security-section";
import { formatCurrency, cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";
import {
  Users,
  UsersRound,
  Wallet,
  TrendingUp,
  Sparkles,
  Code2,
  HeartHandshake,
} from "lucide-react";

export const metadata = { title: "Settings — Academy" };

type Tone = "blue" | "purple" | "emerald" | "amber";

const TONES: Record<
  Tone,
  { bar: string; blob: string; iconBg: string; drift: string }
> = {
  blue: {
    bar: "from-blue-500 via-blue-500 to-cyan-400",
    blob: "bg-blue-400/40",
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-600 text-white",
    drift: "animate-drift-1",
  },
  purple: {
    bar: "from-purple-500 via-fuchsia-500 to-pink-500",
    blob: "bg-fuchsia-400/40",
    iconBg: "bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white",
    drift: "animate-drift-2",
  },
  emerald: {
    bar: "from-emerald-500 via-emerald-500 to-teal-400",
    blob: "bg-emerald-400/40",
    iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white",
    drift: "animate-drift-3",
  },
  amber: {
    bar: "from-amber-500 via-orange-500 to-red-500",
    blob: "bg-orange-400/40",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-500 text-white",
    drift: "animate-drift-1",
  },
};

export default async function SettingsPage() {
  const now = new Date();
  const t = await getT();
  const [settings, students, groups, history] = await Promise.all([
    settingsApi.get(),
    studentsApi.list({}).catch(() => []),
    groupsApi.list().catch(() => []),
    paymentsApi.history({}).catch(() => []),
  ]);

  const activeStudents = students.filter((s) => s.isActive).length;
  const ytdRevenue = history
    .filter((p) => new Date(p.year, p.month - 1).getFullYear() === now.getFullYear())
    .reduce((sum, p) => sum + p.paidAmount, 0);

  return (
    <div className="space-y-8">
      <PageHeader title={t("settings.title")} description={t("settings.desc")} />

      {/* Stats banner */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label={t("settings.stat.activeStudents")}
          value={String(activeStudents)}
          sub={t("settings.stat.activeStudents.sub", { count: students.length })}
          icon={<Users className="size-5" />}
          tone="blue"
        />
        <Stat
          label={t("settings.stat.groups")}
          value={String(groups.length)}
          icon={<UsersRound className="size-5" />}
          tone="purple"
        />
        <Stat
          label={t("settings.stat.payments")}
          value={String(history.length)}
          sub={t("settings.stat.payments.sub")}
          icon={<Wallet className="size-5" />}
          tone="amber"
        />
        <Stat
          label={t("settings.stat.revenue", { year: now.getFullYear() })}
          value={formatCurrency(ytdRevenue)}
          icon={<TrendingUp className="size-5" />}
          tone="emerald"
        />
      </div>

      {/* Sectioned settings */}
      <GeneralSection defaults={settings} />
      <WhatsAppSection defaults={settings} />
      <SecuritySection />

      {/* About card */}
      <Card className="relative overflow-hidden">
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-fuchsia-500 to-cyan-500"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -right-20 -top-20 size-72 animate-drift-2 rounded-full bg-fuchsia-400/20 blur-3xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-20 -left-20 size-72 animate-drift-3 rounded-full bg-cyan-400/20 blur-3xl"
        />
        <CardContent className="relative pt-6">
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <div className="relative">
              <div className="absolute inset-0 -m-2 animate-pulse-glow rounded-full bg-gradient-to-br from-blue-500 via-fuchsia-500 to-cyan-500 blur-xl" />
              <div className="relative grid size-14 animate-float-bob place-items-center rounded-full bg-gradient-to-br from-blue-500 to-fuchsia-600 text-white shadow-xl">
                <HeartHandshake className="size-7" />
              </div>
            </div>
            <h2 className="text-lg font-bold tracking-tight">
              {t("settings.about.builtFor", { name: settings.academyName })}
            </h2>
            <p className="max-w-md text-sm text-muted-foreground">
              {t("settings.about.tagline")}
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1">
                <Sparkles className="size-3 text-primary" />
                v0.1
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1">
                <Code2 className="size-3" />
                Next.js 16 · NestJS 10 · Prisma 6
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  icon,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  tone: Tone;
}) {
  const t = TONES[tone];
  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <span
        aria-hidden
        className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", t.bar)}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-12 -top-12 size-40 rounded-full blur-3xl",
          t.blob,
          t.drift,
        )}
      />
      <CardContent className="relative pt-7">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-xl shadow-md transition-transform group-hover:scale-110",
              t.iconBg,
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
