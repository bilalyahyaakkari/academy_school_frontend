import { uniformsApi } from "@/lib/api/uniforms";
import { studentsApi } from "@/lib/api/students";
import { PageHeader } from "@/components/app/page-header";
import { UniformsClient } from "@/components/uniforms/uniforms-client";
import { UniformsHeaderActions } from "@/components/uniforms/uniforms-header-actions";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: `${t("uniforms.title")} — Academy` };
}

export default async function UniformsPage() {
  const t = await getT();
  // Current students for "New order". Orders of students who left are still
  // listed; the edit dialog adds that order's own student to its options.
  const [uniforms, students] = await Promise.all([
    uniformsApi.list(),
    studentsApi.list({}),
  ]);

  const studentOptions = students.map((s) => ({ id: s.id, fullName: s.fullName }));
  const knownSizes = Array.from(
    new Set(uniforms.map((u) => u.size).filter((s): s is string => !!s)),
  ).sort();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("uniforms.title")}
        description={t("uniforms.header.desc")}
      />

      <UniformsClient
        uniforms={uniforms}
        students={studentOptions}
        knownSizes={knownSizes}
        headerActions={
          <UniformsHeaderActions students={studentOptions} knownSizes={knownSizes} />
        }
      />
    </div>
  );
}
