"use client";

import { useState, useTransition } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { removeStudentFromMonth, markStudentLeft } from "@/lib/actions/roster";
import type { RosterStudent } from "@/lib/api/types";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/client";
import { Loader2, LogOut, X } from "lucide-react";

type Mode = "remove" | "left";

export function RosterTable({
  year,
  month,
  monthName,
  students,
}: {
  year: number;
  month: number;
  monthName: string;
  students: RosterStudent[];
}) {
  const t = useT();
  const [confirm, setConfirm] = useState<{ student: RosterStudent; mode: Mode } | null>(
    null,
  );
  const [pending, start] = useTransition();

  const run = () => {
    if (!confirm) return;
    const { student, mode } = confirm;
    start(async () => {
      const res =
        mode === "left"
          ? await markStudentLeft(year, month, student.studentId)
          : await removeStudentFromMonth(year, month, student.studentId);
      if (res.success === false) {
        toast.error(res.error);
        return;
      }
      toast.success(
        mode === "left"
          ? t("roster.toast.left", { month: monthName })
          : t("roster.toast.removed", { month: monthName }),
      );
      setConfirm(null);
    });
  };

  const statusBadge = (s: RosterStudent) => {
    if (!s.payment) return <Badge variant="outline">{t("roster.invoice.none")}</Badge>;
    if (s.payment.status === "PAID")
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
          {t("common.paid")}
        </Badge>
      );
    if (s.payment.status === "PARTIAL")
      return (
        <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400">
          {t("common.partial")}
        </Badge>
      );
    return (
      <Badge className="bg-rose-500/15 text-rose-700 hover:bg-rose-500/15 dark:text-rose-400">
        {t("common.unpaid")}
      </Badge>
    );
  };

  return (
    <>
      <Card className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="ps-4">{t("table.student")}</TableHead>
              <TableHead>{t("table.group")}</TableHead>
              <TableHead>{t("roster.table.invoice")}</TableHead>
              <TableHead className="text-end">{t("table.amount")}</TableHead>
              <TableHead className="pe-4 text-end">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => (
              <TableRow key={s.enrollmentId}>
                <TableCell className="ps-4">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/students/${s.studentId}`}
                      className="font-medium hover:underline"
                    >
                      {s.fullName}
                    </Link>
                    {s.isNew && (
                      <Badge className="bg-blue-500/15 text-blue-700 hover:bg-blue-500/15 dark:text-blue-400">
                        {t("roster.badge.new")}
                      </Badge>
                    )}
                    {s.archived && (
                      <Badge
                        variant="outline"
                        className="border-amber-500/40 text-amber-600 dark:text-amber-400"
                      >
                        {t("roster.badge.left")}
                      </Badge>
                    )}
                  </div>
                  {s.phoneNumber && (
                    <p className="text-xs text-muted-foreground">{s.phoneNumber}</p>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {s.group?.name ?? "—"}
                </TableCell>
                <TableCell>{statusBadge(s)}</TableCell>
                <TableCell className="text-end tabular-nums">
                  {s.payment
                    ? `${formatCurrency(s.payment.paidAmount)} / ${formatCurrency(s.payment.amount)}`
                    : "—"}
                </TableCell>
                <TableCell className="pe-4">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      title={t("roster.action.remove")}
                      aria-label={t("roster.action.remove")}
                      onClick={() => setConfirm({ student: s, mode: "remove" })}
                    >
                      <X className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-amber-600 hover:bg-amber-500/10 hover:text-amber-700 dark:text-amber-400"
                      title={t("roster.action.markLeft")}
                      aria-label={t("roster.action.markLeft")}
                      onClick={() => setConfirm({ student: s, mode: "left" })}
                    >
                      <LogOut className="size-4 rtl:rotate-180" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm?.mode === "left"
                ? t("roster.markLeft.title", { name: confirm?.student.fullName ?? "" })
                : t("roster.remove.title", {
                    name: confirm?.student.fullName ?? "",
                    month: monthName,
                  })}
            </DialogTitle>
            <DialogDescription>
              {confirm?.mode === "left"
                ? t("roster.markLeft.desc", { month: monthName })
                : t("roster.remove.desc", { month: monthName })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirm(null)} disabled={pending}>
              {t("common.cancel")}
            </Button>
            <Button
              variant={confirm?.mode === "left" ? "destructive" : "default"}
              onClick={run}
              disabled={pending}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {confirm?.mode === "left"
                ? t("roster.markLeft.confirm")
                : t("roster.remove.confirm", { month: monthName })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
