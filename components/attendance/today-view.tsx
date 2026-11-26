import Link from "next/link";
import { groupsApi } from "@/lib/api/groups";
import { attendanceApi } from "@/lib/api/attendance";
import type { AgendaEntry } from "@/lib/api/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SessionPicker, type PickerEntry } from "./session-picker";
import { AttendanceSheet, type SheetChecklist } from "./attendance-sheet";
import { CancelSessionButton, CancelledBanner } from "./cancel-session";
import { PostponedBanner, RescheduleSessionButton } from "./reschedule-session";
import { SessionPanelHeader } from "./session-header";
import { TrialsToday } from "./trials-today";
import { GuardedLink } from "./unsaved-guard";
import { addDays, dayLabel, isoDay, shortDate } from "./session-dates";
import { ACADEMY_TZ, todayIso, weekdayShort } from "@/lib/utils";
import { getLocale, getT } from "@/lib/i18n/server";
import { CalendarCheck, ChevronLeft, ChevronRight, CircleAlert } from "lucide-react";

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
function hm(value: string | null | undefined): string {
  if (!value) return "";
  const [h = "0", m = "0"] = value.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
}

type Entry = AgendaEntry & { start: string; end: string };

/** /attendance?tab=today[&date=][&group=&at=|&session=] — `date` only when not today. */
export function todayHref(
  date: string,
  p: { group?: string; at?: string; session?: string } = {},
): string {
  const q = new URLSearchParams({ tab: "today" });
  if (isoDay(date) !== todayIso()) q.set("date", isoDay(date));
  if (p.session) q.set("session", p.session);
  if (p.group) q.set("group", p.group);
  if (p.at) q.set("at", p.at);
  return `/attendance?${q.toString()}`;
}

/**
 * The "Today" tab: the day's sessions (from the agenda — regular slots, moved
 * and postponed ones) on the start side, the selected session's register on
 * the other. Everything comes from the URL (?date=&group=&at=&session=), so
 * it's server-rendered and survives a refresh.
 */
