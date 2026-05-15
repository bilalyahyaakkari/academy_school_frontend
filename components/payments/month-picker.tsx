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
import { MONTH_NAMES } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/client";

const ARABIC_MONTHS_LEVANTINE = [
  "كانون الثاني",
  "شباط",
  "آذار",
  "نيسان",
  "أيار",
  "حزيران",
  "تموز",
  "آب",
  "أيلول",
  "تشرين الأول",
  "تشرين الثاني",
  "كانون الأول",
];

export function MonthPicker({ year, month }: { year: number; month: number }) {
  const router = useRouter();
  const now = new Date();
  const years = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 3 + i);
  const locale = useLocale();
  const t = useT();
  const monthLabels = locale === "ar" ? ARABIC_MONTHS_LEVANTINE : MONTH_NAMES;

  const go = (y: number, m: number) => {
    router.push(`/payments?year=${y}&month=${m}`);
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
      <Button variant="outline" size="icon" onClick={prev}>
        <ChevronLeft className="size-4 rtl:rotate-180" />
      </Button>
      <Select value={String(month)} onValueChange={(v) => go(year, Number(v))}>
        <SelectTrigger className="w-40">
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
        <SelectTrigger className="w-28">
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
      <Button variant="outline" size="icon" onClick={next}>
        <ChevronRight className="size-4 rtl:rotate-180" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => go(now.getFullYear(), now.getMonth() + 1)}
      >
        {t("payments.monthPicker.thisMonth")}
      </Button>
    </div>
  );
}
