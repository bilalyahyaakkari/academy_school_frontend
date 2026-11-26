import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GuardedLink } from "./unsaved-guard";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";
import { ArrowRight, CalendarClock, CalendarX, Check, ChevronRight, Clock } from "lucide-react";

export type PickerEntry = {
  key: string;
  groupId: string;
  groupName: string;
  /** "HH:MM" — absent for groups with no session today. */
  start?: string;
  end?: string;
  status?: "now" | "next";
  /** From the day's agenda: a weekly slot, moved away, or moved onto this day. */
  kind?: "regular" | "postponed" | "moved-in";
  /** A weekly slot whose times changed this day. */
  retimed?: boolean;
  /** postponed: where it went ("Sat 28 Nov", "18:00"). */
  movedTo?: { day: string; time?: string };
  /** moved-in: the day it came from ("Thu 26 Nov"). */
  movedFrom?: string;
  /** Today's checklist is already saved. */
  saved?: { present: number; total: number } | null;
  /** Today's session was cancelled (rain, holiday…). */
  cancelled?: boolean;
  href: string;
  selected: boolean;
};

/**
 * "Select session": today's sessions by start time, then the groups with no
 * session today (attendance can still be taken for them).
 *
 * Phones get a horizontal chip row right above the checklist, so picking a
 * session never pushes the register off screen; large screens get the list
 * panel from the mockup.
 */
export async function SessionPicker({
  sessions,
  others,
  dateLabel,
  isToday = true,
  dateShort,
}: {
  sessions: PickerEntry[];
  others: PickerEntry[];
  dateLabel: string;
  /** False when another day is open (?date=). */
  isToday?: boolean;
  /** "28 Nov" — names the day in labels when it isn't today. */
  dateShort?: string;
}) {
  const t = await getT();
  const navLabel =
    isToday || !dateShort
      ? t("attendance.today.sessionsLabel")
      : t("attendance.today.sessionsLabelDay", { date: dateShort });
  const noSessions = isToday ? t("attendance.today.noSessions") : t("attendance.today.noSessionsDay");
  const othersHint = isToday
    ? t("attendance.today.otherGroupsHint")
    : t("attendance.today.otherGroupsHintDay");

  const savedLabel = (e: PickerEntry) =>
    e.saved
      ? t("attendance.today.savedCountLabel", { present: e.saved.present, total: e.saved.total })
      : "";

  return (
    <>
      {/* Phones / tablets: chips */}
      <nav aria-label={navLabel} className="space-y-2 lg:hidden">
        {sessions.length === 0 && <p className="text-sm text-muted-foreground">{noSessions}</p>}
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6">
          {sessions.map((e) => (
            <li key={e.key} className="shrink-0">
              <Chip
                entry={e}
                savedLabel={savedLabel(e)}
                cancelledLabel={t("attendance.cancelled.badge")}
                t={t}
              />
            </li>
          ))}
          {others.length > 0 && (
            <li className="flex shrink-0 items-center gap-2 ps-1 text-xs font-medium text-muted-foreground">
              {sessions.length > 0 && <span aria-hidden className="h-6 w-px bg-border" />}
              {t("attendance.today.otherGroups")}
            </li>
          )}
          {others.map((e) => (
            <li key={e.key} className="shrink-0">
              <Chip
                entry={e}
                savedLabel={savedLabel(e)}
                cancelledLabel={t("attendance.cancelled.badge")}
                t={t}
                muted
              />
            </li>
          ))}
        </ul>
      </nav>

      {/* Large screens: the list panel */}
      <Card className="hidden overflow-hidden lg:sticky lg:top-24 lg:block">
        <div className="border-b border-border px-4 py-3.5">
          <h2 className="font-semibold">{t("attendance.today.selectSession")}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{dateLabel}</p>
        </div>
        <nav aria-label={navLabel}>
          {sessions.length > 0 ? (
            <ul className="divide-y divide-border">
              {sessions.map((e) => (
                <li key={e.key}>
                  <Row entry={e} savedLabel={savedLabel(e)} t={t} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-6 text-sm text-muted-foreground">{noSessions}</p>
          )}

          {others.length > 0 && (
            <div className="border-t border-border bg-muted/30">
              <div className="px-4 pt-3 pb-1">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("attendance.today.otherGroups")}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{othersHint}</p>
              </div>
              <ul className="divide-y divide-border/60">
                {others.map((e) => (
                  <li key={e.key}>
                    <Row entry={e} savedLabel={savedLabel(e)} t={t} muted />
                  </li>
                ))}
              </ul>
            </div>
          )}
        </nav>
      </Card>
    </>
  );
}

function TimeRange({ start, end, struck }: { start: string; end?: string; struck?: boolean }) {
  // Kept LTR so "16:00–17:30" doesn't come out reversed in Arabic.
  return (
    <bdi dir="ltr" className={cn("tabular-nums", struck && "line-through decoration-sea-300")}>
      {start}
      {end ? `–${end}` : ""}
    </bdi>
  );
}

function SavedMark({
  saved,
  label,
  onPrimary,
}: {
  saved: NonNullable<PickerEntry["saved"]>;
  label: string;
  onPrimary?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium tabular-nums" title={label}>
      <span
        aria-hidden
        className={cn(
          "grid size-4 place-items-center rounded-full",
          onPrimary ? "bg-primary-foreground text-primary" : "bg-success text-success-foreground",
        )}
      >
        <Check className="size-3" strokeWidth={3} />
      </span>
      <span aria-hidden>
        {saved.present}/{saved.total}
      </span>
      <span className="sr-only">{label}</span>
    </span>
  );
}

function Row({
  entry: e,
  savedLabel,
  t,
  muted,
}: {
  entry: PickerEntry;
  savedLabel: string;
  t: Awaited<ReturnType<typeof getT>>;
  muted?: boolean;
}) {
  return (
    <GuardedLink
      href={e.href}
      aria-current={e.selected ? "page" : undefined}
      className={cn(
        "relative flex min-h-14 items-center gap-3 px-4 py-2.5 text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        e.selected
          ? "bg-accent text-accent-foreground"
          : muted
            ? "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
            : "hover:bg-muted/50",
      )}
    >
      {/* Selection bar on the start edge */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-2 start-0 w-1 rounded-e-full",
          e.selected ? "bg-primary" : "bg-transparent",
        )}
      />
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span
            className={cn(
              "truncate",
              muted ? "font-medium" : "font-semibold",
              e.kind === "postponed" && !e.selected && "text-muted-foreground",
            )}
          >
            {e.groupName}
          </span>
          {e.status === "now" && <Badge variant="success">{t("attendance.today.now")}</Badge>}
          {e.status === "next" && <Badge variant="outline">{t("attendance.today.next")}</Badge>}
          {e.cancelled && (
            <Badge variant="soft" className="gap-1">
              <CalendarX aria-hidden className="size-3" />
              {t("attendance.cancelled.badge")}
            </Badge>
          )}
        </span>
        {e.start && (
          <span
            className={cn(
              "mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs",
              e.selected ? "text-accent-foreground" : "text-muted-foreground",
            )}
          >
            <TimeRange start={e.start} end={e.end} struck={e.kind === "postponed"} />
            {e.retimed && e.kind === "regular" && (
              <span className="inline-flex items-center gap-1 font-medium text-sea-800 dark:text-sea-300">
                <Clock aria-hidden className="size-3" />
                {t("attendance.agenda.retimed")}
              </span>
            )}
          </span>
        )}
        <Movement entry={e} t={t} />
      </span>
      {e.saved && <SavedMark saved={e.saved} label={savedLabel} />}
      <ChevronRight
        aria-hidden
        className={cn(
          "size-4 shrink-0 rtl:rotate-180",
          e.selected ? "text-accent-foreground" : "text-muted-foreground",
        )}
      />
    </GuardedLink>
  );
}

function Chip({
  entry: e,
  savedLabel,
  cancelledLabel,
  t,
  muted,
}: {
  entry: PickerEntry;
  savedLabel: string;
  cancelledLabel: string;
  t: Awaited<ReturnType<typeof getT>>;
  muted?: boolean;
}) {
  return (
    <GuardedLink
      href={e.href}
      aria-current={e.selected ? "page" : undefined}
      className={cn(
        "inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        e.selected
          ? "border-primary bg-primary text-primary-foreground"
          : muted
            ? "border-dashed border-input bg-transparent text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            : "border-border bg-card hover:bg-accent hover:text-accent-foreground",
      )}
    >
      <span className="font-semibold">{e.groupName}</span>
      {e.start && (
        <span className={cn("text-xs", e.selected ? "opacity-90" : "text-muted-foreground")}>
          <TimeRange start={e.start} end={e.end} struck={e.kind === "postponed"} />
          {e.retimed && e.kind === "regular" && (
            <Clock aria-label={t("attendance.agenda.retimed")} className="ms-1 inline size-3 align-[-2px]" />
          )}
        </span>
      )}
      <Movement entry={e} t={t} compact />
      {e.saved && <SavedMark saved={e.saved} label={savedLabel} onPrimary={e.selected} />}
      {e.cancelled && (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium",
            e.selected ? "opacity-90" : "text-muted-foreground",
          )}
        >
          <CalendarX aria-hidden className="size-3.5" />
          {cancelledLabel}
        </span>
      )}
    </GuardedLink>
  );
}

