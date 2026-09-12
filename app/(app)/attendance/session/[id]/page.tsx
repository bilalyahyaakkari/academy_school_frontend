import { attendanceApi } from "@/lib/api/attendance";
import { PageHeader } from "@/components/app/page-header";
import { ChecklistForm } from "@/components/attendance/checklist-form";
import { formatDateOnly } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Checklist — Academy" };

type Params = Promise<{ id: string }>;

export default async function ChecklistPage({ params }: { params: Params }) {
  const { id } = await params;
  const t = await getT();
  const checklist = await attendanceApi.session(id);

  return (
    <div className="space-y-6">
      <PageHeader
        backHref={`/attendance/${checklist.groupId}?year=${checklist.year}&month=${checklist.month}`}
        backLabel={checklist.group.name}
        title={t("attendance.checklist.title", {
          group: checklist.group.name,
          date: formatDateOnly(checklist.date),
        })}
        description={t("attendance.checklist.desc")}
      />

      <ChecklistForm checklist={checklist} />
    </div>
  );
}
