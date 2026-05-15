import { groupsApi } from "@/lib/api/groups";
import { StudentForm } from "@/components/students/student-form";
import { createStudent } from "@/lib/actions/students";
import { PageHeader } from "@/components/app/page-header";

export const metadata = { title: "New student — Academy" };

export default async function NewStudentPage() {
  const groups = await groupsApi.list();

  return (
    <div className="space-y-6">
      <PageHeader
        title="New student"
        description="Add a student to the academy."
        backHref="/students"
        backLabel="Back to students"
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
        submitLabel="Create student"
      />
    </div>
  );
}
