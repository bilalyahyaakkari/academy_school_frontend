import Link from "next/link";
import { attendanceApi } from "@/lib/api/attendance";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { MonthPicker } from "@/components/payments/month-picker";
import { NewChecklistButton } from "@/components/attendance/new-checklist-button";
import { cn, formatDateOnly } from "@/lib/utils";
import { getT, getLocale } from "@/lib/i18n/server";
import { monthLabelI18n } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/i18n";
import { CalendarCheck, ClipboardList, Users, Clock } from "lucide-react";

export const metadata = { title: "Attendance — Academy" };

type SearchParams = Promise<{ year?: string; month?: string }>;

const PALETTES = [
  { bar: "from-blue-500 via-blue-500 to-cyan-400", blob: "bg-blue-400/40", badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300", drift: "animate-drift-1" },
  { bar: "from-purple-500 via-fuchsia-500 to-pink-500", blob: "bg-fuchsia-400/40", badge: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300", drift: "animate-drift-2" },
  { bar: "from-emerald-500 via-emerald-500 to-teal-400", blob: "bg-emerald-400/40", badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300", drift: "animate-drift-3" },
  { bar: "from-amber-500 via-orange-500 to-red-500", blob: "bg-orange-400/40", badge: "bg-orange-500/10 text-orange-700 dark:text-orange-300", drift: "animate-drift-1" },
  { bar: "from-rose-500 via-pink-500 to-rose-400", blob: "bg-rose-400/40", badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300", drift: "animate-drift-2" },
  { bar: "from-indigo-500 via-violet-500 to-purple-500", blob: "bg-violet-400/40", badge: "bg-violet-500/10 text-violet-700 dark:text-violet-300", drift: "animate-drift-3" },
];

export default async function AttendancePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const now = new Date();
  const year = sp.year ? Number(sp.year) : now.getFullYear();
  const month = sp.month ? Number(sp.month) : now.getMonth() + 1;

  const t = await getT();
  const locale = await getLocale();
  const data = await attendanceApi.overview(year, month);
  const monthName = monthLabelI18n(locale, month, year);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("attendance.title")}
        description={t("attendance.desc", { month: monthName })}
      />

      <MonthPicker year={year} month={month} basePath="/attendance" />

      {data.groups.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <CalendarCheck className="size-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">{t("attendance.empty.groups")}</p>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.groups.map((g, i) => {
            const p = PALETTES[i % PALETTES.length];
            return (
              <Card
                key={g.groupId}
                className="relative h-full overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <span
                  aria-hidden
                  className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", p.bar)}
                />
                <span
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute -right-12 -top-12 size-44 rounded-full blur-3xl",
                    p.blob,
                    p.drift,
                  )}
                />
                <CardContent className="relative flex h-full flex-col pt-7">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/attendance/${g.groupId}?year=${year}&month=${month}`}
                      className="text-lg font-bold tracking-tight hover:underline"
                    >
                      {g.groupName}
                    </Link>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        p.badge,
                      )}
                    >
                      {g.attendanceRate != null
                        ? t("attendance.group.rate", { percent: g.attendanceRate })
                        : t("attendance.group.noSessions")}
                    </span>
                  </div>

                  {g.coachName && (
                    <p className="mt-1 text-xs text-muted-foreground">{g.coachName}</p>
                  )}

                  <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users className="size-4" />
                      {t("attendance.group.students", { count: g.studentCount })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ClipboardList className="size-4" />
                      {g.sessionCount === 1
                        ? t("attendance.group.sessions.one")
                        : t("attendance.group.sessions", { count: g.sessionCount })}
                    </span>
                  </div>

                  {g.lastSessionDate && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("attendance.group.last", {
                        date: formatDateOnly(g.lastSessionDate),
                      })}
                    </p>
                  )}

                  {g.schedule.length > 0 && (
                    <div className="mt-4 space-y-1 border-t border-border pt-3">
                      {g.schedule.slice(0, 2).map((s, idx) => (
                        <p
                          key={idx}
                          className="flex items-center gap-2 text-xs text-muted-foreground"
                        >
                          <Clock className="size-3" />
                          <span className="font-medium text-foreground">
                            {t(`day.${s.day}` as TranslationKey)}
                          </span>
                          <span>·</span>
                          <span>
                            {s.startTime}–{s.endTime}
                          </span>
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 flex flex-1 items-end">
                    <NewChecklistButton
                      groupId={g.groupId}
                      className="w-full"
                      label={t("attendance.action.today")}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
