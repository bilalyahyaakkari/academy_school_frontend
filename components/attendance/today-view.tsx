import Link from "next/link";
import { groupsApi } from "@/lib/api/groups";
import { attendanceApi } from "@/lib/api/attendance";
import type { GroupWithCount, ScheduleSlot } from "@/lib/api/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SessionPicker, type PickerEntry } from "./session-picker";
import { AttendanceSheet, type SheetChecklist } from "./attendance-sheet";
import { CancelSessionButton, CancelledBanner } from "./cancel-session";
import { TrialsToday } from "./trials-today";
import { ACADEMY_TZ, academyToday, todayIso } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";
import { CalendarCheck, CircleAlert } from "lucide-react";

const WEEKDAYS: ScheduleSlot["day"][] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/** Today's weekday name in the academy's timezone ("Monday"…). */
export function academyWeekday(): ScheduleSlot["day"] {
  const { year, month, day } = academyToday();
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

/** The wall-clock time in Beirut as "HH:MM". */
function academyNowHm(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: ACADEMY_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("hour")}:${get("minute")}`;
}

/** "9:5" → "09:05", so times compare as plain strings. */
function hm(value: string): string {
  const [h = "0", m = "0"] = value.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

type Session = { group: GroupWithCount; start: string; end: string };

function todayHref(groupId: string, at?: string) {
  const base = `/attendance?tab=today&group=${encodeURIComponent(groupId)}`;
  return at ? `${base}&at=${encodeURIComponent(at)}` : base;
}

/**
 * The "Today" tab: today's sessions on the start side, the selected group's
 * register on the other. Everything comes from the URL (?group=&at=), so it's
 * server-rendered and survives a refresh.
 */
export async function TodayView({
  groupParam,
  atParam,
  dateLabel,
}: {
  groupParam?: string;
  atParam?: string;
  dateLabel: string;
}) {
  const t = await getT();
  const today = todayIso();
  const { year, month } = academyToday();
  const weekday = academyWeekday();
  const now = academyNowHm();

  const [groups, overview] = await Promise.all([
    groupsApi.list(),
    attendanceApi.overview(year, month),
  ]);

  if (groups.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <div className="rounded-full bg-sea-100 p-4 text-sea-900">
          <CalendarCheck className="size-8" />
        </div>
        <p className="text-sm text-muted-foreground">{t("attendance.empty.groups")}</p>
        <Button asChild variant="outline">
          <Link href="/groups">{t("nav.groups")}</Link>
        </Button>
      </Card>
    );
  }

  // ---- Today's sessions, by start time (a group with two slots shows twice) ----
  const sessions: Session[] = groups
    .flatMap((group) =>
      (group.schedule ?? [])
        .filter((s) => s.day === weekday)
        .map((s) => ({ group, start: hm(s.startTime), end: hm(s.endTime) })),
    )
    .sort(
      (a, b) =>
        a.start.localeCompare(b.start) ||
        a.end.localeCompare(b.end) ||
        a.group.name.localeCompare(b.group.name),
    );
  const scheduledIds = new Set(sessions.map((s) => s.group.id));
  const others = groups
    .filter((g) => !scheduledIds.has(g.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  const nowIdx = sessions.findIndex((s) => s.start <= now && now < s.end);
  const nextIdx = sessions.findIndex((s) => s.start > now);

  // ---- Selection: ?group (and ?at for a group with two slots), else the
  // current or next session, else the first one, else the first other group ----
  const pickSlot = (list: Session[]) =>
    list.find((s) => s.end > now) ?? list[0];

  const requested = groups.find((g) => g.id === groupParam);
  let selectedGroup: GroupWithCount;
  let selectedSession: Session | undefined;
  if (requested) {
    const own = sessions.filter((s) => s.group.id === requested.id);
    const at = atParam ? hm(atParam) : null;
    selectedGroup = requested;
    selectedSession = own.find((s) => s.start === at) ?? pickSlot(own);
  } else {
    selectedSession = pickSlot(sessions);
    selectedGroup = selectedSession?.group ?? others[0];
  }

  // ---- Which checklists are already saved today ----
  // The overview knows each group's last saved checklist this month; today's
  // groups and the selected one are read directly so the list can show "12/15".
  const savedToday = overview.groups
    .filter((g) => g.lastSessionDate?.slice(0, 10) === today)
    .map((g) => g.groupId);
  const toLoad = new Set([...savedToday, ...scheduledIds, selectedGroup.id]);
  const days = new Map<string, SheetChecklist | null>(
    await Promise.all(
      [...toLoad].map(
        async (id) =>
          [id, await attendanceApi.day(id, today).catch(() => null)] as const,
      ),
    ),
  );
  const savedFor = (id: string) => {
    const d = days.get(id);
    return d && !d.isNew && !d.cancelled
      ? { present: d.presentCount, total: d.students.length }
      : null;
  };
  const cancelledFor = (id: string) => days.get(id)?.cancelled ?? false;

  const sessionEntries: PickerEntry[] = sessions.map((s, i) => ({
    key: `${s.group.id}@${s.start}`,
    groupId: s.group.id,
    groupName: s.group.name,
    start: s.start,
    end: s.end,
    status: i === nowIdx ? "now" : i === nextIdx ? "next" : undefined,
    saved: savedFor(s.group.id),
    cancelled: cancelledFor(s.group.id),
    href: todayHref(s.group.id, s.start),
    selected: s === selectedSession,
  }));
  const otherEntries: PickerEntry[] = others.map((g) => ({
    key: g.id,
    groupId: g.id,
    groupName: g.name,
    saved: savedFor(g.id),
    cancelled: cancelledFor(g.id),
    href: todayHref(g.id),
    selected: g.id === selectedGroup.id,
  }));

  const checklist = days.get(selectedGroup.id) ?? null;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-6 xl:grid-cols-[19rem_minmax(0,1fr)]">
      <SessionPicker sessions={sessionEntries} others={otherEntries} dateLabel={dateLabel} />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 p-4 pb-3 sm:p-6 sm:pb-4">
          <div className="min-w-0 space-y-1">
            <h2 className="text-xl font-bold tracking-tight">
              {t("attendance.today.panelTitle", { group: selectedGroup.name })}
            </h2>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>
                {t("attendance.today.session")}:{" "}
                <span className="font-medium text-foreground">{selectedGroup.name}</span>
              </span>
              <span aria-hidden className="h-4 w-px bg-border" />
              <span>
                {t("attendance.today.time")}:{" "}
                {selectedSession ? (
                  <bdi dir="ltr" className="font-medium tabular-nums text-foreground">
                    {selectedSession.start}–{selectedSession.end}
                  </bdi>
                ) : (
                  <span className="font-medium text-foreground">
                    {t("attendance.today.noSlot")}
                  </span>
                )}
              </span>
              {selectedGroup.coachName && (
                <>
                  <span aria-hidden className="h-4 w-px bg-border" />
                  <span>{selectedGroup.coachName}</span>
                </>
              )}
            </p>
          </div>
          {checklist && !checklist.cancelled && (
            <CancelSessionButton
              groupId={selectedGroup.id}
              groupName={selectedGroup.name}
              date={today}
            />
          )}
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
          {checklist?.cancelled ? (
            <CancelledBanner
              groupId={selectedGroup.id}
              groupName={selectedGroup.name}
              date={today}
              reason={checklist.cancelReason}
              isToday
              trialsCount={checklist.trials?.length ?? 0}
            />
          ) : checklist ? (
            <>
              <AttendanceSheet
                key={`${selectedGroup.id}:${today}`}
                checklist={checklist}
                mode="day"
              />
              <TrialsToday trials={checklist.trials ?? []} />
            </>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-alert/30 bg-alert/5 p-4 text-sm">
              <CircleAlert aria-hidden className="size-5 shrink-0 text-alert" />
              {t("attendance.today.groupMissing")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
