"use client";

import { Badge } from "@/components/ui/badge";
import { cn, formatDateOnly, toInternationalPhone } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/client";
import type { TranslationKey } from "@/lib/i18n";
import type { TrialStatus } from "@/lib/api/types";
import { MessageCircle } from "lucide-react";

export const STATUS_LABEL: Record<TrialStatus, TranslationKey> = {
  SCHEDULED: "trials.status.SCHEDULED",
  ATTENDED: "trials.status.ATTENDED",
  NO_SHOW: "trials.status.NO_SHOW",
  DECLINED: "trials.status.DECLINED",
  JOINED: "trials.status.JOINED",
};

/** Red only for "didn't come"; the good states in sea blue. */
const STATUS_CLASS: Record<TrialStatus, string> = {
  SCHEDULED: "border-border bg-card text-muted-foreground",
  ATTENDED: "border-transparent bg-sea-700/10 text-sea-700",
  NO_SHOW: "border-transparent bg-alert/10 text-alert",
  DECLINED: "border-transparent bg-muted text-muted-foreground",
  JOINED: "border-transparent bg-success text-success-foreground",
};

export function TrialStatusChip({
  status,
  className,
}: {
  status: TrialStatus;
  className?: string;
}) {
  const t = useT();
  return (
    <Badge
      variant="outline"
      className={cn("shrink-0 rounded-full px-2.5", STATUS_CLASS[status], className)}
    >
      {t(STATUS_LABEL[status])}
    </Badge>
  );
}

/** "YYYY-MM-DD" shifted by `days` (pure date arithmetic, no timezone). */
export function shiftIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** "Today" / "Tomorrow" / "Yesterday", otherwise the date. */
export function TrialDate({ date, today }: { date: string; today: string }) {
  const t = useT();
  const locale = useLocale();
  const day = date.slice(0, 10);
  const relative =
    day === today
      ? t("trials.date.today")
      : day === shiftIso(today, 1)
        ? t("trials.date.tomorrow")
        : day === shiftIso(today, -1)
          ? t("trials.date.yesterday")
          : null;
  return (
    <span className="whitespace-nowrap">
      {relative ? (
        <>
          <span className="font-medium">{relative}</span>
          <span className="ms-1.5 text-xs text-muted-foreground">
            {formatDateOnly(day, locale)}
          </span>
        </>
      ) : (
        formatDateOnly(day, locale)
      )}
    </span>
  );
}

/** Parent phone, LTR, opening a WhatsApp chat when the number is usable. */
export function TrialPhone({
  phone,
  countryCode,
}: {
  phone: string | null;
  countryCode: string | null;
}) {
  const t = useT();
  if (!phone) return <span className="text-muted-foreground">—</span>;
  const intl = countryCode ? toInternationalPhone(phone, countryCode) : null;
  if (!intl) return <span dir="ltr">{phone}</span>;
  return (
    <a
      href={`https://wa.me/${intl}`}
      target="_blank"
      rel="noopener noreferrer"
      title={t("trials.action.whatsapp", { phone })}
      className="inline-flex items-center gap-1.5 whitespace-nowrap text-foreground hover:text-sea-700 hover:underline"
    >
      <MessageCircle aria-hidden className="size-3.5 shrink-0 text-sea-700" />
      <span dir="ltr">{phone}</span>
    </a>
  );
}
