import Link from "next/link";
import { notFound } from "next/navigation";
import { attendanceApi } from "@/lib/api/attendance";
import { ApiError } from "@/lib/api/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { MonthPicker } from "@/components/payments/month-picker";
import { AttendanceGrid } from "@/components/attendance/attendance-grid";
import { NewChecklistButton } from "@/components/attendance/new-checklist-button";
import { resolveYearMonth } from "@/lib/utils";
import { getT, getLocale } from "@/lib/i18n/server";
import { monthLabelI18n } from "@/lib/i18n";
import { ClipboardCheck, ClipboardList } from "lucide-react";

export async function generateMetadata() {
  const t = await getT();
  return { title: `${t("attendance.title")} — Academy` };
}

type Params = Promise<{ groupId: string }>;
type SearchParams = Promise<{ year?: string | string[]; month?: string | string[] }>;

export default async function GroupAttendancePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { groupId } = await params;
  const { year, month } = resolveYearMonth(await searchParams);

  const t = await getT();
  const locale = await getLocale();
  let grid: Awaited<ReturnType<typeof attendanceApi.monthGrid>>;
  try {
    grid = await attendanceApi.monthGrid(groupId, year, month);
  } catch (err) {
    // Unknown group, or a malformed id → 404 page instead of a crash.
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) notFound();
    throw err;
  }
  const monthName = monthLabelI18n(locale, month, year);
  const todayHref = `/attendance?tab=today&group=${encodeURIComponent(groupId)}`;

  const takeToday = (
    <Button asChild>
      <Link href={todayHref}>
        <ClipboardCheck />
        {t("attendance.action.today")}
      </Link>
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        showTitle
        backHref={`/attendance?tab=history&year=${year}&month=${month}`}
        backLabel={t("attendance.title")}
        title={grid.group.name}
        description={
          grid.sessionCount > 0
            ? t("attendance.grid.sub", { sessions: grid.sessionCount })
            : t("attendance.empty.month", { month: monthName })
        }
        actions={
          <>
            {/* Another day (e.g. a missed one); today goes to the Today tab. */}
            <NewChecklistButton
              groupId={groupId}
              variant="outline"
              label={t("attendance.action.new")}
            />
            {takeToday}
          </>
        }
      />

      <MonthPicker year={year} month={month} basePath={`/attendance/${groupId}`} />

      {grid.sessionCount === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <div className="rounded-full bg-sea-100 p-4 text-sea-900">
            <ClipboardList className="size-8" />
          </div>
          <h3 className="font-semibold">{t("attendance.empty.month", { month: monthName })}</h3>
          <p className="text-sm text-muted-foreground">{t("attendance.empty.month.sub")}</p>
          <div className="mt-2">{takeToday}</div>
        </Card>
      ) : (
        <AttendanceGrid grid={grid} />
      )}
    </div>
  );
}
