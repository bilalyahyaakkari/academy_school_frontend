"use client";

import { Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import type { TranslationKey } from "@/lib/i18n";
import { UNIFORM_TABS, type UniformTab } from "./uniforms-filters";

const TAB_LABEL: Record<UniformTab, TranslationKey> = {
  all: "uniforms.filter.all",
  unpaid: "uniforms.filter.unpaid",
  toHandOut: "uniforms.filter.toHandOut",
  done: "uniforms.filter.done",
};

/** Search, filter tabs, active size chip and (when selecting) bulk actions. */
export function UniformsToolbar({
  q,
  onSearch,
  tab,
  onTab,
  counts,
  size,
  onClearSize,
  selectedCount,
  onClearSelection,
  onBulkDelete,
}: {
  q: string;
  onSearch: (q: string) => void;
  tab: UniformTab;
  onTab: (tab: UniformTab) => void;
  counts: Record<UniformTab, number>;
  size: string | null;
  onClearSize: () => void;
  selectedCount: number;
  onClearSelection: () => void;
  onBulkDelete: () => void;
}) {
  const t = useT();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:min-w-64 sm:max-w-md sm:flex-1">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label={t("common.search")}
          placeholder={t("uniforms.search.placeholder")}
          value={q}
          onChange={(e) => onSearch(e.target.value)}
          className="h-10 ps-9 pe-10 sm:h-9"
        />
        {q && (
          <button
            type="button"
            onClick={() => onSearch("")}
            aria-label={t("common.clear")}
            className="absolute end-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div
        role="group"
        aria-label={t("uniforms.filter.group")}
        className="flex max-w-full gap-0.5 overflow-x-auto rounded-md border border-border bg-muted/40 p-0.5 text-sm"
      >
        {UNIFORM_TABS.map((f) => {
          const active = tab === f;
          return (
            <button
              key={f}
              type="button"
              aria-pressed={active}
              onClick={() => onTab(f)}
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-1.5 rounded px-3 whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-8",
                active
                  ? "bg-card font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(TAB_LABEL[f])}
              <span className="text-xs tabular-nums text-muted-foreground">
                {counts[f]}
              </span>
            </button>
          );
        })}
      </div>

      {size !== null && (
        <span className="inline-flex h-10 items-center gap-1 rounded-full border border-border bg-card ps-3 pe-1 text-xs font-medium sm:h-8">
          {t("uniforms.size.active", { size })}
          <button
            type="button"
            onClick={onClearSize}
            aria-label={t("uniforms.size.clear")}
            className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:size-6"
          >
            <X className="size-3.5" />
          </button>
        </span>
      )}

      {selectedCount > 0 && (
        <div className="flex items-center gap-1 sm:ms-auto">
          <span className="px-1 text-sm text-muted-foreground">
            {t("uniforms.bulkDelete.selected", { count: selectedCount })}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-10 sm:h-8"
            onClick={onClearSelection}
          >
            {t("common.clear")}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="h-10 sm:h-8"
            onClick={onBulkDelete}
          >
            <Trash2 className="size-4" />
            {t("uniforms.bulkDelete.btn")}
          </Button>
        </div>
      )}
    </div>
  );
}
