import Link from "next/link";
import { studentsApi } from "@/lib/api/students";
import { groupsApi } from "@/lib/api/groups";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { StudentsFilterBar } from "@/components/students/students-filter-bar";
import { StudentsTable } from "@/components/students/students-table";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";
import {
  Plus,
  UserPlus2,
  Download,
  Upload,
  Users,
  CircleCheck,
  CircleSlash,
  Sparkles,
} from "lucide-react";

export const metadata = { title: "Students — Academy" };

type SearchParams = Promise<{
  q?: string;
  groupId?: string;
  status?: string;
}>;

type Tone = "blue" | "green" | "slate";

const TONES: Record<
  Tone,
  { bar: string; blob: string; iconBg: string; valueText: string; drift: string }
> = {
  blue: {
    bar: "from-blue-500 via-blue-500 to-cyan-400",
    blob: "bg-blue-400/40",
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-600 text-white",
    valueText: "",
    drift: "animate-drift-1",
  },
  green: {
    bar: "from-emerald-500 via-emerald-500 to-teal-400",
    blob: "bg-emerald-400/40",
    iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white",
    valueText: "text-emerald-600 dark:text-emerald-400",
    drift: "animate-drift-2",
  },
  slate: {
    bar: "from-slate-500 via-slate-500 to-slate-400",
    blob: "bg-slate-400/30",
    iconBg: "bg-gradient-to-br from-slate-500 to-slate-700 text-white",
    valueText: "text-slate-500 dark:text-slate-400",
    drift: "animate-drift-3",
  },
};

export default async function StudentsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const groupParam = sp.groupId === "__none__" ? "none" : sp.groupId || undefined;
  const status = sp.status as "active" | "inactive" | undefined;

  const t = await getT();

  // 2 parallel fetches:
  //   - filtered list for the table (matches what the user is filtering for)
  //   - unfiltered list to compute the academy-wide stats banner
  const [students, allStudents, groups] = await Promise.all([
    studentsApi.list({ q: q || undefined, groupId: groupParam, status }),
    studentsApi.list({}),
    groupsApi.list(),
  ]);

  const total = allStudents.length;
  const active = allStudents.filter((s) => s.isActive).length;
  const inactive = total - active;
  const isFiltered = !!(q || sp.groupId || status);

  const exportParams = new URLSearchParams();
  if (q) exportParams.set("q", q);
  if (sp.groupId) exportParams.set("groupId", sp.groupId);
  if (status) exportParams.set("status", status);
  const exportHref = `/api/students/export${
    exportParams.toString() ? `?${exportParams.toString()}` : ""
  }`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("students.title")}
        description={
          isFiltered
            ? t("students.desc.showing", { filtered: students.length, total })
            : total === 1
              ? t("students.desc.enrolled.one")
              : t("students.desc.enrolled", { count: total })
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/students/import">
                <Upload className="size-4" />
                {t("students.action.import")}
              </Link>
            </Button>
            <Button asChild variant="outline" disabled={students.length === 0}>
              <a href={exportHref} download>
                <Download className="size-4" />
                {t("students.action.exportExcel")}
              </a>
            </Button>
            <Button asChild>
              <Link href="/students/new">
                <Plus className="size-4" />
                {t("students.action.add")}
              </Link>
            </Button>
          </>
        }
      />

      {/* Stats banner */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={t("students.stat.total")}
          value={String(total)}
          sub={t("students.stat.total.groups", { count: groups.length })}
          icon={<Users className="size-5" />}
          tone="blue"
        />
        <StatCard
          label={t("students.stat.active")}
          value={String(active)}
          sub={
            total > 0
              ? t("students.stat.active.sub", {
                  percent: Math.round((active / total) * 100),
                })
              : undefined
          }
          icon={<CircleCheck className="size-5" />}
          tone="green"
        />
        <StatCard
          label={t("students.stat.inactive")}
          value={String(inactive)}
          sub={inactive === 0 ? t("students.stat.inactive.allActive") : undefined}
          icon={<CircleSlash className="size-5" />}
          tone="slate"
        />
      </div>

      <StudentsFilterBar
        groups={groups.map((g) => ({ id: g.id, name: g.name }))}
        initialQ={q}
        initialGroupId={sp.groupId}
        initialStatus={status}
      />

      {students.length === 0 ? (
        <Card className="relative overflow-hidden">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 via-fuchsia-500 to-cyan-500"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -right-20 -top-20 size-72 animate-drift-1 rounded-full bg-blue-400/15 blur-3xl"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-20 -left-20 size-64 animate-drift-2 rounded-full bg-fuchsia-400/15 blur-3xl"
          />
          <CardContent className="relative flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="relative">
              <div className="absolute inset-0 -m-2 animate-pulse-glow rounded-full bg-gradient-to-br from-blue-500 via-fuchsia-500 to-cyan-500 blur-xl" />
              <div className="relative grid size-20 animate-float-bob place-items-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 shadow-xl shadow-blue-500/30">
                <UserPlus2 className="size-10 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold tracking-tight">
                {isFiltered
                  ? t("students.empty.title.filtered")
                  : t("students.empty.title")}
              </h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                {isFiltered
                  ? t("students.empty.sub.filtered")
                  : t("students.empty.sub")}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <Button asChild>
                <Link href="/students/new">
                  <Plus className="size-4" />
                  {t("students.action.add")}
                </Link>
              </Button>
              {!isFiltered && (
                <Button asChild variant="outline">
                  <Link href="/students/import">
                    <Upload className="size-4" />
                    {t("students.empty.importBtn")}
                  </Link>
                </Button>
              )}
            </div>
            <p className="flex items-center gap-1.5 pt-3 text-xs text-muted-foreground">
              <Sparkles className="size-3 text-primary" />
              <span>{t("students.empty.importHint")}</span>
            </p>
          </CardContent>
        </Card>
      ) : (
        <StudentsTable students={students} />
      )}
    </div>
  );
}

function StatCard({
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
            <p
              className={cn(
                "mt-2 text-3xl font-bold tracking-tight",
                t.valueText,
              )}
            >
              {value}
            </p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div
            className={cn(
              "grid size-12 shrink-0 place-items-center rounded-xl shadow-md transition-transform group-hover:scale-110",
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
