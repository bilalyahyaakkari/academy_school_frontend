import type { ReactNode } from "react";
import { CardHeader } from "@/components/ui/card";
import { getLocale, getT } from "@/lib/i18n/server";
import { dayLabel, isoDay, timeRange } from "./session-dates";

type When = { date: string; startTime: string | null; endTime: string | null };

/**
 * The session panel's header (Today panel and the checklist page): group, the
 * day and time it ACTUALLY happens, the coach, and "(moved from …)" when it was
 * rescheduled. Actions (reschedule / cancel) sit on the end side.
 */
export async function SessionPanelHeader({
  groupName,
  coachName,
  actual,
  movedFrom,
  showDate,
  noSlotLabel,
  actions,
}: {
  groupName: string;
  coachName: string | null;
  /** When it happens (null times = not on the schedule this day). */
  actual: When;
  /** The original day / times, when the session was moved. */
  movedFrom?: When | null;
  /** Show the date next to the time (the Today panel already names the day). */
  showDate?: boolean;
  noSlotLabel: string;
  actions?: ReactNode;
}) {
  const t = await getT();
  const locale = await getLocale();
  const time = timeRange(actual.startTime, actual.endTime);
  const movedDay = movedFrom && isoDay(movedFrom.date) !== isoDay(actual.date);
  const movedTime = movedFrom ? timeRange(movedFrom.startTime, movedFrom.endTime) : "";

  return (
    <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 p-4 pb-3 sm:p-6 sm:pb-4">
      <div className="min-w-0 space-y-1">
        <h2 className="text-xl font-bold tracking-tight">
          {t("attendance.today.panelTitle", { group: groupName })}
        </h2>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>
            {t("attendance.today.session")}:{" "}
            <span className="font-medium text-foreground">{groupName}</span>
          </span>
          {(showDate || movedDay) && (
            <>
              <span aria-hidden className="h-4 w-px bg-border" />
              <span>
                {t("attendance.new.date")}:{" "}
                <span className="font-medium text-foreground">
                  {dayLabel(actual.date, locale)}
                </span>
              </span>
            </>
          )}
          <span aria-hidden className="h-4 w-px bg-border" />
          <span>
            {t("attendance.today.time")}:{" "}
            {time ? (
              <bdi dir="ltr" className="font-medium tabular-nums text-foreground">
                {time}
              </bdi>
            ) : (
              <span className="font-medium text-foreground">{noSlotLabel}</span>
            )}
          </span>
          {coachName && (
            <>
              <span aria-hidden className="h-4 w-px bg-border" />
              <span>{coachName}</span>
            </>
          )}
        </p>
        {movedFrom && (movedDay || movedTime !== time) && (
          <p className="text-xs text-muted-foreground">
            {(() => {
              const [before, after = ""] = t("attendance.session.movedFrom", {
                when: "\u0000",
              }).split("\u0000");
              return (
                <>
                  {before}
                  {movedDay && dayLabel(movedFrom.date, locale)}
                  {movedDay && movedTime && " · "}
                  {movedTime && (
                    <bdi dir="ltr" className="tabular-nums">
                      {movedTime}
                    </bdi>
                  )}
                  {after}
                </>
              );
            })()}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </CardHeader>
  );
}
