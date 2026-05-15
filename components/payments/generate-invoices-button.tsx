"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { generateMonthlyInvoices } from "@/lib/actions/payments";
import { toast } from "sonner";
import { Loader2, FileText } from "lucide-react";
import { useT } from "@/lib/i18n/client";

export function GenerateInvoicesButton({
  year,
  month,
  pendingCount,
}: {
  year: number;
  month: number;
  pendingCount: number;
}) {
  const [pending, startTransition] = useTransition();
  const t = useT();

  if (pendingCount === 0) return null;

  const onClick = () => {
    startTransition(async () => {
      const res = await generateMonthlyInvoices(year, month);
      if (res.success) {
        const created = res.data?.created ?? 0;
        toast.success(
          created === 1
            ? t("payments.action.generate", { count: created })
            : t("payments.action.generate.plural", { count: created }),
        );
      } else {
        toast.error(res.error);
      }
    });
  };

  const label =
    pendingCount === 1
      ? t("payments.action.generate", { count: pendingCount })
      : t("payments.action.generate.plural", { count: pendingCount });

  return (
    <Button onClick={onClick} disabled={pending}>
      {pending ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <FileText className="size-4" />
      )}
      {label}
    </Button>
  );
}
