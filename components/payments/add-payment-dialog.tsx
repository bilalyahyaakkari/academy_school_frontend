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
import { addPayment } from "@/lib/actions/payments";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type Props = {
  paymentId: string;
  studentName: string;
  total: number;
  alreadyPaid: number;
  onClose: () => void;
};

export function AddPaymentDialog({
  paymentId,
  studentName,
  total,
  alreadyPaid,
  onClose,
}: Props) {
  const remaining = Math.max(0, total - alreadyPaid);
  const [amount, setAmount] = useState<string>(remaining.toFixed(2));
  const [method, setMethod] = useState<"CASH" | "BANK_TRANSFER" | "OTHER">("CASH");
  const [pending, startTransition] = useTransition();

  const numericAmount = Number(amount);
  const willCover =
    Number.isFinite(numericAmount) && numericAmount >= remaining && remaining > 0;

  const onSubmit = (formData: FormData) => {
    formData.set("paymentMethod", method);
    startTransition(async () => {
      const res = await addPayment(paymentId, formData);
      if (res.success === false) {
        toast.error(res.error);
        return;
      }
      toast.success(
        willCover ? "Marked as fully paid" : `Recorded ${formatCurrency(numericAmount)}`,
      );
      onClose();
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record payment</DialogTitle>
          <DialogDescription>{studentName}</DialogDescription>
        </DialogHeader>

        {/* Summary panel */}
        <div className="grid grid-cols-3 gap-2 rounded-lg border border-border bg-muted/30 p-3 text-center text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Total
            </p>
            <p className="mt-0.5 font-semibold">{formatCurrency(total)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Already paid
            </p>
            <p className="mt-0.5 font-semibold text-success">
              {formatCurrency(alreadyPaid)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Remaining
            </p>
            <p className="mt-0.5 font-semibold text-destructive">
              {formatCurrency(remaining)}
            </p>
          </div>
        </div>

        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Payment amount *</Label>
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
                Pay full ({formatCurrency(remaining)})
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAmount((remaining / 2).toFixed(2))}
                disabled={remaining <= 0}
              >
                Half
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Payment method</Label>
            <Select
              value={method}
              onValueChange={(v) => setMethod(v as typeof method)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank transfer</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending || numericAmount <= 0}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Record {numericAmount > 0 ? formatCurrency(numericAmount) : ""}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