export async function TodayView({
  date,
  groupParam,
  atParam,
  sessionParam,
}: {
  /** YYYY-MM-DD (validated by the page). */
  date: string;
  groupParam?: string;
  atParam?: string;
  sessionParam?: string;
}) {
  const t = await getT();
  const locale = await getLocale();
  const today = todayIso();
  const isToday = date === today;
  const now = academyNowHm();

  const [groups, agenda] = await Promise.all([groupsApi.list(), attendanceApi.agenda(date)]);

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

  // ---- The day's sessions, already in time order (a group with two slots
  // shows twice; both open the same checklist) ----
  const entries: Entry[] = agenda.entries.map((e) => ({
    ...e,
    start: hm(e.startTime),
    end: hm(e.endTime),
  }));
  const onAgenda = new Set(entries.map((e) => e.groupId));
  const others = groups
    .filter((g) => !onAgenda.has(g.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Postponed / cancelled entries are never "now" or "next".
  const live = (e: Entry) => e.kind !== "postponed" && !e.cancelled;
  const nowIdx = isToday ? entries.findIndex((e) => live(e) && e.start <= now && now < e.end) : -1;
  const nextIdx = isToday ? entries.findIndex((e) => live(e) && e.start > now) : -1;

  // ---- Selection: ?session (a moved-in session), ?group (+ ?at for a group
  // with two slots), else the current or next session, else the first one,
  // else the first other group ----
  const pickSlot = (list: Entry[]) =>
    (isToday ? list.find((e) => e.kind !== "postponed" && e.end > now) : undefined) ??
    list.find((e) => e.kind !== "postponed") ??
    list[0];

  let selected: Entry | undefined;
  let selectedGroupId: string | undefined;
  if (sessionParam) {
    selected = entries.find((e) => e.kind === "moved-in" && e.sessionId === sessionParam);
  }
  if (!selected && groupParam) {
    const own = entries.filter((e) => e.groupId === groupParam && e.kind !== "moved-in");
    const at = atParam ? hm(atParam) : null;
    selected =
      own.find((e) => e.start === at) ??
      pickSlot(own) ??
      entries.find((e) => e.groupId === groupParam && e.kind === "moved-in");
    if (!selected && groups.some((g) => g.id === groupParam)) selectedGroupId = groupParam;
  }
  if (!selected && !selectedGroupId) selected = pickSlot(entries);
  if (selected) selectedGroupId = selected.groupId;
  selectedGroupId ??= others[0]?.id;
  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  // ---- Checklists: the selected one, plus the other groups' (to show a
  // checklist someone took on an unscheduled day) ----
  const loadDay = (groupId: string) =>
    attendanceApi.day(groupId, date).catch(() => null) as Promise<SheetChecklist | null>;
  const selectedIsOther = !selected && others.some((g) => g.id === selectedGroupId);
  const [loaded, otherDays] = await Promise.all([
    selected?.kind === "moved-in" && selected.sessionId
      ? (attendanceApi.session(selected.sessionId).catch(() => null) as Promise<SheetChecklist | null>)
      : selectedGroupId && !selectedIsOther
        ? loadDay(selectedGroupId)
        : Promise.resolve(null),
    Promise.all(others.map(async (g) => [g.id, await loadDay(g.id)] as const)),
  ]);
  const otherDay = new Map(otherDays);
  const checklist =
    loaded ?? (selectedIsOther && selectedGroupId ? (otherDay.get(selectedGroupId) ?? null) : null);

  const movedLabel = (d: string) => `${weekdayShort(d, locale)} ${shortDate(d, locale)}`;

  const sessionEntries: PickerEntry[] = entries.map((e, i) => ({
    key: `${e.kind}:${e.kind === "moved-in" ? e.sessionId : e.groupId}@${e.start}`,
    groupId: e.groupId,
    groupName: e.groupName,
    start: e.start || undefined,
    end: e.end || undefined,
    kind: e.kind,
    retimed: e.retimed,
    movedTo: e.movedTo
      ? { day: movedLabel(e.movedTo.date), time: hm(e.movedTo.startTime) || undefined }
      : undefined,
    movedFrom: e.kind === "moved-in" && e.originalDate ? movedLabel(e.originalDate) : undefined,
    status: i === nowIdx ? "now" : i === nextIdx ? "next" : undefined,
    saved:
      e.saved && !e.cancelled && e.kind !== "postponed"
        ? { present: e.presentCount, total: e.totalCount }
        : null,
    cancelled: e.cancelled,
    href:
      e.kind === "moved-in" && e.sessionId
        ? todayHref(date, { session: e.sessionId })
        : todayHref(date, { group: e.groupId, at: e.start || undefined }),
    selected: e === selected,
  }));
  const otherEntries: PickerEntry[] = others.map((g) => {
    const d = otherDay.get(g.id);
    return {
      key: g.id,
      groupId: g.id,
      groupName: g.name,
      saved:
        d && !d.isNew && !d.cancelled
          ? { present: d.presentCount, total: d.students.length }
          : null,
      cancelled: d?.cancelled ?? false,
      href: todayHref(date, { group: g.id }),
      selected: !selected && g.id === selectedGroupId,
    };
  });

  const dateText = dayLabel(date, locale);

  // ---- The panel ----
  const groupName = checklist?.group.name ?? selected?.groupName ?? selectedGroup?.name ?? "";
  const coachName =
    checklist?.group.coachName ?? selected?.coachName ?? selectedGroup?.coachName ?? null;
  const originalDate = checklist ? isoDay(checklist.originalDate ?? checklist.date) : date;
  // Moved away from this day: a calm banner instead of a register. A session
  // opened by id (moved-in) is always shown as a register.
  const movedAway =
    selected?.kind === "postponed" ||
    (!!checklist &&
      selected?.kind !== "moved-in" &&
      checklist.postponed &&
      isoDay(checklist.actualDate) !== date);
  const movedTo =
    selected?.movedTo ??
    (checklist && movedAway
      ? { date: checklist.actualDate, startTime: checklist.startTime, endTime: checklist.endTime }
      : null);
  // Where / when it happens. A moved session shows its new day and times; a
  // group with two slots today shows the slot that was picked.
  const actualDay = checklist ? isoDay(checklist.actualDate ?? checklist.date) : date;
  const slotTimes =
    selected && selected.kind === "regular" && !selected.retimed
      ? { startTime: selected.startTime, endTime: selected.endTime }
      : null;
  const actual = {
    date: actualDay,
    startTime:
      (checklist?.rescheduled ? checklist.startTime : slotTimes?.startTime) ??
      checklist?.startTime ??
      selected?.startTime ??
      null,
    endTime:
      (checklist?.rescheduled ? checklist.endTime : slotTimes?.endTime) ??
      checklist?.endTime ??
      selected?.endTime ??
      null,
  };
  const movedFrom =
    checklist?.rescheduled && !movedAway
      ? {
          date: checklist.originalDate,
          startTime: checklist.originalStart,
          endTime: checklist.originalEnd,
        }
      : null;

  const afterMoveHref = selectedGroupId
    ? selected?.kind === "moved-in" && selected.sessionId
      ? todayHref(date, { group: selectedGroupId })
      : todayHref(date, { group: selectedGroupId, at: selected?.start || undefined })
    : undefined;

  const prev = addDays(date, -1);
  const next = addDays(date, 1);

  return (
    <div className="space-y-4">
      {/* Day switcher: open the day a session was moved to, or catch up on yesterday. */}
      <nav
        aria-label={t("attendance.day.nav")}
        className="flex flex-wrap items-center gap-2"
      >
        <Button asChild variant="outline" size="icon">
          <GuardedLink href={todayHref(prev)} aria-label={t("attendance.day.prev")} title={t("attendance.day.prev")}>
            <ChevronLeft aria-hidden className="rtl:rotate-180" />
          </GuardedLink>
        </Button>
        <p className="min-w-0 px-1 text-sm font-semibold" aria-live="polite">
          {dateText}
        </p>
        <Button asChild variant="outline" size="icon">
          <GuardedLink href={todayHref(next)} aria-label={t("attendance.day.next")} title={t("attendance.day.next")}>
            <ChevronRight aria-hidden className="rtl:rotate-180" />
          </GuardedLink>
        </Button>
        {!isToday && (
          <Button asChild variant="ghost" size="sm">
            <GuardedLink href={todayHref(today)}>
              <CalendarCheck />
              {t("attendance.day.today")}
            </GuardedLink>
          </Button>
        )}
      </nav>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start lg:gap-6 xl:grid-cols-[19rem_minmax(0,1fr)]">
        <SessionPicker
          sessions={sessionEntries}
          others={otherEntries}
          dateLabel={dateText}
          isToday={isToday}
          dateShort={shortDate(date, locale)}
        />

        <Card>
          {selectedGroupId && (
            <SessionPanelHeader
              groupName={groupName}
              coachName={coachName}
              actual={
                movedAway
                  ? {
                      date,
                      startTime: checklist?.originalStart ?? selected?.startTime ?? null,
                      endTime: checklist?.originalEnd ?? selected?.endTime ?? null,
                    }
                  : actual
              }
              movedFrom={movedFrom}
              noSlotLabel={isToday ? t("attendance.today.noSlot") : t("attendance.today.noSlotDay")}
              actions={
                checklist && !checklist.cancelled ? (
                  <>
                    {/* First, so it stays mounted (and its success step open)
                        when the panel re-renders after the move. */}
                    <RescheduleSessionButton
                      groupId={checklist.groupId}
                      groupName={groupName}
                      originalDate={originalDate}
                      current={actual}
                      afterMoveHref={afterMoveHref}
                    />
                    {!movedAway && (
                      <CancelSessionButton
                        groupId={checklist.groupId}
                        groupName={groupName}
                        date={originalDate}
                        displayDate={actualDay}
                      />
                    )}
                  </>
                ) : null
              }
            />
          )}
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            {checklist && movedAway && movedTo ? (
              <PostponedBanner
                groupId={checklist.groupId}
                originalDate={originalDate}
                movedTo={movedTo}
                // ?session finds the moved-in entry there; ?group is the fallback.
                openHref={todayHref(movedTo.date, {
                  session: checklist.id ?? selected?.sessionId ?? undefined,
                  group: checklist.groupId,
                })}
              />
            ) : checklist?.cancelled ? (
              <CancelledBanner
                groupId={checklist.groupId}
                groupName={groupName}
                date={originalDate}
                displayDate={actualDay}
                reason={checklist.cancelReason}
                isToday={actualDay === today}
                trialsCount={checklist.trials?.length ?? 0}
              />
            ) : checklist ? (
              <>
                <AttendanceSheet
                  key={`${checklist.groupId}:${originalDate}`}
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
    </div>
  );
}
