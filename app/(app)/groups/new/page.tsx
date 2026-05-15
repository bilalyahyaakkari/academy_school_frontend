import { GroupForm } from "@/components/groups/group-form";
import { createGroup } from "@/lib/actions/groups";
import { PageHeader } from "@/components/app/page-header";

export const metadata = { title: "New group — Academy" };

export default function NewGroupPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="New group" description="Define a training time slot." />
      <GroupForm action={createGroup} submitLabel="Create group" />
    </div>
  );
}
