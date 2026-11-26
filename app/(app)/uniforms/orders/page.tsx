import { supplierOrdersApi } from "@/lib/api/supplier-orders";
import { PageHeader } from "@/components/app/page-header";
import { SupplierOrdersList } from "@/components/uniforms/supplier-orders-list";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: `${t("uniforms.orders.title")} — Academy` };
}

export default async function SupplierOrdersPage() {
  const [orders, t] = await Promise.all([supplierOrdersApi.list(), getT()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("uniforms.orders.title")}
        backHref="/uniforms"
        backLabel={t("uniforms.orders.back")}
      />
      <SupplierOrdersList orders={orders} />
    </div>
  );
}
