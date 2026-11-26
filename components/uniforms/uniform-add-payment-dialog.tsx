"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addUniformPayment } from "@/lib/actions/uniforms";
import type { ReceiptMessage } from "@/lib/actions/payments";
import type { PaymentMethod } from "@/lib/api/types";
import { loadReceipt, PaymentRecordedDialog } from "@/components/payments/receipt-dialog";
import { useT } from "@/lib/i18n/client";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Props = {
  uniformId: string;
  studentName: string;
  total: number;
  alreadyPaid: number;
  onClose: () => void;
};

export function UniformAddPaymentDialog({
  uniformId,
  studentName,
  total,
  alreadyPaid,
  onClose,
}: Props) {
  const t = useT();
  // Rounded to cents: 50 − 42.14 is 7.859999… in floating point, and an
  // unrounded `max` makes the browser reject "7.86" ("must be ≤ 7.859999").
  const remaining = Number(Math.max(0, total - alreadyPaid).toFixed(2));
  const [amount, setAmount] = useState<string>(remaining.toFixed(2));
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [pending, startTransition] = useTransition();
  // Set once the payment is saved: the dialog then offers a WhatsApp receipt.
  const [receipt, setReceipt] = useState<ReceiptMessage | null>(null);

  const numericAmount = Number(amount);
  const willCover =
    Number.isFinite(numericAmount) && numericAmount >= remaining && remaining > 0;

  // onSubmit rather than <form action>, so React 19 doesn't reset the form
  // when the server rejects the payment.
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("paymentMethod", method);
    startTransition(async () => {
      const res = await addUniformPayment(uniformId, formData);
      if (res.success === false) {
        toast.error(res.error);
        return;
      }
      toast.success(
        willCover
          ? t("uniforms.payment.toast.fullyPaid")
          : t("uniforms.payment.toast.recorded", {
              amount: formatCurrency(numericAmount),
            }),
      );
      // Offer a receipt (a link the admin clicks — opened from here, after
      // an await, it would be popup-blocked).
      const r = await loadReceipt("UNIFORM", uniformId);
      if (r) setReceipt(r);
      else onClose();
    });
  };

  if (receipt) {
    return (
      <PaymentRecordedDialog studentName={studentName} receipt={receipt} onClose={onClose} />
    );
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("uniforms.payment.title")}</DialogTitle>
          <DialogDescription>{studentName}</DialogDescription>
        </DialogHeader>

        {/* Summary panel */}
        <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-muted/30 p-3 text-center text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {t("uniforms.payment.total")}
            </p>
            <p className="mt-0.5 font-semibold">{formatCurrency(total)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {t("uniforms.payment.alreadyPaid")}
            </p>
            <p className="mt-0.5 font-semibold text-success">
              {formatCurrency(alreadyPaid)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {t("uniforms.payment.remaining")}
            </p>
            <p className="mt-0.5 font-semibold text-destructive">
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="uniform-payment-amount">{t("uniforms.payment.amount")} *</Label>
            <Input
              id="uniform-payment-amount"
              name="amount"
              type="number"
              min={0.01}
              max={Number((remaining || total).toFixed(2))}
              step="0.01"
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount(remaining.toFixed(2))}
                disabled={remaining <= 0}
              >
                {t("uniforms.payment.payFull", {
                  amount: formatCurrency(remaining),
                })}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount((remaining / 2).toFixed(2))}
                disabled={remaining <= 0}
              >
                {t("uniforms.payment.half")}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>{t("payments.field.method")}</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
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

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={pending}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={pending || numericAmount <= 0}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {t("uniforms.payment.record")}{" "}
              {numericAmount > 0 ? formatCurrency(numericAmount) : ""}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
