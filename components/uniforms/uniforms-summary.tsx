"use client";

import type { ReactNode } from "react";

import { X } from "lucide-react";
import { SummaryStrip } from "@/components/app/summary-strip";
import { cn, formatCurrency } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import type { UniformsSummary } from "./uniforms-filters";

/**
 * One calm card: three key figures (collected, outstanding, to hand out) and
 * a line of size chips underneath that double as a size filter.
 */
export function UniformsSummaryStrip({
  summary,
  activeSize,
  onSizeChange,
  actions,
}: {
  summary: UniformsSummary;
  activeSize: string | null;
  onSizeChange: (size: string | null) => void;
  /** The page's main buttons, shown inside the card. */
  actions?: ReactNode;
}) {
  const t = useT();
  const collectedPct =
    summary.totalValue > 0
      ? Math.min(100, Math.round((summary.collected / summary.totalValue) * 100))
      : 0;

  const sizeChips =
    summary.sizes.length > 0 ? (
      <div
        role="group"
        aria-label={t("uniforms.size.group")}
        className="flex flex-wrap items-center gap-1.5"
      >
        {summary.sizes.map((s) => {
          const active = activeSize === s.size;
          return (
            <button
              key={s.size}
              type="button"
              aria-pressed={active}
              title={t("uniforms.size.tooltip", {
                received: s.received,
                paid: s.paid,
              })}
              onClick={() => onSizeChange(active ? null : s.size)}
              className={cn(
                "inline-flex h-10 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-7 sm:px-2.5",
                active
                  ? "border-transparent bg-primary text-primary-foreground"
                  : "border-border text-foreground hover:bg-accent",
              )}
            >
              {s.size}
              <span
                className={cn(
                  "tabular-nums",
                  active ? "text-primary-foreground/80" : "text-muted-foreground",
                )}
              >
                {s.total}
              </span>
            </button>
          );
        })}
        {activeSize !== null && (
          <button
            type="button"
            onClick={() => onSizeChange(null)}
            aria-label={t("uniforms.size.clear")}
            title={t("uniforms.size.clear")}
            className="grid size-10 place-items-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring sm:size-7"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    ) : undefined;

  return (
    <SummaryStrip
      items={[
        {
          label: t("uniforms.summary.collected"),
          value: formatCurrency(summary.collected),
          suffix: t("uniforms.summary.ofTotal", {
            total: formatCurrency(summary.totalValue),
          }),
          progress: collectedPct,
        },
        {
          label: t("uniforms.stat.outstanding"),
          value: formatCurrency(summary.outstanding),
          tone: summary.outstanding > 0 ? "alert" : "default",
          sub: t("uniforms.summary.unpaidCount", { count: summary.unpaidCount }),
        },
        {
          label: t("uniforms.summary.toHandOut"),
          value: summary.toHandOut,
          sub: t("uniforms.summary.ofOrders", { count: summary.orders }),
        },
      ]}
      footer={sizeChips}
      actions={actions}
    />
  );
}