/**
 * Where a moved session went ("→ Sat 28 Nov 18:00") or came from ("Moved from
 * Thu 26 Nov"). Nothing for a regular slot.
 */
function Movement({
  entry: e,
  t,
  compact,
}: {
  entry: PickerEntry;
  t: Awaited<ReturnType<typeof getT>>;
  compact?: boolean;
}) {
  const tone = e.selected && compact ? "opacity-90" : e.selected ? "text-accent-foreground" : "text-sea-800 dark:text-sea-300";
  if (e.kind === "postponed" && e.movedTo) {
    const when = `${e.movedTo.day}${e.movedTo.time ? ` ${e.movedTo.time}` : ""}`;
    return (
      <span
        className={cn(
          "items-center gap-1 text-xs font-medium",
          compact ? "inline-flex" : "mt-0.5 flex",
          tone,
        )}
      >
        <ArrowRight aria-hidden className="size-3 shrink-0 rtl:rotate-180" />
        <span aria-hidden>
          {e.movedTo.day}
          {e.movedTo.time && (
            <>
              {" "}
              <bdi dir="ltr" className="tabular-nums">
                {e.movedTo.time}
              </bdi>
            </>
          )}
        </span>
        <span className="sr-only">{t("attendance.agenda.movedTo", { when })}</span>
      </span>
    );
  }
  if (e.kind === "moved-in" && e.movedFrom) {
    return (
      <span
        className={cn(
          "items-center gap-1 text-xs font-medium",
          compact ? "inline-flex" : "mt-0.5 flex",
          tone,
        )}
      >
        <CalendarClock aria-hidden className="size-3 shrink-0" />
        {t("attendance.agenda.movedFrom", { date: e.movedFrom })}
      </span>
    );
  }
  return null;
}
