import { cn } from "@/lib/utils";
import { BackLink } from "./back-link";

export function PageHeader({
  title,
  description,
  actions,
  backHref,
  backLabel,
  showTitle = false,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  /** When set, renders a "← Back" link above the title that navigates to this href. */
  backHref?: string;
  /** Defaults to the translated "Back". */
  backLabel?: string;
  /**
   * Show the title. Off by default: the sidebar already says which page this
   * is, so the title is kept for screen readers only. Turn it on where the
   * title is content (a student's or group's name), not the page's name.
   */
  showTitle?: boolean;
  className?: string;
}) {
  if (!showTitle) {
    // No visible title bar: just the back link and/or buttons, when there are
    // any. Pages with a summary card put their buttons in that card instead.
    if (!backHref && !actions) return <h1 className="sr-only">{title}</h1>;
    return (
      <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
        <h1 className="sr-only">{title}</h1>
        {backHref ? <BackLink href={backHref} label={backLabel} /> : <span />}
        {actions && (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">
            {actions}
          </div>
        )}
      </div>
    );
  }

  // Title shown (detail pages): compact, it orients without taking over.
  return (
    <div className={cn("space-y-2", className)}>
      {backHref && <BackLink href={backHref} label={backLabel} />}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span aria-hidden className="h-4 w-0.5 shrink-0 rounded-full bg-sea-700" />
            <h1 className="truncate text-lg font-semibold tracking-tight text-sea-900 sm:text-xl">
              {title}
            </h1>
          </div>
          {description && (
            <p className="mt-0.5 ps-2.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
