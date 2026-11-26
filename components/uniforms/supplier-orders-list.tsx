"use client";

import Link from "next/link";
import { ChevronRight, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SummaryStrip } from "@/components/app/summary-strip";
import { formatDate } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/client";
import type { SupplierOrder } from "@/lib/api/types";
import { SupplierOrderStateChip } from "./supplier-order-parts";

/** /uniforms/orders: a summary, then one row per supplier order (newest first). */
export function SupplierOrdersList({ orders }: { orders: SupplierOrder[] }) {
  const t = useT();
  const locale = useLocale();

  if (orders.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
        <Truck className="size-6 text-muted-foreground" aria-hidden />
        <h2 className="font-medium">{t("uniforms.orders.empty.title")}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{t("uniforms.orders.empty.sub")}</p>
        <Button asChild variant="outline" size="sm" className="mt-2 h-10 sm:h-8">
          <Link href="/uniforms">{t("uniforms.orders.empty.cta")}</Link>
        </Button>
      </Card>
    );
  }

  const sorted = [...orders].sort((a, b) => b.number - a.number);
  const drafts = orders.filter((o) => o.state === "DRAFT").length;
  const waiting = orders.filter((o) => o.state === "ORDERED" || o.state === "PARTIAL").length;
  const missing = orders
    .filter((o) => o.state !== "DRAFT")
    .reduce((sum, o) => sum + o.totals.missing, 0);

  return (
    <>
      <SummaryStrip
        items={[
          {
            label: t("uniforms.orders.summary.waiting"),
            value: waiting,
            sub: t("uniforms.orders.summary.ofOrders", { count: orders.length }),
          },
          {
            label: t("uniforms.orders.summary.missing"),
            value: missing,
            tone: missing > 0 ? "alert" : "default",
            sub: t("uniforms.orders.summary.missing.sub"),
          },
          {
            label: t("uniforms.orders.summary.drafts"),
            value: drafts,
            sub: t("uniforms.orders.summary.drafts.sub"),
          },
        ]}
      />

      <Card className="overflow-hidden">
        <ul className="divide-y divide-border">
          {sorted.map((o) => {
            const sent = o.status === "ORDERED";
            return (
              <li key={o.id}>
                <Link
                  href={`/uniforms/orders/${o.id}`}
                  className="flex items-center gap-3 p-3 transition-colors outline-none hover:bg-muted/40 focus-visible:bg-muted/40 sm:px-5"
                >
                  <div className="min-w-0 flex-1 space-y-1.5 sm:flex sm:items-center sm:gap-4 sm:space-y-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2 sm:w-64 sm:shrink-0">
                      <span className="font-semibold text-sea-900 dark:text-sea-100">
                        {t("uniforms.orders.title.number", { number: o.number })}
                      </span>
                      <SupplierOrderStateChip state={o.state} />
                    </div>
                    <p className="text-xs text-muted-foreground sm:w-40 sm:shrink-0">
                      {o.orderedAt
                        ? t("uniforms.orders.sentOn", { date: formatDate(o.orderedAt, locale) })
                        : t("uniforms.orders.createdOn", { date: formatDate(o.createdAt, locale) })}
                    </p>
                    <p className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm tabular-nums sm:ms-auto sm:justify-end">
                      <span className="font-medium">
                        {t("uniforms.orders.pieces", { count: o.totals.ordered })}
                      </span>
                      {sent && (
                        <span className="text-muted-foreground">
                          {t("uniforms.orders.receivedOf", {
                            received: o.totals.received,
                            ordered: o.totals.ordered,
                          })}
                        </span>
                      )}
                      {sent && o.totals.missing > 0 && (
                        <span className="font-medium text-alert">
                          {t("uniforms.orders.missingCount", { count: o.totals.missing })}
                        </span>
                      )}
                      {sent && o.totals.extra > 0 && (
                        <span className="text-sea-800 dark:text-sea-300">
                          {t("uniforms.orders.extraCount", { count: o.totals.extra })}
                        </span>
                      )}
                    </p>
                  </div>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground rtl:rotate-180"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      </Card>
    </>
  );
}
