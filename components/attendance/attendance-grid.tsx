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
import { cn, dayOfMonth, weekdayShort } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/client";
import { Check, Minus, X } from "lucide-react";

/**
 * Students down the side, checklists across the top, times-attended on the end.
 * This is the "how many times did each student come this month" view.
 */
export function AttendanceGrid({ grid }: { grid: Grid }) {
  const t = useT();
  const locale = useLocale();

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky start-0 z-10 bg-card ps-4">
              {t("attendance.grid.student")}
            </TableHead>
            {grid.sessions.map((s) => (
              <TableHead key={s.id} className="px-1 text-center">
                <Link
                  href={`/attendance/session/${s.id}`}
                  className="flex flex-col items-center rounded-md px-2 py-1 transition-colors hover:bg-muted"
                  title={`${s.presentCount}/${s.totalCount}`}
                >
                  <span className="text-sm font-bold text-foreground">
                    {dayOfMonth(s.date)}
                  </span>
                  <span className="text-[10px] uppercase">
                    {weekdayShort(s.date, locale === "ar" ? "ar" : "en")}
                  </span>
                </Link>
              </TableHead>
            ))}
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
                  {!s.onRoster && (
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 text-amber-600 dark:text-amber-400"
                    >
                      {t("attendance.grid.offRoster")}
                    </Badge>
                  )}
                </div>
              </TableCell>
              {s.cells.map((c) => (
                <TableCell key={c.sessionId} className="px-1 text-center">
                  {c.present === true ? (
                    <Check className="mx-auto size-4 text-emerald-600 dark:text-emerald-400" />
                  ) : c.present === false ? (
                    <X className="mx-auto size-4 text-rose-500/70" />
                  ) : (
                    <Minus className="mx-auto size-4 text-muted-foreground/40" />
                  )}
                </TableCell>
              ))}
              <TableCell className="pe-4 text-end">
                <span
                  className={cn(
                    "inline-flex min-w-9 justify-center rounded-full px-2 py-0.5 text-sm font-bold tabular-nums",
                    s.presentCount === 0
                      ? "bg-muted text-muted-foreground"
                      : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
                  )}
                >
                  {s.presentCount}
                </span>
                <span className="ms-1 text-xs text-muted-foreground">
                  / {grid.sessionCount}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="border-t border-border px-4 py-2.5 text-xs text-muted-foreground">
        {t("attendance.grid.legend")}
      </p>
    </Card>
  );
}
