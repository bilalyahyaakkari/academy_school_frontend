import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type SummaryItem = {
  label: string;
  /** The main figure ("$480.00", "12"). */
  value: ReactNode;
  /** Small text right after the value, on the same line ("of $504.00"). */
  suffix?: ReactNode;
  /** Small muted line under the value ("2 unpaid"). */
  sub?: ReactNode;
  /**
   * "alert" paints the value red — use it only for something that needs
   * attention (money owed, overdue…), and only when it's actually > 0.
   * "positive" paints it sea-700.
   */
  tone?: "default" | "alert" | "positive";
  /** 0–100: draws a thin progress bar under the value. */
  progress?: number;
  /** Accessible name for the progress bar (defaults to the label). */
  progressLabel?: string;
};

/**
 * The page summary: one calm card with a few key figures side by side,
 * separated by thin dividers, and an optional footer row (chips, filters…).
 * Replaces the old grid of separate stat cards. Works in server and client
 * components (no hooks).
 */
export function SummaryStrip({
  items,
  footer,
  actions,
  className,
}: {
  items: SummaryItem[];
  footer?: ReactNode;
  /** The page's main buttons (pages have no title bar — they live here). */
  actions?: ReactNode;
  className?: string;
}) {
  const cols =
    items.length >= 4
      ? "sm:grid-cols-2 lg:grid-cols-4"
      : items.length === 3
        ? "sm:grid-cols-3"
        : items.length === 2
          ? "sm:grid-cols-2"
          : "";
  // Dividers between figures only where they sit on one row.
  const dividers =
    items.length >= 4
      ? "lg:divide-x lg:divide-border"
      : items.length > 1
        ? "sm:divide-x sm:divide-border"
        : "";
  const pad =
    items.length >= 4
      ? "lg:px-5 lg:first:ps-0 lg:last:pe-0"
      : "sm:px-5 sm:first:ps-0 sm:last:pe-0";

  return (
    <Card className={cn("p-4 sm:p-5", className)}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
        <div
          className={cn("grid min-w-0 flex-1 gap-4 sm:gap-x-0", cols, dividers)}
        >
          {items.map((item, i) => (
            <div key={i} className={cn("min-w-0", pad)}>
              <p className="text-xs font-medium text-muted-foreground">
                {item.label}
              </p>
              <p
                className={cn(
                  "mt-1 text-xl font-semibold tabular-nums sm:text-2xl",
                  item.tone === "alert"
                    ? "text-alert"
                    : item.tone === "positive"
                      ? "text-sea-700"
                      : "text-foreground",
                )}
              >
                {item.value}
                {item.suffix != null && (
                  <span className="ms-1.5 text-sm font-normal text-muted-foreground">
                    {item.suffix}
                  </span>
                )}
              </p>
              {item.progress != null && (
                <div
                  className="mt-2 h-1 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-label={item.progressLabel ?? item.label}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(item.progress)}
                >
                  <div
                    className="h-full rounded-full bg-sea-700"
                    style={{
                      width: `${Math.max(0, Math.min(100, item.progress))}%`,
                    }}
                  />
                </div>
              )}
              {item.sub != null && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.sub}
                </p>
              )}
            </div>
          ))}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4 xl:shrink-0 xl:border-t-0 xl:border-s xl:ps-5 xl:pt-0 [&>*]:flex-1 sm:[&>*]:flex-none">
            {actions}
          </div>
        )}
      </div>
      {footer && (
        <div className="mt-4 border-t border-border pt-3">{footer}</div>
      )}
    </Card>
  );
}
