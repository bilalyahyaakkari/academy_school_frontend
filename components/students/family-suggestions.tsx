"use client";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";
import { Link2, Loader2, Phone } from "lucide-react";
import { joinNames, type Suggestion } from "./families-shared";

/**
 * "Same parent phone" suggestions: one card per phone with a one-click Link,
 * a "Not siblings" dismiss, and "Link all" for the lot.
 */
export function FamilySuggestions({
  suggestions,
  progress,
  onLink,
  onDismiss,
  onLinkAll,
}: {
  suggestions: Suggestion[];
  /** Set while "Link all" runs. */
  progress: { done: number; total: number } | null;
  onLink: (s: Suggestion) => void;
  onDismiss: (s: Suggestion) => void;
  onLinkAll: () => void;
}) {
  const t = useT();
  const busy = progress !== null;

  return (
    <section aria-labelledby="family-suggestions-title" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="family-suggestions-title"
            className="flex items-center gap-1.5 text-sm font-semibold text-sea-900"
          >
            <Phone aria-hidden className="size-4 text-sea-700" />
            {t("students.families.suggestions.title")}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t("students.families.suggestions.desc")}
          </p>
        </div>
        {suggestions.length > 1 && (
          <Button type="button" onClick={onLinkAll} disabled={busy} className="max-sm:w-full">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
            {t("students.families.suggestions.linkAll", { count: suggestions.length })}
          </Button>
        )}
      </div>

      {/* Announced as it changes: "Linking 3 of 12…" */}
      <div aria-live="polite" role="status">
        {progress && (
          <div className="space-y-1.5 rounded-lg border border-sea-300 bg-sea-100 px-3 py-2">
            <p className="text-sm font-medium text-sea-900">
              {t("students.families.suggestions.progress", {
                done: progress.done,
                total: progress.total,
              })}
            </p>
            <div
              className="h-1 overflow-hidden rounded-full bg-background"
              role="progressbar"
              aria-label={t("students.families.suggestions.progressLabel")}
              aria-valuemin={0}
              aria-valuemax={progress.total}
              aria-valuenow={progress.done}
            >
              <div
                className="h-full rounded-full bg-sea-700 transition-[width]"
                style={{ width: `${(progress.done / Math.max(1, progress.total)) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {suggestions.map((s) => {
          const names = joinNames(
            s.members.map((m) => m.fullName),
            t,
          );
          return (
            <li
              key={s.key}
              className="flex min-w-0 flex-col gap-2 rounded-xl border border-sea-300 bg-card p-3"
            >
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Phone aria-hidden className="size-3 shrink-0" />
                <span dir="ltr" className="truncate">
                  {s.phone}
                </span>
              </p>
              <ul className="space-y-0.5">
                {s.members.map((m) => (
                  <li key={m.id} className="flex min-w-0 items-baseline gap-2 text-sm">
                    <span className="truncate font-medium">{m.fullName}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {m.group?.name ?? t("students.families.noGroup")}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={busy}
                  onClick={() => onDismiss(s)}
                  aria-label={t("students.families.suggestions.dismissLabel", { names })}
                >
                  {t("students.families.suggestions.dismiss")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={busy}
                  onClick={() => onLink(s)}
                  aria-label={t("students.families.suggestions.linkLabel", { names })}
                >
                  <Link2 className="size-4" />
                  {t("students.families.suggestions.link")}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
