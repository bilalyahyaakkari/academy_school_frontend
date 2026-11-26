"use client";

import Link from "next/link";
import {
  Check,
  CheckCircle2,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  PackageCheck,
  Pencil,
  RotateCcw,
  Trash2,
  Truck,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, formatCurrency } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import type { UniformWithStudent } from "@/lib/api/types";
import { paidPercent } from "./uniforms-filters";

/** Row-level actions, provided by UniformsClient. */
export type RowHandlers = {
  pendingId: string | null;
  onEdit: (u: UniformWithStudent) => void;
  onRecordPayment: (u: UniformWithStudent) => void;
  onToggleReceived: (u: UniformWithStudent) => void;
  onMarkPaid: (u: UniformWithStudent) => void;
  onUndoPaid: (u: UniformWithStudent) => void;
  /** WhatsApp receipt for what's been paid on this order. */
  onSendReceipt: (u: UniformWithStudent) => void;
  onDelete: (u: UniformWithStudent) => void;
};

/** "Left" marker for an order whose student has left the academy. */
export function LeftBadge() {
  const t = useT();
  return (
    <Badge variant="soft" className="shrink-0 rounded-full px-2 text-[10px]">
      {t("roster.badge.left")}
    </Badge>
  );
}

export function SizeChip({ size }: { size: string }) {
  return (
    <Badge variant="outline" className="shrink-0 rounded-full px-2 font-semibold">
      {size || "—"}
    </Badge>
  );
}

/** "#12": this request is in supplier order 12 — links to it. */
export function SupplierOrderChip({
  order,
}: {
  order: NonNullable<UniformWithStudent["supplierOrder"]>;
}) {
  const t = useT();
  const label =
    order.status === "DRAFT"
      ? t("uniforms.orders.chip.draftTitle", { number: order.number })
      : t("uniforms.orders.chip.title", { number: order.number });
  return (
    <Link
      href={`/uniforms/orders/${order.id}`}
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1 rounded-full border px-2 text-[11px] font-medium tabular-nums whitespace-nowrap transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring sm:h-6",
        order.status === "DRAFT"
          ? "border-dashed border-sea-300 text-muted-foreground"
          : "border-border text-sea-800",
      )}
    >
      <Truck className="size-3" aria-hidden />
      {t("uniforms.orders.chip", { number: order.number })}
    </Link>
  );
}

/** "$10 / $30" with a thin progress bar. Red only while nothing is paid. */
export function PaymentProgress({
  u,
  className,
}: {
  u: UniformWithStudent;
  className?: string;
}) {
  const t = useT();
  const pct = paidPercent(u);
  const partial = !u.isPaid && pct > 0;
  const unpaid = !u.isPaid && pct === 0;
  const shownPaid = u.isPaid ? u.price : Math.min(u.paidAmount, u.price);

  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-sm tabular-nums">
        <span className={cn("font-medium", unpaid && "text-alert")}>
          {formatCurrency(shownPaid)}
        </span>
        <span className={cn(unpaid ? "text-alert" : "text-muted-foreground")}>
          {" / "}
          {formatCurrency(u.price)}
        </span>
        <span className="sr-only">
          {" — "}
          {u.isPaid
            ? t("common.paid")
            : partial
              ? t("common.partial")
              : t("common.unpaid")}
        </span>
      </p>
      <div aria-hidden className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            u.isPaid ? "bg-sea-700" : "bg-sea-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** One chip that shows and toggles whether the uniform was handed out. */
export function DeliveryToggle({
  u,
  pending,
  onToggle,
}: {
  u: UniformWithStudent;
  pending: boolean;
  onToggle: () => void;
}) {
  const t = useT();
  return (
    <button
      type="button"
      aria-pressed={u.isReceived}
      aria-label={t("uniforms.aria.received", { name: u.student.fullName })}
      onClick={onToggle}
      disabled={pending}
      className={cn(
        "inline-flex h-10 shrink-0 items-center gap-1 rounded-full border px-3 text-xs font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60 sm:h-7 sm:px-2.5",
        u.isReceived
          ? "border-transparent bg-sea-700/10 text-sea-700 hover:bg-sea-700/15"
          : "border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : u.isReceived ? (
        <Check className="size-3.5" />
      ) : null}
      {u.isReceived
        ? t("uniforms.badge.received")
        : t("uniforms.badge.notReceived")}
    </button>
  );
}

/** The one visible contextual action + the ⋯ menu with everything else. */
export function RowActions({
  u,
  h,
  className,
}: {
  u: UniformWithStudent;
  h: RowHandlers;
  className?: string;
}) {
  const t = useT();
  const pending = h.pendingId === u.id;
  const itemClass = "min-h-10 cursor-pointer sm:min-h-0";

  return (
    <div className={cn("flex items-center justify-end gap-1", className)}>
      {!u.isPaid && (
        <Button
          size="sm"
          variant="outline"
          className="h-10 sm:h-8"
          onClick={() => h.onRecordPayment(u)}
          disabled={pending}
        >
          <Wallet className="size-4" />
          {t("uniforms.action.recordPayment")}
        </Button>
      )}
      {/* Non-modal so dialogs opened from an item don't fight its focus lock. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="sm:size-8"
            aria-label={t("uniforms.aria.rowMenu", { name: u.student.fullName })}
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MoreHorizontal className="size-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem className={itemClass} onSelect={() => h.onEdit(u)}>
            <Pencil className="me-2 size-4" />
            {t("common.edit")}
          </DropdownMenuItem>
          <DropdownMenuItem
            className={itemClass}
            onSelect={() => h.onToggleReceived(u)}
          >
            {u.isReceived ? (
              <RotateCcw className="me-2 size-4" />
            ) : (
              <PackageCheck className="me-2 size-4" />
            )}
            {u.isReceived
              ? t("uniforms.action.undoReceived")
              : t("uniforms.action.markReceived")}
          </DropdownMenuItem>
          <DropdownMenuItem
            className={itemClass}
            onSelect={() => (u.isPaid ? h.onUndoPaid(u) : h.onMarkPaid(u))}
          >
            {u.isPaid ? (
              <RotateCcw className="me-2 size-4" />
            ) : (
              <CheckCircle2 className="me-2 size-4" />
            )}
            {u.isPaid
              ? t("uniforms.action.undoPayment")
              : t("uniforms.action.markPaid")}
          </DropdownMenuItem>
          {(u.isPaid || u.paidAmount > 0) && (
            <DropdownMenuItem className={itemClass} onSelect={() => h.onSendReceipt(u)}>
              <MessageCircle className="me-2 size-4" />
              {t("payments.receipt.send")}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className={cn(
              itemClass,
              "text-destructive focus:bg-destructive/10 focus:text-destructive",
            )}
            onSelect={() => h.onDelete(u)}
          >
            <Trash2 className="me-2 size-4" />
            {t("common.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
