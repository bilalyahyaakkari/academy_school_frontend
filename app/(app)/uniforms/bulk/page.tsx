import { studentsApi } from "@/lib/api/students";
import { uniformsApi } from "@/lib/api/uniforms";
import { PageHeader } from "@/components/app/page-header";
import { BulkOrderClient } from "@/components/uniforms/bulk-order-client";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Bulk uniform order — Academy" };

export default async function BulkUniformOrderPage() {
  const t = await getT();

  const [students, uniforms] = await Promise.all([
    studentsApi.list({}),
    uniformsApi.list(),
  ]);

  // Map studentId → number of existing uniform orders, so the UI can flag
  // students who already have an order.
  const ordersByStudent = new Map<string, number>();
  for (const u of uniforms) {
    ordersByStudent.set(
      u.studentId,
      (ordersByStudent.get(u.studentId) ?? 0) + 1,
    );
  }

  // Distinct sizes already in use — feeds the size dropdown alongside the
  // default S/M/L/XL options.
  const knownSizes = Array.from(
    new Set(uniforms.map((u) => u.size).filter((s): s is string => !!s)),
  ).sort();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("uniforms.bulk.title")}
        description={t("uniforms.bulk.desc")}
        backHref="/uniforms"
        backLabel={t("uniforms.bulk.back")}
      />

      <BulkOrderClient
        students={students.map((s) => ({
          id: s.id,
          fullName: s.fullName,
          isActive: s.isActive,
          existingOrders: ordersByStudent.get(s.id) ?? 0,
        }))}
        knownSizes={knownSizes}
      />
    </div>
  );
}
