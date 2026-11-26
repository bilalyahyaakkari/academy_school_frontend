import { notFound } from "next/navigation";
import { groupsApi } from "@/lib/api/groups";
import { ApiError } from "@/lib/api/client";
import { GroupForm } from "@/components/groups/group-form";
import { updateGroup } from "@/lib/actions/groups";
import { PageHeader } from "@/components/app/page-header";
import { getT } from "@/lib/i18n/server";

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
  const t = await getT();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("groups.edit.title", { name: group.name })}
        backHref={`/groups/${id}`}
        backLabel={t("groups.backToName", { name: group.name })}
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
        submitLabel={t("groups.form.save")}
      />
    </div>
  );
}
