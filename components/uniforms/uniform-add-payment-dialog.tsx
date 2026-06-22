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
import { addUniformPayment } from "@/lib/actions/uniforms";
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
  const remaining = Math.max(0, total - alreadyPaid);
  const [amount, setAmount] = useState<string>(remaining.toFixed(2));
  const [pending, startTransition] = useTransition();

  const numericAmount = Number(amount);
  const willCover =
    Number.isFinite(numericAmount) && numericAmount >= remaining && remaining > 0;

  const onSubmit = (formData: FormData) => {
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
      onClose();
    });
  };

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

        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">{t("uniforms.payment.amount")} *</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min={0.01}
              max={remaining || total}
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
