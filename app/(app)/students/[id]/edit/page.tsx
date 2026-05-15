import { notFound } from "next/navigation";
import { studentsApi } from "@/lib/api/students";
import { groupsApi } from "@/lib/api/groups";
import { ApiError } from "@/lib/api/client";
import { StudentForm } from "@/components/students/student-form";
import { updateStudent } from "@/lib/actions/students";
import { PageHeader } from "@/components/app/page-header";
import { birthYear } from "@/lib/utils";

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
  const groups = await groupsApi.list();

  const action = updateStudent.bind(null, id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${student.fullName}`}
        backHref={`/students/${id}`}
        backLabel={`Back to ${student.fullName}`}
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
          phoneNumber: student.phoneNumber ?? undefined,
          groupId: student.groupId,
          isActive: student.isActive,
          monthlyFee: student.monthlyFee,
          notes: student.notes ?? undefined,
        }}
        action={action}
        submitLabel="Save changes"
      />
    </div>
  );
}
