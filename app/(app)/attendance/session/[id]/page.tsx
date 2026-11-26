import { notFound } from "next/navigation";
import { attendanceApi } from "@/lib/api/attendance";
import { ApiError } from "@/lib/api/client";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AttendanceSheet } from "@/components/attendance/attendance-sheet";
import { CancelSessionButton, CancelledBanner } from "@/components/attendance/cancel-session";
import { TrialsToday } from "@/components/attendance/trials-today";
import { formatDateOnly, todayIso, weekdayShort } from "@/lib/utils";
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
  const date = formatDateOnly(checklist.date, locale);
  const day = checklist.date.slice(0, 10);

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
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 space-y-0 p-4 pb-3 sm:p-6 sm:pb-4">
          <div className="min-w-0 space-y-1">
            <h2 className="text-xl font-bold tracking-tight">
              {t("attendance.today.panelTitle", { group: checklist.group.name })}
            </h2>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
              <span>
                {t("attendance.today.session")}:{" "}
                <span className="font-medium text-foreground">{checklist.group.name}</span>
              </span>
              <span aria-hidden className="h-4 w-px bg-border" />
              <span>
                {t("attendance.new.date")}:{" "}
                <span className="font-medium text-foreground">
                  {weekdayShort(checklist.date, locale)} · {date}
                </span>
              </span>
              {checklist.group.coachName && (
                <>
                  <span aria-hidden className="h-4 w-px bg-border" />
                  <span>{checklist.group.coachName}</span>
                </>
              )}
            </p>
          </div>
          {!checklist.cancelled && (
            <CancelSessionButton
              groupId={checklist.groupId}
              groupName={checklist.group.name}
              date={day}
            />
          )}
        </CardHeader>
        <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
          {checklist.cancelled ? (
            <CancelledBanner
              groupId={checklist.groupId}
              groupName={checklist.group.name}
              date={day}
              reason={checklist.cancelReason}
              isToday={day === todayIso()}
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
