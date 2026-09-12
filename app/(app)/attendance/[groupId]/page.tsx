import { attendanceApi } from "@/lib/api/attendance";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { MonthPicker } from "@/components/payments/month-picker";
import { AttendanceGrid } from "@/components/attendance/attendance-grid";
import { NewChecklistButton } from "@/components/attendance/new-checklist-button";
import { getT, getLocale } from "@/lib/i18n/server";
import { monthLabelI18n } from "@/lib/i18n";
import { ClipboardList } from "lucide-react";

export const metadata = { title: "Group attendance — Academy" };

type Params = Promise<{ groupId: string }>;
type SearchParams = Promise<{ year?: string; month?: string }>;

export default async function GroupAttendancePage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { groupId } = await params;
  const sp = await searchParams;
  const now = new Date();
  const year = sp.year ? Number(sp.year) : now.getFullYear();
  const month = sp.month ? Number(sp.month) : now.getMonth() + 1;

  const t = await getT();
  const locale = await getLocale();
  const grid = await attendanceApi.monthGrid(groupId, year, month);
  const monthName = monthLabelI18n(locale, month, year);

  return (
    <div className="space-y-6">
      <PageHeader
        backHref={`/attendance?year=${year}&month=${month}`}
        backLabel={t("attendance.title")}
        title={grid.group.name}
        description={
          grid.sessionCount > 0
            ? t("attendance.grid.sub", { sessions: grid.sessionCount })
            : t("attendance.empty.month", { month: monthName })
        }
        actions={
          <NewChecklistButton groupId={groupId} label={t("attendance.action.new")} />
        }
      />

      <MonthPicker
        year={year}
        month={month}
        basePath={`/attendance/${groupId}`}
      />

      {grid.sessionCount === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <ClipboardList className="size-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold">
            {t("attendance.empty.month", { month: monthName })}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("attendance.empty.month.sub")}
          </p>
          <div className="mt-2">
            <NewChecklistButton groupId={groupId} label={t("attendance.action.today")} />
          </div>
        </Card>
      ) : (
        <AttendanceGrid grid={grid} />
      )}
    </div>
  );
}
