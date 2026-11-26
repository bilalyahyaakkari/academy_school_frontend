"use client";

import type { ReactNode } from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ChevronDown,
  Loader2,
  Lock,
  PackageCheck,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SummaryStrip, type SummaryItem } from "@/components/app/summary-strip";
import { cn, formatDate, formatDateOnly } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/client";
import type { SupplierOrder } from "@/lib/api/types";
import {
  deleteSupplierOrder,
  deleteSupplierReceipt,
  markSupplierOrderDraft,
  markSupplierOrderSent,
} from "@/lib/actions/supplier-orders";
import { compareSizes } from "./uniforms-filters";
import { SizeChip } from "./uniform-row-parts";
import { SupplierOrderStateChip, SupplierShareText } from "./supplier-order-parts";
import { SupplierReceiveDialog } from "./supplier-receive-dialog";
import {
  hasDifferences,
  supplierDifferencesText,
  supplierOrderText,
} from "./supplier-order-text";

type Confirm =
  | { kind: "send" }
  | { kind: "draft" }
  | { kind: "delete" }
  | { kind: "receipt"; receiptId: string; index: number; date: string };

function Section({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("min-w-0 p-4 sm:p-5", className)}>
      <h2 className="text-sm font-semibold text-sea-900 dark:text-sea-100">{title}</h2>
      {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      <div className="mt-3">{children}</div>
    </Card>
  );
}

const th = "px-2 py-2 text-xs font-medium text-muted-foreground first:ps-0 last:pe-0";
const td = "px-2 py-2 tabular-nums first:ps-0 last:pe-0";

