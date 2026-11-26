"use client";

import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/client";
import { monthLabelI18n, type TranslationKey } from "@/lib/i18n";
import { CheckCircle2, Circle, AlertCircle } from "lucide-react";

type TimelinePayment = {
  id: string;
  month: number;
  year: number;
  amount: number;
  /** Sibling discount already taken off `amount` (0 / omitted = none). */
  discount?: number;
  paidAmount: number;
  status: "PAID" | "UNPAID" | "PARTIAL";
  paymentMethod: "CASH" | "BANK_TRANSFER" | "OTHER" | null;
  paymentDate: string | null;
  notes: string | null;
  /**
   * Ignored — the period is labelled from `month`/`year` in the viewer's
   * locale. Kept optional so existing callers still typecheck.
   */
  label?: string;
};

const STATUS_VARIANT: Record<TimelinePayment["status"], "success" | "alert" | "warning"> = {
  PAID: "success",
  UNPAID: "alert",
  PARTIAL: "warning",
};

const STATUS_LABEL: Record<TimelinePayment["status"], TranslationKey> = {
  PAID: "common.paid",
  UNPAID: "common.unpaid",
  PARTIAL: "common.partial",
};

const STATUS_ICON = {
  PAID: CheckCircle2,
  UNPAID: Circle,
  PARTIAL: AlertCircle,
};

export function PaymentTimeline({ payments }: { payments: TimelinePayment[] }) {
  const t = useT();
  const locale = useLocale();

  return (
    <ol className="relative space-y-4 border-s border-border ps-6">
      {payments.map((p) => {
        const Icon = STATUS_ICON[p.status];
        const remaining = Math.max(0, p.amount - p.paidAmount);
        const details = [formatCurrency(p.amount)];
        if (p.status === "PARTIAL") {
          details.push(
            t("payments.timeline.partial", {
              paid: formatCurrency(p.paidAmount),
              due: formatCurrency(remaining),
            }),
          );
        }
        if (p.paymentDate) details.push(formatDate(p.paymentDate, locale));
        if (p.paymentMethod) details.push(t(`payments.method.${p.paymentMethod}`));
        return (
          <li key={p.id} className="relative">
            <span className="absolute -start-[33px] top-1 flex size-6 items-center justify-center rounded-full bg-background">
              <Icon
                className={
                  p.status === "PAID"
                    ? "size-5 text-success"
                    : p.status === "PARTIAL"
                      ? "size-5 text-sea-500"
                      : "size-5 text-alert"
                }
              />
            </span>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <div>
                <p className="font-medium">{monthLabelI18n(locale, p.month, p.year)}</p>
                <p className="text-xs text-muted-foreground">{details.join(" • ")}</p>
                {(p.discount ?? 0) > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    {t("payments.discount.note", { amount: formatCurrency(p.discount ?? 0) })}
                  </p>
                )}
                {p.notes && <p className="mt-1 text-xs italic text-muted-foreground">{p.notes}</p>}
              </div>
              <Badge variant={STATUS_VARIANT[p.status]}>{t(STATUS_LABEL[p.status])}</Badge>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
