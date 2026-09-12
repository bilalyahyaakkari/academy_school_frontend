"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { seedRosterMonth } from "@/lib/actions/roster";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/client";
import { CopyPlus, Loader2 } from "lucide-react";

/**
 * Fills an empty month from the previous one. Months up to next month fill
 * themselves on first visit; this is the manual trigger for the ones that don't
 * (e.g. planning several months ahead).
 */
export function CarryOverButton({
  year,
  month,
  fromLabel,
  label,
}: {
  year: number;
  month: number;
  fromLabel: string;
  label: string;
}) {
  const t = useT();
  const [pending, start] = useTransition();

  const onClick = () => {
    start(async () => {
      const res = await seedRosterMonth(year, month);
      if (res.success === false) {
        toast.error(res.error);
        return;
      }
      const created = res.data?.created ?? 0;
      if (created === 0) {
        toast.info(t("roster.add.empty"));
        return;
      }
      toast.success(t("roster.carried", { count: created, month: fromLabel }));
    });
  };

  return (
    <Button onClick={onClick} disabled={pending}>
      {pending ? <Loader2 className="size-4 animate-spin" /> : <CopyPlus className="size-4" />}
      {label}
    </Button>
  );
}
