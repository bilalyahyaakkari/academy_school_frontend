import Link from "next/link";
import { attendanceApi } from "@/lib/api/attendance";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MonthPicker } from "@/components/payments/month-picker";
import { formatDateOnly } from "@/lib/utils";
import { getLocale, getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n";
import { CalendarCheck, ChevronRight, ClipboardList, Clock, Users } from "lucide-react";

/**
 * The "History" tab: one card per group for the chosen month — checklists
 * taken, attendance rate, and a way into that group's month grid.
 *
 * MonthPicker navigates to /attendance?year=&month=; the page treats a bare
 * year/month as the History tab, so the picker works as is.
 */
export async function HistoryView({ year, month }: { year: number; month: number }) {
  const t = await getT();
  const locale = await getLocale();
  const data = await attendanceApi.overview(year, month);

  return (
    <div className="space-y-5">
      <MonthPicker year={year} month={month} basePath="/attendance" />

      {data.groups.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <div className="rounded-full bg-sea-100 p-4 text-sea-900">
            <CalendarCheck className="size-8" />
          </div>
          <p className="text-sm text-muted-foreground">{t("attendance.empty.groups")}</p>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.groups.map((g) => {
            const monthHref = `/attendance/${g.groupId}?year=${year}&month=${month}`;
            return (
              <li key={g.groupId}>
                <Card className="flex h-full flex-col p-5 transition-colors hover:border-sea-300">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-lg font-semibold tracking-tight">
                        <Link href={monthHref} className="hover:underline">
                          {g.groupName}
                        </Link>
                      </h3>
                      {g.coachName && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {g.coachName}
                        </p>
                      )}
                    </div>
                    <Badge variant={g.attendanceRate != null ? "soft" : "outline"} className="shrink-0">
                      {g.attendanceRate != null
                        ? t("attendance.group.rate", { percent: g.attendanceRate })
                        : t("attendance.group.noSessions")}
                    </Badge>
                  </div>

                  {g.attendanceRate != null && (
                    <div
                      aria-hidden
                      title={t("attendance.history.rateLabel")}
                      className="mt-4 h-1.5 overflow-hidden rounded-full bg-sea-100 dark:bg-sea-900"
                    >
                      <div
                        className="h-full rounded-full bg-sea-700 dark:bg-sea-500"
                        style={{ width: `${Math.min(100, Math.max(0, g.attendanceRate))}%` }}
                      />
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Users aria-hidden className="size-4" />
                      {t("attendance.group.students", { count: g.studentCount })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <ClipboardList aria-hidden className="size-4" />
                      {g.sessionCount === 1
                        ? t("attendance.group.sessions.one")
                        : t("attendance.group.sessions", { count: g.sessionCount })}
                    </span>
                  </div>

                  {g.lastSessionDate && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("attendance.group.last", {
                        date: formatDateOnly(g.lastSessionDate, locale),
                      })}
                    </p>
                  )}

                  {g.schedule.length > 0 && (
                    <div className="mt-4 space-y-1 border-t border-border pt-3">
                      {g.schedule.slice(0, 3).map((s, idx) => (
                        <p key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock aria-hidden className="size-3" />
                          <span className="font-medium text-foreground">
                            {t(`day.${s.day}` as TranslationKey)}
                          </span>
                          <bdi dir="ltr" className="tabular-nums">
                            {s.startTime}–{s.endTime}
                          </bdi>
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 flex flex-1 items-end">
                    <Button asChild variant="outline" className="w-full justify-between">
                      <Link href={monthHref}>
                        {t("attendance.history.viewMonth")}
                        <ChevronRight aria-hidden className="rtl:rotate-180" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
