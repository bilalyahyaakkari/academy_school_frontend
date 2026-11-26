import { translate, type Locale, type TranslationKey } from "@/lib/i18n";
import { formatDateOnly, todayIso } from "@/lib/utils";

/**
 * Small date/time helpers for sessions. Every date here is a date-only value
 * ("YYYY-MM-DD" or an ISO string at UTC midnight), so nothing is shifted by the
 * viewer's timezone.
 */

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** "2026-11-26T00:00:00.000Z" → "2026-11-26". */
export function isoDay(value: string): string {
  return value.slice(0, 10);
}

/** True for a real calendar day written as YYYY-MM-DD. */
export function isIsoDay(value: string | undefined | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/** Shifts a YYYY-MM-DD day by `n` days. */
export function addDays(day: string, n: number): string {
  const [y, m, d] = isoDay(day).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** The weekday name of a date-only value ("Thursday"). */
export function weekdayOf(value: string): Weekday {
  const [y, m, d] = isoDay(value).split("-").map(Number);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export function weekdayKey(value: string): TranslationKey {
  return `day.${weekdayOf(value)}` as TranslationKey;
}

/** "26 Nov" / "26 تشرين الثاني" — the year only when it isn't this year. */
export function shortDate(value: string, locale: Locale): string {
  const full = formatDateOnly(value, locale);
  const year = isoDay(value).slice(0, 4);
  return year === todayIso().slice(0, 4) ? full.replace(new RegExp(`\\s*${year}$`), "") : full;
}

/** "Thursday 26 Nov" / "الخميس 26 تشرين الثاني". */
export function dayLabel(value: string, locale: Locale): string {
  return `${translate(locale, weekdayKey(value))} ${shortDate(value, locale)}`;
}

/** "16:00–17:30", "16:00", or "" with no times. */
export function timeRange(start?: string | null, end?: string | null): string {
  if (!start) return "";
  return end ? `${start}–${end}` : start;
}

/**
 * The Arabic WhatsApp notice for a moved session. Times are wrapped in
 * left-to-right isolates so "16:00–17:30" keeps its order inside Arabic text.
 */
export function rescheduleShareText(opts: {
  groupName: string;
  from: { date: string; startTime: string | null; endTime: string | null };
  to: { date: string; startTime: string | null; endTime: string | null };
}): string {
  const when = (w: typeof opts.from) => {
    const time = timeRange(w.startTime, w.endTime);
    return `${dayLabel(w.date, "ar")}${time ? ` ⁦${time}⁩` : ""}`;
  };
  return translate("ar", "attendance.reschedule.share.text", {
    group: opts.groupName.trim(),
    from: when(opts.from),
    to: when(opts.to),
  });
}
