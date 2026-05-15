import { notFound } from "next/navigation";
import { groupsApi } from "@/lib/api/groups";
import { ApiError } from "@/lib/api/client";
import { GroupForm } from "@/components/groups/group-form";
import { updateGroup } from "@/lib/actions/groups";
import { PageHeader } from "@/components/app/page-header";

type Params = Promise<{ id: string }>;

export default async function EditGroupPage({ params }: { params: Params }) {
  const { id } = await params;

  let group;
  try {
    group = await groupsApi.get(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const action = updateGroup.bind(null, id);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Edit ${group.name}`}
        backHref={`/groups/${id}`}
        backLabel={`Back to ${group.name}`}
      />
      <GroupForm
        action={action}
        defaults={{
          name: group.name,
          minAge: group.minAge,
          maxAge: group.maxAge,
          schedule: group.schedule,
          monthlyFee: group.monthlyFee,
          maxCapacity: group.maxCapacity,
          coachName: group.coachName,
        }}
        submitLabel="Save changes"
      />
    </div>
  );
}
