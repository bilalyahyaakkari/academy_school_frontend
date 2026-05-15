"use client";

import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";

type TimelinePayment = {
  id: string;
  month: number;
  year: number;
  amount: number;
  paidAmount: number;
  status: "PAID" | "UNPAID" | "PARTIAL";
  paymentMethod: "CASH" | "BANK_TRANSFER" | "OTHER" | null;
  paymentDate: string | null;
  notes: string | null;
  label: string;
};

const STATUS_VARIANT: Record<TimelinePayment["status"], "success" | "secondary" | "warning"> = {
  PAID: "success",
  UNPAID: "secondary",
  PARTIAL: "warning",
};

const STATUS_ICON = {
  PAID: CheckCircle2,
  UNPAID: Circle,
  PARTIAL: AlertCircle,
};

export function PaymentTimeline({ payments }: { payments: TimelinePayment[] }) {
  return (
    <ol className="relative space-y-4 border-l border-border pl-6">
      {payments.map((p) => {
        const Icon = STATUS_ICON[p.status];
        const remaining = p.amount - p.paidAmount;
        return (
          <li key={p.id} className="relative">
            <span className="absolute -left-[33px] top-1 flex size-6 items-center justify-center rounded-full bg-background">
              <Icon
                className={
                  p.status === "PAID"
                    ? "size-5 text-success"
                    : p.status === "PARTIAL"
                      ? "size-5 text-warning"
                      : "size-5 text-muted-foreground"
                }
              />
            </span>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <p className="font-medium">{p.label}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(p.amount)}
                  {p.status === "PARTIAL" &&
                    ` • paid ${formatCurrency(p.paidAmount)} • ${formatCurrency(remaining)} due`}
                  {p.paymentDate && ` • ${new Date(p.paymentDate).toLocaleDateString()}`}
                  {p.paymentMethod && ` • ${p.paymentMethod.toLowerCase().replace("_", " ")}`}
                </p>
                {p.notes && <p className="mt-1 text-xs italic text-muted-foreground">{p.notes}</p>}
              </div>
              <Badge variant={STATUS_VARIANT[p.status]}>{p.status}</Badge>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
