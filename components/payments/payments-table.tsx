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
import { markPaymentUnpaid } from "@/lib/actions/payments";
import { PaymentEditDialog } from "./payment-edit-dialog";
import { AddPaymentDialog } from "./add-payment-dialog";
import { useReceiptSender } from "./receipt-dialog";
import { toast } from "sonner";
import { CreditCard, RotateCcw, Pencil, Loader2, MessageCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

type Payment = {
  id: string;
  amount: number;
  /** Sibling discount already taken off `amount` (0 = none). */
  discount: number;
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

export function PaymentsTable({ rows }: { rows: Row[] }) {
  const t = useT();
  const [editing, setEditing] = useState<Payment | null>(null);
  const [recordingFor, setRecordingFor] = useState<{
    payment: Payment;
    studentName: string;
  } | null>(null);
  // Undo erases money that was actually taken, so it always asks first.
  const [undoing, setUndoing] = useState<{ payment: Payment; studentName: string } | null>(
    null,
  );
  const [undoPending, startUndo] = useTransition();
  const receipts = useReceiptSender();

  const confirmUndo = () => {
    if (!undoing) return;
    const id = undoing.payment.id;
    startUndo(async () => {
      const res = await markPaymentUnpaid(id);
      if (res.success === false) {
        toast.error(res.error);
        return;
      }
      toast.success(t("payments.undo.toast"));
      setUndoing(null);
    });
  };

  const renderActions = (r: Row) => (
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
      {r.payment && r.payment.status !== "UNPAID" && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setUndoing({ payment: r.payment!, studentName: r.studentName })}
          disabled={undoPending && undoing?.payment.id === r.payment.id}
        >
          <RotateCcw className="size-4" />
          {t("payments.action.undo")}
        </Button>
      )}
      {r.payment && r.payment.paidAmount > 0 && (
        <Button
          size="icon"
          variant="ghost"
          onClick={() => receipts.send("FEE", r.payment!.id)}
          disabled={receipts.loadingId === r.payment.id}
          aria-label={t("payments.receipt.send")}
          title={t("payments.receipt.send")}
        >
          {receipts.loadingId === r.payment.id ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <MessageCircle className="size-4" />
          )}
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
  );

  const renderStatusBadge = (r: Row) => {
    if (!r.payment)
      return (
        <Badge variant="outline">{t("payments.badge.notGenerated")}</Badge>
      );
    if (r.payment.status === "PAID")
      return <Badge variant="success">{t("common.paid")}</Badge>;
    if (r.payment.status === "PARTIAL")
      return <Badge variant="warning">{t("common.partial")}</Badge>;
    return <Badge variant="alert">{t("common.unpaid")}</Badge>;
  };

  return (
    <>
      {/* ===== Desktop / tablet: table ===== */}
      <Card className="hidden md:block">
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
                <TableCell>{renderStatusBadge(r)}</TableCell>
                <TableCell>{renderActions(r)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* ===== Mobile: card layout ===== */}
      <ul className="space-y-2 md:hidden">
        {rows.map((r) => (
          <li
            key={r.studentId}
            className="rounded-xl border border-border bg-card p-3 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/students/${r.studentId}`}
                  className="block truncate font-semibold hover:underline"
                >
                  {r.studentName}
                </Link>
                {r.groupName && (
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {r.groupName}
                  </p>
                )}
              </div>
              <div className="shrink-0">{renderStatusBadge(r)}</div>
            </div>

            <div className="mt-3">
              {r.payment ? (
                <PaymentProgress payment={r.payment} />
              ) : (
                <p className="text-xs text-muted-foreground">
                  {t("payments.table.noInvoice")}
                </p>
              )}
            </div>

            {r.payment && (
              <div className="mt-3 border-t border-border pt-2">
                {renderActions(r)}
              </div>
            )}
          </li>
        ))}
      </ul>

      {editing && (
        <PaymentEditDialog payment={editing} onClose={() => setEditing(null)} />
      )}
      {recordingFor && (
        <AddPaymentDialog
          paymentId={recordingFor.payment.id}
          studentName={recordingFor.studentName}
          total={recordingFor.payment.amount}
          alreadyPaid={recordingFor.payment.paidAmount}
          existingNotes={recordingFor.payment.notes}
          onClose={() => setRecordingFor(null)}
        />
      )}

      {receipts.dialog}

      <Dialog
        open={undoing !== null}
        onOpenChange={(o) => {
          if (!o && !undoPending) setUndoing(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("payments.undo.title", { name: undoing?.studentName ?? "" })}
            </DialogTitle>
            <DialogDescription>
              {undoing && undoing.payment.paidAmount > 0
                ? t("payments.undo.desc", {
                    amount: formatCurrency(undoing.payment.paidAmount),
                  })
                : t("payments.undo.descZero")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUndoing(null)} disabled={undoPending}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={confirmUndo} disabled={undoPending}>
              {undoPending && <Loader2 className="size-4 animate-spin" />}
              {undoing && undoing.payment.paidAmount > 0
                ? t("payments.undo.confirm", {
                    amount: formatCurrency(undoing.payment.paidAmount),
                  })
                : t("payments.undo.confirmZero")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
      {payment.discount > 0 && (
        <p className="text-[11px] text-muted-foreground">
          {t("payments.discount.note", { amount: formatCurrency(payment.discount) })}
        </p>
      )}
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
