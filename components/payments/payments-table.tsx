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
import { markPaymentUnpaid } from "@/lib/actions/payments";
import { PaymentEditDialog } from "./payment-edit-dialog";
import { AddPaymentDialog } from "./add-payment-dialog";
import { toast } from "sonner";
import { CreditCard, RotateCcw, Pencil, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

type Payment = {
  id: string;
  amount: number;
  paidAmount: number;
  status: "PAID" | "UNPAID" | "PARTIAL";
  paymentMethod: "CASH" | "BANK_TRANSFER" | "OTHER" | null;
  paymentDate: string | null;
  notes: string | null;
};

type Row = {
  studentId: string;
  studentName: string;
  phoneNumber: string | null;
  groupName: string | null;
  payment: Payment | null;
};

export function PaymentsTable({
  rows,
  year: _year,
  month: _month,
}: {
  rows: Row[];
  year: number;
  month: number;
}) {
  const t = useT();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [recordingFor, setRecordingFor] = useState<{
    payment: Payment;
    studentName: string;
  } | null>(null);
  const [, startTransition] = useTransition();

  const undoPaid = (row: Row) => {
    if (!row.payment) return;
    const id = row.payment.id;
    setPendingId(id);
    startTransition(async () => {
      const res = await markPaymentUnpaid(id);
      setPendingId(null);
      if (res.success === false) toast.error(res.error);
      else toast.success("Reset to unpaid");
    });
  };

  return (
    <>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.student")}</TableHead>
              <TableHead>{t("table.group")}</TableHead>
              <TableHead className="min-w-[200px]">
                {t("payments.table.payment")}
              </TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead className="text-end">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.studentId}>
                <TableCell className="font-medium">
                  <Link
                    href={`/students/${r.studentId}`}
                    className="hover:underline"
                  >
                    {r.studentName}
                  </Link>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.groupName ?? "—"}
                </TableCell>
                <TableCell>
                  {r.payment ? (
                    <PaymentProgress payment={r.payment} />
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {t("payments.table.noInvoice")}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {!r.payment ? (
                    <Badge variant="outline">
                      {t("payments.badge.notGenerated")}
                    </Badge>
                  ) : r.payment.status === "PAID" ? (
                    <Badge variant="success">{t("common.paid")}</Badge>
                  ) : r.payment.status === "PARTIAL" ? (
                    <Badge variant="warning">{t("common.partial")}</Badge>
                  ) : (
                    <Badge variant="secondary">{t("common.unpaid")}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {r.payment && r.payment.status !== "PAID" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          setRecordingFor({
                            payment: r.payment!,
                            studentName: r.studentName,
                          })
                        }
                      >
                        <CreditCard className="size-4" />
                        {t("payments.action.record")}
                      </Button>
                    )}
                    {r.payment && r.payment.status === "PAID" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => undoPaid(r)}
                        disabled={pendingId === r.payment.id}
                      >
                        {pendingId === r.payment.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <RotateCcw className="size-4" />
                        )}
                        {t("payments.action.undo")}
                      </Button>
                    )}
                    {r.payment && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setEditing(r.payment)}
                        aria-label={t("common.edit")}
                      >
                        <Pencil className="size-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {editing && (
        <PaymentEditDialog payment={editing} onClose={() => setEditing(null)} />
      )}
      {recordingFor && (
        <AddPaymentDialog
          paymentId={recordingFor.payment.id}
          studentName={recordingFor.studentName}
          total={recordingFor.payment.amount}
          alreadyPaid={recordingFor.payment.paidAmount}
          onClose={() => setRecordingFor(null)}
        />
      )}
    </>
  );
}

function PaymentProgress({ payment }: { payment: Payment }) {
  const t = useT();
  const pct =
    payment.amount > 0
      ? Math.min(100, (payment.paidAmount / payment.amount) * 100)
      : 0;
  const remaining = Math.max(0, payment.amount - payment.paidAmount);

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-semibold">{formatCurrency(payment.paidAmount)}</span>
        <span className="text-xs text-muted-foreground">
          / {formatCurrency(payment.amount)}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={
            payment.status === "PAID"
              ? "h-full bg-success transition-all"
              : payment.status === "PARTIAL"
                ? "h-full bg-warning transition-all"
                : "h-full bg-muted-foreground/20 transition-all"
          }
          style={{ width: `${pct}%` }}
        />
      </div>
      {remaining > 0 && payment.paidAmount > 0 && (
        <p className="text-[11px] text-destructive">
          {t("payments.progress.remaining", {
            amount: formatCurrency(remaining),
          })}
        </p>
      )}
    </div>
  );
}
