import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GuardedLink } from "./unsaved-guard";
import { cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";
import { CalendarX, Check, ChevronRight } from "lucide-react";

export type PickerEntry = {
  key: string;
  groupId: string;
  groupName: string;
  /** "HH:MM" — absent for groups with no session today. */
  start?: string;
  end?: string;
  status?: "now" | "next";
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
}: {
  sessions: PickerEntry[];
  others: PickerEntry[];
  dateLabel: string;
}) {
  const t = await getT();

  const savedLabel = (e: PickerEntry) =>
    e.saved
      ? t("attendance.today.savedCountLabel", { present: e.saved.present, total: e.saved.total })
      : "";

  return (
    <>
      {/* Phones / tablets: chips */}
      <nav aria-label={t("attendance.today.sessionsLabel")} className="space-y-2 lg:hidden">
        {sessions.length === 0 && (
          <p className="text-sm text-muted-foreground">{t("attendance.today.noSessions")}</p>
        )}
        <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6">
          {sessions.map((e) => (
            <li key={e.key} className="shrink-0">
              <Chip
                entry={e}
                savedLabel={savedLabel(e)}
                cancelledLabel={t("attendance.cancelled.badge")}
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
        <nav aria-label={t("attendance.today.sessionsLabel")}>
          {sessions.length > 0 ? (
            <ul className="divide-y divide-border">
              {sessions.map((e) => (
                <li key={e.key}>
                  <Row entry={e} savedLabel={savedLabel(e)} t={t} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              {t("attendance.today.noSessions")}
            </p>
          )}

          {others.length > 0 && (
            <div className="border-t border-border bg-muted/30">
              <div className="px-4 pt-3 pb-1">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("attendance.today.otherGroups")}
                </h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t("attendance.today.otherGroupsHint")}
                </p>
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

function TimeRange({ start, end }: { start: string; end?: string }) {
  // Kept LTR so "16:00–17:30" doesn't come out reversed in Arabic.
  return (
    <bdi dir="ltr" className="tabular-nums">
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
          <span className={cn("truncate", muted ? "font-medium" : "font-semibold")}>
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
              "mt-0.5 block text-xs",
              e.selected ? "text-accent-foreground" : "text-muted-foreground",
            )}
          >
            <TimeRange start={e.start} end={e.end} />
          </span>
        )}
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
  muted,
}: {
  entry: PickerEntry;
  savedLabel: string;
  cancelledLabel: string;
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
          <TimeRange start={e.start} end={e.end} />
        </span>
      )}
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
