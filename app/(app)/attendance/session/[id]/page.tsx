import { notFound } from "next/navigation";
import { attendanceApi } from "@/lib/api/attendance";
import { ApiError } from "@/lib/api/client";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { AttendanceSheet } from "@/components/attendance/attendance-sheet";
import { CancelSessionButton, CancelledBanner } from "@/components/attendance/cancel-session";
import { TrialsToday } from "@/components/attendance/trials-today";
import { RescheduleSessionButton } from "@/components/attendance/reschedule-session";
import { SessionPanelHeader } from "@/components/attendance/session-header";
import { isoDay } from "@/components/attendance/session-dates";
import { formatDateOnly, todayIso } from "@/lib/utils";
import { getT, getLocale } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: `${t("attendance.title")} — Academy` };
}

type Params = Promise<{ id: string }>;

/** Edit a past checklist with the same Present / Absent register as Today. */
export default async function ChecklistPage({ params }: { params: Params }) {
  const { id } = await params;
  const t = await getT();
  const locale = await getLocale();
  let checklist: Awaited<ReturnType<typeof attendanceApi.session>>;
  try {
    checklist = await attendanceApi.session(id);
  } catch (err) {
    // Deleted checklist, or a malformed id → 404 page instead of a crash.
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) notFound();
    throw err;
  }
  // The session's identity is its original day; it's shown on the day it
  // actually happens, with "(moved from …)" when it was rescheduled.
  const originalDay = isoDay(checklist.originalDate ?? checklist.date);
  const actualDay = isoDay(checklist.actualDate ?? checklist.date);
  const date = formatDateOnly(actualDay, locale);
  const actual = {
    date: actualDay,
    startTime: checklist.startTime,
    endTime: checklist.endTime,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        showTitle
        backHref={`/attendance/${checklist.groupId}?year=${checklist.year}&month=${checklist.month}`}
        backLabel={checklist.group.name}
        title={t("attendance.checklist.title", { group: checklist.group.name, date })}
        description={t("attendance.sheet.desc")}
      />

      <Card>
        <SessionPanelHeader
          groupName={checklist.group.name}
          coachName={checklist.group.coachName}
          actual={actual}
          movedFrom={
            checklist.rescheduled
              ? {
                  date: checklist.originalDate,
                  startTime: checklist.originalStart,
                  endTime: checklist.originalEnd,
                }
              : null
          }
          showDate
          noSlotLabel={t("attendance.today.noSlotDay")}
          actions={
            !checklist.cancelled ? (
              <>
                <RescheduleSessionButton
                  groupId={checklist.groupId}
                  groupName={checklist.group.name}
                  originalDate={originalDay}
                  current={actual}
                />
                <CancelSessionButton
                  groupId={checklist.groupId}
                  groupName={checklist.group.name}
                  date={originalDay}
                  displayDate={actualDay}
                />
              </>
            ) : null
          }
        />
        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
          {checklist.cancelled ? (
            <CancelledBanner
              groupId={checklist.groupId}
              groupName={checklist.group.name}
              date={originalDay}
              displayDate={actualDay}
              reason={checklist.cancelReason}
              isToday={actualDay === todayIso()}
              trialsCount={checklist.trials?.length ?? 0}
            />
          ) : (
            <>
              <AttendanceSheet key={checklist.id} checklist={checklist} mode="session" />
              <TrialsToday trials={checklist.trials ?? []} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