/** /uniforms/orders/[id]: one supplier order, its deliveries and differences. */
export function SupplierOrderDetail({ order }: { order: SupplierOrder }) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [pending, startTransition] = useTransition();

  const isDraft = order.status === "DRAFT";
  const sent = order.status === "ORDERED";
  const hasReceipts = order.receipts.length > 0;
  const lines = [...order.lines].sort((a, b) => compareSizes(a.size, b.size));
  const reconciliation = [...order.reconciliation].sort((a, b) => compareSizes(a.size, b.size));
  const totalOrdered = lines.reduce((s, l) => s + l.quantity, 0);
  const showDiffs = sent && hasReceipts && hasDifferences(order);
  const receivedPct =
    order.totals.ordered > 0
      ? Math.min(100, Math.round((Math.min(order.totals.received, order.totals.ordered) / order.totals.ordered) * 100))
      : 0;

  const ask = (c: Confirm) => {
    setConfirm(c);
    setConfirmOpen(true);
  };

  const run = () => {
    if (!confirm) return;
    startTransition(async () => {
      switch (confirm.kind) {
        case "send": {
          const res = await markSupplierOrderSent(order.id);
          if (res.success === false) return void toast.error(res.error);
          toast.success(t("uniforms.orders.toast.sent", { number: order.number }));
          break;
        }
        case "draft": {
          const res = await markSupplierOrderDraft(order.id);
          if (res.success === false) return void toast.error(res.error);
          toast.success(t("uniforms.orders.toast.draft"));
          break;
        }
        case "delete": {
          const res = await deleteSupplierOrder(order.id);
          if (res.success === false) return void toast.error(res.error);
          toast.success(t("uniforms.orders.toast.deleted", { number: order.number }));
          setConfirmOpen(false);
          router.push("/uniforms/orders");
          return;
        }
        case "receipt": {
          const res = await deleteSupplierReceipt(order.id, confirm.receiptId);
          if (res.success === false) return void toast.error(res.error);
          toast.success(t("uniforms.receipts.toast.deleted"));
          break;
        }
      }
      setConfirmOpen(false);
    });
  };

  const summaryItems: SummaryItem[] = sent
    ? [
        {
          label: t("uniforms.orders.summary.received"),
          value: order.totals.received,
          suffix: t("uniforms.orders.summary.ofOrdered", { count: order.totals.ordered }),
          progress: receivedPct,
        },
        {
          label: t("uniforms.orders.summary.missingHere"),
          value: order.totals.missing,
          tone: order.totals.missing > 0 ? "alert" : "default",
          sub:
            order.totals.extra > 0
              ? t("uniforms.orders.extraCount", { count: order.totals.extra })
              : undefined,
        },
        {
          label: t("uniforms.orders.summary.deliveries"),
          value: order.receipts.length,
          sub: hasReceipts
            ? t("uniforms.orders.summary.lastDelivery", {
                date: formatDateOnly(order.receipts[order.receipts.length - 1].receivedAt, locale),
              })
            : t("uniforms.receipts.none.short"),
        },
      ]
    : [
        {
          label: t("uniforms.orders.summary.pieces"),
          value: totalOrdered,
          sub: t("uniforms.orders.summary.sizes", { count: lines.length }),
        },
        {
          label: t("uniforms.orders.summary.requests"),
          value: order.uniforms.length,
          sub: t("uniforms.orders.summary.requests.sub"),
        },
      ];

  const actions = isDraft ? (
    <>
      <Button onClick={() => ask({ kind: "send" })} disabled={pending}>
        <Send />
        {t("uniforms.orders.action.markSent")}
      </Button>
      <Button
        variant="outline"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => ask({ kind: "delete" })}
        disabled={pending}
      >
        <Trash2 />
        {t("uniforms.orders.action.deleteDraft")}
      </Button>
    </>
  ) : (
    <>
      <Button
        variant={order.state === "RECEIVED" ? "outline" : "default"}
        onClick={() => setReceiving(true)}
        disabled={pending}
      >
        <PackageCheck />
        {t("uniforms.orders.action.receive")}
      </Button>
      {!hasReceipts && (
        <Button variant="ghost" onClick={() => ask({ kind: "draft" })} disabled={pending}>
          <Undo2 />
          {t("uniforms.orders.action.backToDraft")}
        </Button>
      )}
    </>
  );

  const confirmText = (() => {
    switch (confirm?.kind) {
      case "send":
        return {
          title: t("uniforms.orders.confirm.send.title"),
          desc: t("uniforms.orders.confirm.send.desc", { number: order.number }),
          btn: t("uniforms.orders.confirm.send.btn"),
          destructive: false,
        };
      case "draft":
        return {
          title: t("uniforms.orders.confirm.draft.title"),
          desc: t("uniforms.orders.confirm.draft.desc"),
          btn: t("uniforms.orders.confirm.draft.btn"),
          destructive: false,
        };
      case "delete":
        return {
          title: t("uniforms.orders.confirm.delete.title", { number: order.number }),
          desc: t("uniforms.orders.confirm.delete.desc"),
          btn: t("uniforms.orders.confirm.delete.btn"),
          destructive: true,
        };
      case "receipt":
        return {
          title: t("uniforms.receipts.confirm.title", {
            index: confirm.index,
            date: formatDateOnly(confirm.date, locale),
          }),
          desc: t("uniforms.receipts.confirm.desc"),
          btn: t("uniforms.receipts.confirm.btn"),
          destructive: true,
        };
      default:
        return null;
    }
  })();

  const requests = [...order.uniforms].sort(
    (a, b) =>
      compareSizes(a.size || "—", b.size || "—") ||
      a.student.fullName.localeCompare(b.student.fullName, locale),
  );

  return (
    <div className="space-y-4">
      {/* Header: number, state, dates. */}
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight text-sea-900 sm:text-xl dark:text-sea-100">
            {t("uniforms.orders.title.number", { number: order.number })}
          </h2>
          <SupplierOrderStateChip state={order.state} />
        </div>
        <p className="text-xs text-muted-foreground">
          {t("uniforms.orders.createdOn", { date: formatDate(order.createdAt, locale) })}
          {order.orderedAt && (
            <>
              {" · "}
              {t("uniforms.orders.sentOn", { date: formatDate(order.orderedAt, locale) })}
            </>
          )}
        </p>
        {order.notes && (
          <p className="text-sm break-words text-muted-foreground">
            <span className="font-medium text-foreground">{t("uniforms.orders.note")}</span>{" "}
            {order.notes}
          </p>
        )}
      </div>

      <SummaryStrip items={summaryItems} actions={actions} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Section
          title={t("uniforms.orders.lines.title")}
          description={t("uniforms.orders.lines.desc")}
        >
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className={cn(th, "text-start")}>{t("uniforms.table.size")}</th>
                <th scope="col" className={cn(th, "text-end")}>{t("uniforms.orders.col.quantity")}</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l.size} className="border-b border-border">
                  <td className={cn(td, "font-semibold")}>
                    <bdi>{l.size}</bdi>
                  </td>
                  <td className={cn(td, "text-end")}>{l.quantity}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className={td}>{t("uniforms.orders.total")}</td>
                <td className={cn(td, "text-end")}>{totalOrdered}</td>
              </tr>
            </tfoot>
          </table>
          </div>
        </Section>

        <Section
          title={t("uniforms.supplier.text.title")}
          description={t("uniforms.supplier.text.desc")}
        >
          <SupplierShareText
            text={supplierOrderText(order, locale, t)}
            copyLabel="uniforms.supplier.copy"
          />
        </Section>
      </div>

      {sent && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Section
            title={t("uniforms.recon.title")}
            description={t("uniforms.recon.desc")}
          >
            <div className="overflow-x-auto">
          <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className={cn(th, "text-start")}>{t("uniforms.table.size")}</th>
                  <th scope="col" className={cn(th, "text-end")}>{t("uniforms.recon.ordered")}</th>
                  <th scope="col" className={cn(th, "text-end")}>{t("uniforms.recon.received")}</th>
                  <th scope="col" className={cn(th, "text-end")}>{t("uniforms.recon.missing")}</th>
                  <th scope="col" className={cn(th, "text-end")}>{t("uniforms.recon.extra")}</th>
                </tr>
              </thead>
              <tbody>
                {reconciliation.map((r) => (
                  <tr key={r.size} className="border-b border-border">
                    <td className={cn(td, "font-semibold")}>
                      <bdi>{r.size}</bdi>
                    </td>
                    <td className={cn(td, "text-end")}>{r.ordered}</td>
                    <td className={cn(td, "text-end")}>{r.received}</td>
                    <td
                      className={cn(
                        td,
                        "text-end",
                        r.missing > 0 ? "font-semibold text-alert" : "text-muted-foreground",
                      )}
                    >
                      {r.missing}
                    </td>
                    <td
                      className={cn(
                        td,
                        "text-end",
                        r.extra > 0 ? "font-semibold text-sea-800 dark:text-sea-300" : "text-muted-foreground",
                      )}
                    >
                      {r.extra}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold">
                  <td className={td}>{t("uniforms.orders.total")}</td>
                  <td className={cn(td, "text-end")}>{order.totals.ordered}</td>
                  <td className={cn(td, "text-end")}>{order.totals.received}</td>
                  <td className={cn(td, "text-end", order.totals.missing > 0 && "text-alert")}>
                    {order.totals.missing}
                  </td>
                  <td className={cn(td, "text-end")}>{order.totals.extra}</td>
                </tr>
              </tfoot>
            </table>
          </div>
            {hasReceipts &&
              order.totals.received === order.totals.ordered &&
              hasDifferences(order) && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("uniforms.receive.preview.totalMatches")}
                </p>
              )}
          </Section>

          {showDiffs ? (
            <Section
              title={t("uniforms.supplier.diff.title")}
              description={t("uniforms.supplier.diff.desc")}
            >
              <SupplierShareText
                text={supplierDifferencesText(order, locale, t)}
                copyLabel="uniforms.supplier.copyDiff"
              />
            </Section>
          ) : (
            <Section title={t("uniforms.supplier.diff.title")}>
              <p className="text-sm text-muted-foreground">
                {hasReceipts
                  ? t("uniforms.supplier.diff.noneYet")
                  : t("uniforms.supplier.diff.waiting")}
              </p>
            </Section>
          )}
        </div>
      )}

      {sent && (
        <Section
          title={t("uniforms.receipts.title")}
          description={t("uniforms.receipts.desc")}
        >
          {hasReceipts ? (
            <ol className="divide-y divide-border">
              {order.receipts.map((r, i) => {
                const total = r.lines.reduce((s, l) => s + l.quantity, 0);
                const rLines = [...r.lines].sort((a, b) => compareSizes(a.size, b.size));
                return (
                  <li key={r.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm">
                        <span className="font-medium">
                          {t("uniforms.receipts.item", {
                            index: i + 1,
                            date: formatDateOnly(r.receivedAt, locale),
                          })}
                        </span>
                        <span className="ms-2 text-xs text-muted-foreground tabular-nums">
                          {t("uniforms.orders.pieces", { count: total })}
                        </span>
                      </p>
                      <ul className="mt-1.5 flex flex-wrap gap-1.5">
                        {rLines.map((l) => (
                          <li
                            key={l.size}
                            className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs tabular-nums"
                          >
                            <bdi className="font-semibold">{l.size}</bdi>
                            <span className="text-muted-foreground">×</span>
                            <span>{l.quantity}</span>
                          </li>
                        ))}
                      </ul>
                      {r.note && (
                        <p className="mt-1 text-xs break-words text-muted-foreground">{r.note}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive sm:size-8"
                      aria-label={t("uniforms.receipts.delete.aria", {
                        index: i + 1,
                        date: formatDateOnly(r.receivedAt, locale),
                      })}
                      disabled={pending}
                      onClick={() =>
                        ask({ kind: "receipt", receiptId: r.id, index: i + 1, date: r.receivedAt })
                      }
                    >
                      <Trash2 />
                    </Button>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">{t("uniforms.receipts.none")}</p>
          )}
        </Section>
      )}

      {/* Internal: who these pieces are for. Never part of the supplier text. */}
      <Card className="min-w-0 p-0">
        <details className="group">
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-5 [&::-webkit-details-marker]:hidden">
            <Lock className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-sea-900 dark:text-sea-100">
                {t("uniforms.internal.title", { count: order.uniforms.length })}
              </span>
              <span className="block text-xs text-muted-foreground">
                {t("uniforms.internal.desc")}
              </span>
            </span>
            <ChevronDown
              className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <div className="border-t border-border px-4 pb-4 sm:px-5">
            {requests.length === 0 ? (
              <p className="pt-3 text-sm text-muted-foreground">{t("uniforms.internal.empty")}</p>
            ) : (
              <ul className="divide-y divide-border">
                {requests.map((u) => (
                  <li key={u.id} className="flex flex-wrap items-center gap-x-2 gap-y-1.5 py-2.5">
                    <Link
                      href={`/students/${u.student.id}`}
                      className="min-w-0 flex-1 basis-40 truncate text-sm font-medium hover:underline"
                    >
                      {u.student.fullName}
                    </Link>
                    <span className="flex shrink-0 flex-wrap items-center gap-1.5">
                      <SizeChip size={u.size} />
                      <Badge
                        variant={u.isReceived ? "soft" : "outline"}
                        className={cn("rounded-full px-2", !u.isReceived && "text-muted-foreground")}
                      >
                        {u.isReceived ? t("uniforms.internal.handed") : t("uniforms.internal.notHanded")}
                      </Badge>
                      <Badge
                        variant={u.isPaid ? "soft" : "outline"}
                        className={cn("rounded-full px-2", !u.isPaid && "text-muted-foreground")}
                      >
                        {u.isPaid ? t("common.paid") : t("uniforms.internal.notPaid")}
                      </Badge>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {t("uniforms.internal.hint")}{" "}
              <Link href="/uniforms" className="font-medium text-sea-700 hover:underline">
                {t("uniforms.internal.toList")}
              </Link>
            </p>
          </div>
        </details>
      </Card>

      {receiving && <SupplierReceiveDialog order={order} onClose={() => setReceiving(false)} />}

      <Dialog open={confirmOpen} onOpenChange={(o) => !pending && setConfirmOpen(o)}>
        <DialogContent className="p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{confirmText?.title}</DialogTitle>
            <DialogDescription>{confirmText?.desc}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={pending}>
              {t("common.cancel")}
            </Button>
            <Button
              variant={confirmText?.destructive ? "destructive" : "default"}
              onClick={run}
              disabled={pending}
            >
              {pending && <Loader2 className="animate-spin" />}
              {confirmText?.btn}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
