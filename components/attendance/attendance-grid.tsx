"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AttendanceGrid as Grid } from "@/lib/api/types";
import { cn, dayOfMonth, formatDateOnly, todayIso, weekdayShort } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/client";
import { CalendarClock, CalendarX, Check, Minus, X } from "lucide-react";
import { isoDay } from "./session-dates";

/**
 * Students down the side, checklists across the top, times-attended on the end.
 * This is the "how many times did each student come this month" view.
 */
export function AttendanceGrid({ grid }: { grid: Grid }) {
  const t = useT();
  const locale = useLocale();
  const today = todayIso();
  // Columns sit on the day each session ACTUALLY happened (a moved session
  // shows on its new day with a "moved" marker), in time order.
  const sessions = [...grid.sessions].sort(
    (a, b) =>
      isoDay(a.actualDate ?? a.date).localeCompare(isoDay(b.actualDate ?? b.date)) ||
      (a.startTime ?? "").localeCompare(b.startTime ?? ""),
  );
  const order = new Map(sessions.map((s, i) => [s.id, i]));
  const byOrder = (a: { sessionId: string }, b: { sessionId: string }) =>
    (order.get(a.sessionId) ?? 0) - (order.get(b.sessionId) ?? 0);
  const cancelledIds = new Set(sessions.filter((s) => s.cancelled).map((s) => s.id));
  const movedDay = (s: (typeof sessions)[number]) =>
    !!s.actualDate && !!s.originalDate && isoDay(s.actualDate) !== isoDay(s.originalDate);
  // Moved to a day that hasn't come yet: nothing to count as an absence.
  const upcomingIds = new Set(
    sessions.filter((s) => s.postponed && isoDay(s.actualDate ?? s.date) > today).map((s) => s.id),
  );
  const anyMoved = sessions.some(movedDay);

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted text-secondary-foreground hover:bg-muted [&>th]:text-secondary-foreground">
            <TableHead className="sticky start-0 z-10 bg-muted ps-4">
              {t("attendance.grid.student")}
            </TableHead>
            {sessions.map((s) => {
              const cancelledTitle = s.cancelReason
                ? t("attendance.grid.cancelledTitle", { reason: s.cancelReason })
                : t("attendance.cancelled.badge");
              const day = isoDay(s.actualDate ?? s.date);
              const moved = movedDay(s);
              const movedTitle = moved
                ? t("attendance.grid.movedTitle", { date: formatDateOnly(s.originalDate, locale) })
                : null;
              return (
                <TableHead
                  key={s.id}
                  className={cn("px-1 text-center", s.cancelled && "bg-sea-100/60 dark:bg-sea-900/40")}
                >
                  <Link
                    href={`/attendance/session/${s.id}`}
                    className={cn(
                      "flex flex-col items-center rounded-md px-2 py-1 transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      s.cancelled && "opacity-70",
                    )}
                    title={
                      s.cancelled
                        ? cancelledTitle
                        : movedTitle
                          ? `${movedTitle} · ${s.presentCount}/${s.totalCount}`
                          : `${s.presentCount}/${s.totalCount}`
                    }
                    aria-label={
                      s.cancelled
                        ? `${formatDateOnly(day, locale)} — ${cancelledTitle}`
                        : movedTitle
                          ? `${formatDateOnly(day, locale)} — ${movedTitle}`
                          : undefined
                    }
                  >
                    <span
                      className={cn(
                        "text-sm font-bold text-foreground",
                        s.cancelled && "text-muted-foreground line-through",
                      )}
                    >
                      {dayOfMonth(day)}
                    </span>
                    <span className="text-[10px] uppercase">
                      {weekdayShort(day, locale === "ar" ? "ar" : "en")}
                    </span>
                    {moved && (
                      <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-medium normal-case text-sea-800 dark:text-sea-300">
                        <CalendarClock aria-hidden className="size-3" />
                        {t("attendance.grid.moved")}
                      </span>
                    )}
                    {s.cancelled && (
                      <span className="mt-0.5 inline-flex items-center gap-0.5 text-[10px] font-medium normal-case text-muted-foreground">
                        <CalendarX aria-hidden className="size-3" />
                        {t("attendance.cancelled.badge")}
                      </span>
                    )}
                  </Link>
                </TableHead>
              );
            })}
            <TableHead className="pe-4 text-end">{t("attendance.grid.total")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grid.students.map((s) => (
            <TableRow key={s.studentId}>
              <TableCell className="sticky start-0 z-10 bg-card ps-4">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/students/${s.studentId}`}
                    className="font-medium hover:underline"
                  >
                    {s.fullName}
                  </Link>
                  {s.isGuest ? (
                    <Badge variant="soft">{t("attendance.guest.badge")}</Badge>
                  ) : (
                    !s.onRoster && (
                      <Badge variant="warning">
                        {t("attendance.grid.offRoster")}
                      </Badge>
                    )
                  )}
                </div>
              </TableCell>
              {[...s.cells].sort(byOrder).map((c) =>
                cancelledIds.has(c.sessionId) ? (
                  // Cancelled: nobody was expected, so it's not an absence.
                  <TableCell
                    key={c.sessionId}
                    className="bg-sea-100/60 px-1 text-center dark:bg-sea-900/40"
                  >
                    <span className="sr-only">{t("attendance.cancelled.badge")}</span>
                  </TableCell>
                ) : (
                  <TableCell key={c.sessionId} className="px-1 text-center">
                    {c.present === true ? (
                      <Check aria-label={t("attendance.sheet.present")} className="mx-auto size-4 text-success" />
                    ) : c.present === false && !upcomingIds.has(c.sessionId) ? (
                      <X aria-label={t("attendance.sheet.absent")} className="mx-auto size-4 text-destructive/60" />
                    ) : (
                      <Minus aria-hidden className="mx-auto size-4 text-muted-foreground/40" />
                    )}
                  </TableCell>
                ),
              )}
              <TableCell className="pe-4 text-end">
                <span
                  className={cn(
                    "inline-flex min-w-9 justify-center rounded-full px-2 py-0.5 text-sm font-bold tabular-nums",
                    s.presentCount === 0
                      ? "bg-muted text-muted-foreground"
                      : "bg-sea-100 text-sea-900",
                  )}
                >
                  {s.presentCount}
                </span>
                {/* Out of the checklists they were actually on — a student who
                    joined mid-month isn't marked down for the ones before. */}
                <span className="ms-1 text-xs text-muted-foreground">
                  / {s.presentCount + s.absentCount}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
        {t("attendance.grid.legend")}
        {cancelledIds.size > 0 && <> · {t("attendance.grid.legendCancelled")}</>}
        {anyMoved && <> · {t("attendance.grid.legendMoved")}</>}
      </p>
    </Card>
  );
}
