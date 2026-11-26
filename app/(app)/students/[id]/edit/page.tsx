import { notFound } from "next/navigation";
import { studentsApi } from "@/lib/api/students";
import { groupsApi } from "@/lib/api/groups";
import { ApiError } from "@/lib/api/client";
import { StudentForm } from "@/components/students/student-form";
import { updateStudent } from "@/lib/actions/students";
import { PageHeader } from "@/components/app/page-header";
import { birthYear } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

type Params = Promise<{ id: string }>;

export default async function EditStudentPage({ params }: { params: Params }) {
  const { id } = await params;

  let student;
  try {
    student = await studentsApi.get(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
  const [groups, t] = await Promise.all([groupsApi.list(), getT()]);

  const action = updateStudent.bind(null, id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("students.edit.title", { name: student.fullName })}
        backHref={`/students/${id}`}
        backLabel={t("students.backToName", { name: student.fullName })}
      />
      <StudentForm
        groups={groups.map((g) => ({
          id: g.id,
          name: g.name,
          minAge: g.minAge,
          maxAge: g.maxAge,
          monthlyFee: g.monthlyFee,
        }))}
        defaults={{
          id: student.id,
          fullName: student.fullName,
          birthYear: birthYear(student.dateOfBirth),
          dateOfBirth: student.dateOfBirth,
          phoneNumber: student.phoneNumber ?? undefined,
          address: student.address ?? undefined,
          school: student.school ?? undefined,
          groupId: student.groupId,
          monthlyFee: student.monthlyFee,
          notes: student.notes ?? undefined,
          trainingStartDate: student.trainingStartDate?.slice(0, 10),
        }}
        action={action}
        submitLabel={t("studentForm.submit.save")}
      />
    </div>
  );
}
