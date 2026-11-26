import { studentsApi } from "@/lib/api/students";
import { PageHeader } from "@/components/app/page-header";
import { FamiliesClient } from "@/components/students/families-client";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: `${t("students.families.title")} — Academy` };
}

/** Link brothers and sisters in bulk: suggestions, families, drag & drop. */
export default async function FamiliesPage() {
  const t = await getT();
  const overview = await studentsApi.families();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("students.families.title")}
        backHref="/students"
        backLabel={t("students.back")}
      />
      <FamiliesClient overview={overview} />
    </div>
  );
}
