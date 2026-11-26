"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ARABIC_MONTH_NAMES, MONTH_NAMES, currentYearMonth } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/client";

/**
 * Month/year stepper. Shared by every month-scoped screen — pass `basePath` to
 * point it at that screen's route.
 */
export function MonthPicker({
  year,
  month,
  basePath = "/payments",
}: {
  year: number;
  month: number;
  basePath?: string;
}) {
  const router = useRouter();
  const now = currentYearMonth();
  // now-3 … now+2, plus the selected year when it's outside that window
  // (e.g. ?year=2019) — otherwise the Select would show a blank value.
  const years = Array.from({ length: 6 }, (_, i) => now.year - 3 + i);
  if (!years.includes(year)) {
    years.push(year);
    years.sort((a, b) => a - b);
  }
  const locale = useLocale();
  const t = useT();
  const monthLabels = locale === "ar" ? ARABIC_MONTH_NAMES : MONTH_NAMES;

  const go = (y: number, m: number) => {
    router.push(`${basePath}?year=${y}&month=${m}`);
  };

  const prev = () => {
    const m = month === 1 ? 12 : month - 1;
    const y = month === 1 ? year - 1 : year;
    go(y, m);
  };
  const next = () => {
    const m = month === 12 ? 1 : month + 1;
    const y = month === 12 ? year + 1 : year;
    go(y, m);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={prev}
        aria-label={t("payments.monthPicker.prev")}
        title={t("payments.monthPicker.prev")}
      >
        <ChevronLeft className="size-4 rtl:rotate-180" />
      </Button>
      <Select value={String(month)} onValueChange={(v) => go(year, Number(v))}>
        <SelectTrigger className="w-40" aria-label={t("payments.monthPicker.month")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {monthLabels.map((m, i) => (
            <SelectItem key={i} value={String(i + 1)}>
              {m}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={String(year)} onValueChange={(v) => go(Number(v), month)}>
        <SelectTrigger className="w-28" aria-label={t("payments.monthPicker.year")}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {years.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button
        variant="outline"
        size="icon"
        onClick={next}
        aria-label={t("payments.monthPicker.next")}
        title={t("payments.monthPicker.next")}
      >
        <ChevronRight className="size-4 rtl:rotate-180" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => go(now.year, now.month)}>
        {t("payments.monthPicker.thisMonth")}
      </Button>
    </div>
  );
}
