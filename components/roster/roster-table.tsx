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
      // An invoice is only ever kept when money was recorded against it — say so,
      // otherwise it looks like the removal didn't fully take.
      const kept = res.data?.keptInvoices.length ?? 0;
      if (kept > 0) {
        toast.info(
          kept === 1
            ? t("roster.toast.invoiceKept", { count: kept })
            : t("roster.toast.invoiceKept.plural", { count: kept }),
        );
      }
      setConfirm(null);
    });
  };

  const statusBadge = (s: RosterStudent) => {
    if (!s.payment) return <Badge variant="outline">{t("roster.invoice.none")}</Badge>;
    if (s.payment.status === "PAID")
      return (
        <Badge variant="success">{t("common.paid")}</Badge>
      );
    if (s.payment.status === "PARTIAL")
      return (
        <Badge variant="warning">{t("common.partial")}</Badge>
      );
    return (
      <Badge variant="alert">{t("common.unpaid")}</Badge>
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
                      <Badge variant="soft">{t("roster.badge.new")}</Badge>
                    )}
                    {s.archived && (
                      <Badge variant="soft">{t("roster.badge.left")}</Badge>
                    )}
                  </div>
                  {s.phoneNumber && (
                    <p className="text-xs text-muted-foreground">
                      <span dir="ltr">{s.phoneNumber}</span>
                    </p>
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
                      title={t("payments.roster.remove.label", { month: monthName })}
                      aria-label={t("payments.roster.remove.label", { month: monthName })}
                      onClick={() => setConfirm({ student: s, mode: "remove" })}
                    >
                      <X className="size-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-sea-900/70 hover:bg-sea-100 hover:text-sea-900"
                      title={t("payments.roster.left.label", { month: monthName })}
                      aria-label={t("payments.roster.left.label", { month: monthName })}
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
                : t("payments.roster.remove.desc", {
                    name: confirm?.student.fullName ?? "",
                    month: monthName,
                  })}
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
