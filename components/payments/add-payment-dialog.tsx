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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addPayment, type ReceiptMessage } from "@/lib/actions/payments";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { loadReceipt, PaymentRecordedDialog } from "./receipt-dialog";

type Method = "CASH" | "BANK_TRANSFER" | "OTHER";

type Props = {
  paymentId: string;
  studentName: string;
  total: number;
  alreadyPaid: number;
  /** The invoice's current note — prefilled so a new one doesn't silently replace it. */
  existingNotes?: string | null;
  onClose: () => void;
};

/** Rounds to cents so float noise (10 - 2.14 = 7.859999…) never blocks a submit. */
const cents = (n: number) => Number(n.toFixed(2));

export function AddPaymentDialog({
  paymentId,
  studentName,
  total,
  alreadyPaid,
  existingNotes,
  onClose,
}: Props) {
  const t = useT();
  const remaining = Math.max(0, cents(total - alreadyPaid));
  const [amount, setAmount] = useState<string>(remaining.toFixed(2));
  const [method, setMethod] = useState<Method>("CASH");
  const [pending, startTransition] = useTransition();
  // Set once the payment is saved: the dialog then offers a WhatsApp receipt.
  const [receipt, setReceipt] = useState<ReceiptMessage | null>(null);

  const numericAmount = Number(amount);
  const willCover =
    Number.isFinite(numericAmount) && numericAmount >= remaining && remaining > 0;

  // onSubmit rather than <form action>: React 19 resets an action form's
  // uncontrolled fields after every submit — even one that failed — which
  // would wipe the note the admin just typed.
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("paymentMethod", method);
    startTransition(async () => {
      const res = await addPayment(paymentId, formData);
      if (res.success === false) {
        toast.error(res.error);
        return;
      }
      toast.success(
        willCover
          ? t("uniforms.payment.toast.fullyPaid")
          : t("uniforms.payment.toast.recorded", { amount: formatCurrency(numericAmount) }),
      );
      // Offer a receipt. The wa.me link can't be opened from here (after an
      // await it would be popup-blocked), so the dialog shows a link to click.
      const r = await loadReceipt("FEE", paymentId);
      if (r) setReceipt(r);
      // Unmounts the dialog, so it opens fresh next time.
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
          <DialogTitle>{t("payments.action.record")}</DialogTitle>
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
            <Label htmlFor="amount">{t("payments.add.amount")}</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min={0.01}
              max={remaining || cents(total)}
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
                {t("uniforms.payment.payFull", { amount: formatCurrency(remaining) })}
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

          <div className="space-y-2">
            <Label htmlFor="notes">{t("payments.field.notes")}</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              defaultValue={existingNotes ?? ""}
            />
            {existingNotes && (
              <p className="text-xs text-muted-foreground">{t("payments.add.notesHint")}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={pending || !Number.isFinite(numericAmount) || numericAmount <= 0}
            >
              {pending && <Loader2 className="size-4 animate-spin" />}
              {numericAmount > 0
                ? t("payments.add.submit", { amount: formatCurrency(numericAmount) })
                : t("uniforms.payment.record")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
