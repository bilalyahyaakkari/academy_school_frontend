"use client";

import { useId, useMemo, useState, type DragEvent } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { normalizeArabic } from "@/lib/arabic";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import type { FamilyMember } from "@/lib/api/types";
import { GripVertical, Link2, Search, UsersRound, X } from "lucide-react";
import { matchesSearch, type DropProps } from "./families-shared";

/** Rows shown before the admin types anything (the list can be long). */
const MAX_ROWS = 80;

/**
 * "Students without a family": searchable, every row draggable and a drop
 * target, with a checkbox for the no-drag way. The "New family" zone on top
 * collects the checked (or dropped) students and links them.
 */
export function FamilyStudentsPanel({
  students,
  checked,
  overKey,
  dragging,
  dropHandlers,
  newZoneCanReceive,
  onToggle,
  onLinkChecked,
  onRowDragStart,
  onDragEnd,
}: {
  /** Current students without a family, sorted. */
  students: FamilyMember[];
  /** Checked students, in the order they were checked. */
  checked: FamilyMember[];
  overKey: string | null;
  /** Ids being dragged from this list. */
  dragging: Set<string>;
  /** Shared drop handlers; each target names itself in data-drop. */
  dropHandlers: DropProps;
  newZoneCanReceive: boolean;
  onToggle: (id: string, on: boolean) => void;
  onLinkChecked: () => void;
  onRowDragStart: (e: DragEvent, student: FamilyMember) => void;
  onDragEnd: () => void;
}) {
  const t = useT();
  const idPrefix = useId();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = normalizeArabic(q);
    const digits = q.replace(/\D/g, "");
    return students.filter((s) => matchesSearch(s, needle, digits, normalizeArabic));
  }, [students, q]);
  const rows = filtered.slice(0, MAX_ROWS);
  const checkedIds = new Set(checked.map((s) => s.id));
  const newOver = overKey === "new";

  return (
    <section
      aria-labelledby={`${idPrefix}-title`}
      className="flex min-w-0 flex-col gap-3 rounded-xl border border-border bg-card p-3 sm:p-4 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)]"
    >
      <div>
        <h2 id={`${idPrefix}-title`} className="text-sm font-semibold text-sea-900">
          {t("students.families.alone.title")}{" "}
          <span className="font-normal text-muted-foreground tabular-nums">
            ({students.length})
          </span>
        </h2>
        <p className="text-xs text-muted-foreground">{t("students.families.alone.hint")}</p>
      </div>

      {/* New family: drop zone + the checked students. */}
      <div
        data-drop="new"
        {...dropHandlers}
        className={cn(
          "rounded-lg border border-dashed p-3 transition-colors",
          newOver
            ? "border-sea-500 bg-sea-100 ring-2 ring-sea-500"
            : newZoneCanReceive
              ? "border-sea-500"
              : "border-sea-300",
        )}
      >
        <p className="flex items-center gap-1.5 text-sm font-medium text-sea-900">
          <UsersRound aria-hidden className="size-4 text-sea-700" />
          {t("students.families.new.title")}
        </p>
        {checked.length === 0 ? (
          <p className="mt-0.5 text-xs text-muted-foreground">{t("students.families.new.hint")}</p>
        ) : (
          <div className="mt-2 space-y-2">
            <ul className="flex flex-wrap gap-1.5">
              {checked.map((s) => (
                <li
                  key={s.id}
                  className="flex min-w-0 max-w-full items-center gap-0.5 rounded-full bg-sea-100 py-0.5 ps-2.5 pe-0.5 text-sm text-sea-900"
                >
                  <span className="truncate">{s.fullName}</span>
                  <button
                    type="button"
                    onClick={() => onToggle(s.id, false)}
                    aria-label={t("students.families.new.unselect", { name: s.fullName })}
                    className="grid size-7 shrink-0 place-items-center rounded-full hover:bg-sea-300/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X aria-hidden className="size-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            {checked.length >= 2 ? (
              <Button type="button" size="sm" className="w-full" onClick={onLinkChecked}>
                <Link2 className="size-4" />
                {t("students.families.bar.link", { count: checked.length })}
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">{t("students.families.new.oneMore")}</p>
            )}
          </div>
        )}
      </div>

      <div className="relative">
        <Search
          aria-hidden
          className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          type="search"
          aria-label={t("students.families.alone.search.label")}
          placeholder={t("students.siblings.search.placeholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-10 ps-9 sm:h-9"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-border">
        {students.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">{t("students.families.alone.empty")}</p>
        ) : rows.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">{t("students.siblings.noMatches")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((s) => {
              const boxId = `${idPrefix}-${s.id}`;
              const isChecked = checkedIds.has(s.id);
              const over = overKey === `student:${s.id}`;
              return (
                <li
                  key={s.id}
                  draggable
                  onDragStart={(e) => onRowDragStart(e, s)}
                  onDragEnd={onDragEnd}
                  title={t("students.families.alone.drag", { name: s.fullName })}
                  data-drop={`student:${s.id}`}
                  {...dropHandlers}
                  className={cn(
                    "relative flex cursor-grab items-center gap-2 px-2 py-2 transition-colors active:cursor-grabbing",
                    isChecked && "bg-sea-100/60",
                    over && "bg-sea-100 ring-2 ring-inset ring-sea-500",
                    dragging.has(s.id) && "opacity-50",
                  )}
                >
                  <GripVertical aria-hidden className="size-4 shrink-0 text-muted-foreground" />
                  <Checkbox
                    id={boxId}
                    checked={isChecked}
                    onCheckedChange={(v) => onToggle(s.id, v === true)}
                    aria-label={t("students.families.alone.select", { name: s.fullName })}
                    className="size-5 sm:size-4"
                  />
                  <label htmlFor={boxId} className="min-w-0 flex-1 cursor-pointer">
                    <span className="block truncate text-sm font-medium">{s.fullName}</span>
                    <span className="flex min-w-0 flex-wrap gap-x-2 text-xs text-muted-foreground">
                      <span className="truncate">
                        {s.group?.name ?? t("students.families.noGroup")}
                      </span>
                      {s.phoneNumber && <span dir="ltr">{s.phoneNumber}</span>}
                    </span>
                  </label>
                  {over && (
                    <span
                      aria-hidden
                      className="pointer-events-none flex shrink-0 items-center gap-1 rounded-full bg-sea-800 px-2 py-0.5 text-xs font-medium text-white"
                    >
                      <Link2 className="size-3" />
                      {t("students.families.alone.drop")}
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {filtered.length > rows.length && (
        <p className="text-xs text-muted-foreground">
          {t("students.siblings.more", { shown: rows.length, total: filtered.length })}
        </p>
      )}
    </section>
  );
}
