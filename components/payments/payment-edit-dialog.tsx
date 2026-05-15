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

type Payment = {
  id: string;
  amount: number;
  paidAmount: number;
  status: "PAID" | "UNPAID" | "PARTIAL";
  paymentMethod: "CASH" | "BANK_TRANSFER" | "OTHER" | null;
  notes: string | null;
};

export function PaymentEditDialog({
  payment,
  onClose,
}: {
  payment: Payment;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState(payment.status);
  const [method, setMethod] = useState(payment.paymentMethod ?? "CASH");

  const onSubmit = (formData: FormData) => {
    formData.set("paymentId", payment.id);
    formData.set("status", status);
    formData.set("paymentMethod", method);
    startTransition(async () => {
      const res = await updatePayment(formData);
      if (res.success) {
        toast.success("Payment updated");
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
          <DialogTitle>Edit payment</DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Payment["status"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="PARTIAL">Partial</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {status === "PARTIAL" && (
            <div className="space-y-2">
              <Label htmlFor="paidAmount">Paid amount (max {payment.amount})</Label>
              <Input
                id="paidAmount"
                name="paidAmount"
                type="number"
                step="0.01"
                min={0}
                max={payment.amount}
                defaultValue={payment.paidAmount}
                required
              />
            </div>
          )}

          {status !== "UNPAID" && (
            <div className="space-y-2">
              <Label>Payment method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
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
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={3} defaultValue={payment.notes ?? ""} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
