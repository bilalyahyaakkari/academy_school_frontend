import { GroupForm } from "@/components/groups/group-form";
import { createGroup } from "@/lib/actions/groups";
import { PageHeader } from "@/components/app/page-header";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: `${t("groups.new.title")} — Academy` };
}

export default async function NewGroupPage() {
  const t = await getT();
  return (
    <div className="space-y-6">
      <PageHeader
        title={t("groups.new.title")}
        description={t("groups.new.desc")}
        backHref="/groups"
        backLabel={t("groups.back")}
      />
      <GroupForm action={createGroup} submitLabel={t("groups.form.create")} />
    </div>
  );
}
