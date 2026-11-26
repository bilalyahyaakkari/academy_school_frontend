import { groupsApi } from "@/lib/api/groups";
import { StudentForm } from "@/components/students/student-form";
import { createStudent } from "@/lib/actions/students";
import { PageHeader } from "@/components/app/page-header";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: `${t("students.new.title")} — Academy` };
}

export default async function NewStudentPage() {
  const [groups, t] = await Promise.all([groupsApi.list(), getT()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("students.new.title")}
        description={t("students.new.desc")}
        backHref="/students"
        backLabel={t("students.back")}
      />
      <StudentForm
        groups={groups.map((g) => ({
          id: g.id,
          name: g.name,
          minAge: g.minAge,
          maxAge: g.maxAge,
          monthlyFee: g.monthlyFee,
        }))}
        action={createStudent}
        submitLabel={t("studentForm.submit.create")}
      />
    </div>
  );
}
