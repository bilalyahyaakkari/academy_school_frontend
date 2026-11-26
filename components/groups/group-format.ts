import type { ScheduleSlot } from "@/lib/api/types";
import type { TranslationKey } from "@/lib/i18n";

/** A bound translator, as returned by `getT()` / `useT()`. */
export type Translator = (
  key: TranslationKey,
  vars?: Record<string, string | number>,
) => string;

const DAY_ORDER: ScheduleSlot["day"][] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

/** "Ages 8–9", "Ages 8+", "Up to 9 years" — or null when the group has no age range. */
export function ageLabel(t: Translator, min: number | null, max: number | null): string | null {
  if (min != null && max != null) return t("groups.card.ages", { min, max });
  if (min != null) return t("groups.card.agesFrom", { min });
  if (max != null) return t("groups.card.agesUpTo", { max });
  return null;
}

/** "12 players" / "12 / 16 players". */
export function playersLabel(t: Translator, count: number, max: number | null): string {
  if (max != null) return t("groups.card.playersOf", { count, max });
  return count === 1 ? t("groups.card.players.one") : t("groups.card.players", { count });
}

export type ScheduleLine = { days: string; time: string };

/**
 * Compact schedule: sessions that share a time slot are merged into one line
 * ("Monday, Wednesday · 16:00–17:30"). Returns at most `maxLines` lines plus
 * the number of sessions left out.
 */
export function summarizeSchedule(
  t: Translator,
  schedule: ScheduleSlot[],
  locale: string,
  maxLines = 2,
): { lines: ScheduleLine[]; hiddenSessions: number } {
  const sorted = [...schedule].sort(
    (a, b) =>
      DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) ||
      a.startTime.localeCompare(b.startTime),
  );

  const byTime = new Map<string, { days: ScheduleSlot["day"][]; count: number }>();
  for (const s of sorted) {
    const key = `${s.startTime}–${s.endTime}`;
    const entry = byTime.get(key) ?? { days: [], count: 0 };
    if (!entry.days.includes(s.day)) entry.days.push(s.day);
    entry.count += 1;
    byTime.set(key, entry);
  }

  const separator = locale === "ar" ? "، " : ", ";
  const all = [...byTime.entries()];
  const shown = all.slice(0, maxLines);
  const hiddenSessions = all.slice(maxLines).reduce((n, [, e]) => n + e.count, 0);

  return {
    lines: shown.map(([time, e]) => ({
      time,
      days: e.days.map((d) => t(`day.${d}` as TranslationKey)).join(separator),
    })),
    hiddenSessions,
  };
}

/** "+1 more session" / "+3 more sessions". */
export function moreSessionsLabel(t: Translator, count: number): string {
  return count === 1
    ? t("groups.card.moreSessions", { count })
    : t("groups.card.moreSessions.plural", { count });
}

/** Up to two initials for the avatar circle. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}
