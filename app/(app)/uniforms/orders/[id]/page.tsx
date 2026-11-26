import { notFound } from "next/navigation";
import { supplierOrdersApi } from "@/lib/api/supplier-orders";
import { ApiError } from "@/lib/api/client";
import { PageHeader } from "@/components/app/page-header";
import { SupplierOrderDetail } from "@/components/uniforms/supplier-order-detail";
import { getT } from "@/lib/i18n/server";

type Params = Promise<{ id: string }>;

async function loadOrder(id: string) {
  try {
    return await supplierOrdersApi.get(id);
  } catch (err) {
    // 404, or an id that isn't a UUID at all (400).
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) notFound();
    throw err;
  }
}

export async function generateMetadata({ params }: { params: Params }) {
  const { id } = await params;
  const t = await getT();
  try {
    const order = await supplierOrdersApi.get(id);
    return { title: `${t("uniforms.orders.title.number", { number: order.number })} — Academy` };
  } catch {
    return { title: `${t("uniforms.orders.title")} — Academy` };
  }
}

export default async function SupplierOrderPage({ params }: { params: Params }) {
  const { id } = await params;
  const [order, t] = await Promise.all([loadOrder(id), getT()]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("uniforms.orders.title.number", { number: order.number })}
        backHref="/uniforms/orders"
        backLabel={t("uniforms.orders.backToList")}
      />
      <SupplierOrderDetail order={order} />
    </div>
  );
}
