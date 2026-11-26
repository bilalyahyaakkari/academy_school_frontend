"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useT } from "@/lib/i18n/client";

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** "YYYY-MM-DD" shifted by `days` (calendar arithmetic, no timezone involved). */
export function shiftDay(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/**
 * Day stepper for the daily cash report: previous day / date input / next
 * day / Today. Navigates via ?date=YYYY-MM-DD.
 */
export function DayPicker({
  date,
  today,
  basePath = "/payments/daily",
}: {
  date: string;
  /** Today in the academy's timezone (from the server). */
  today: string;
  basePath?: string;
}) {
  const t = useT();
  const router = useRouter();
  const href = (d: string) => (d === today ? basePath : `${basePath}?date=${d}`);
  const prev = shiftDay(date, -1);
  const next = shiftDay(date, 1);
  const atToday = date >= today;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        asChild
        variant="outline"
        size="icon"
        aria-label={t("payments.daily.prev")}
        title={t("payments.daily.prev")}
      >
        <Link href={href(prev)}>
          <ChevronLeft className="size-4 rtl:rotate-180" />
        </Link>
      </Button>
      <Input
        // Remount on navigation so the field always shows the page's date.
        key={date}
        type="date"
        defaultValue={date}
        max={today}
        aria-label={t("payments.daily.date")}
        className="w-auto min-w-0 flex-1 sm:w-40 sm:flex-none"
        onChange={(e) => {
          const v = e.target.value;
          if (ISO_DAY.test(v) && v !== date) router.push(href(v));
        }}
      />
      {atToday ? (
        <Button
          variant="outline"
          size="icon"
          disabled
          aria-label={t("payments.daily.next")}
          title={t("payments.daily.next")}
        >
          <ChevronRight className="size-4 rtl:rotate-180" />
        </Button>
      ) : (
        <Button
          asChild
          variant="outline"
          size="icon"
          aria-label={t("payments.daily.next")}
          title={t("payments.daily.next")}
        >
          <Link href={href(next)}>
            <ChevronRight className="size-4 rtl:rotate-180" />
          </Link>
        </Button>
      )}
      <Button asChild variant="ghost" size="sm" aria-current={date === today ? "date" : undefined}>
        <Link href={basePath}>{t("payments.daily.today")}</Link>
      </Button>
    </div>
  );
}
