"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updatePayment } from "@/lib/actions/payments";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

type Payment = {
  id: string;
  amount: number;
  paidAmount: number;
  status: "PAID" | "UNPAID" | "PARTIAL";
  paymentMethod: "CASH" | "BANK_TRANSFER" | "OTHER" | null;
  notes: string | null;
};

type Method = "CASH" | "BANK_TRANSFER" | "OTHER";

export function PaymentEditDialog({
  payment,
  onClose,
}: {
  payment: Payment;
  onClose: () => void;
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(payment.status);
  const [method, setMethod] = useState<Method>(payment.paymentMethod ?? "CASH");

  // Highest valid partial amount: one cent under the total.
  const partialMax = Math.max(0, Number((payment.amount - 0.01).toFixed(2)));

  // onSubmit rather than <form action>: React 19 resets an action form's
  // uncontrolled fields after every submit, even a failed one.
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("paymentId", payment.id);
    formData.set("status", status);
    formData.set("paymentMethod", method);
    formData.set("total", String(payment.amount));

    if (status === "PARTIAL") {
      const paid = Number(formData.get("paidAmount"));
      if (!Number.isFinite(paid) || paid <= 0 || paid >= payment.amount) {
        toast.error(
          t("payments.validation.partialRange", { total: formatCurrency(payment.amount) }),
        );
        return;
      }
    }

    startTransition(async () => {
      const res = await updatePayment(formData);
      if (res.success) {
        toast.success(t("payments.edit.toast.saved"));
        // Unmounts the dialog, so it opens fresh next time.
        onClose();
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("payments.edit.title")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("table.status")}</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Payment["status"])}>
              <SelectTrigger aria-label={t("table.status")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PAID">{t("common.paid")}</SelectItem>
                <SelectItem value="PARTIAL">{t("common.partial")}</SelectItem>
                <SelectItem value="UNPAID">{t("common.unpaid")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === "PARTIAL" && (
            <div className="space-y-2">
              <Label htmlFor="paidAmount">
                {t("payments.edit.paidAmount", { total: formatCurrency(payment.amount) })}
              </Label>
              <Input
                id="paidAmount"
                name="paidAmount"
                type="number"
                step="0.01"
                min={0.01}
                max={partialMax}
                defaultValue={
                  payment.paidAmount > 0 && payment.paidAmount < payment.amount
                    ? payment.paidAmount
                    : undefined
                }
                required
              />
              <p className="text-xs text-muted-foreground">{t("payments.edit.partialHint")}</p>
            </div>
          )}

          {status !== "UNPAID" && (
            <div className="space-y-2">
              <Label>{t("payments.field.method")}</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as Method)}>
                <SelectTrigger aria-label={t("payments.field.method")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">{t("payments.method.CASH")}</SelectItem>
                  <SelectItem value="BANK_TRANSFER">
                    {t("payments.method.BANK_TRANSFER")}
                  </SelectItem>
                  <SelectItem value="OTHER">{t("payments.method.OTHER")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">{t("payments.field.notes")}</Label>
            <Textarea id="notes" name="notes" rows={3} defaultValue={payment.notes ?? ""} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
