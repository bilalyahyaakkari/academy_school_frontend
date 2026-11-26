"use client";

import Link from "next/link";
import {
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useSyncExternalStore,
  useTransition,
  type DragEvent,
} from "react";
import { toast } from "sonner";
import { ArrowUpRight, Info, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SummaryStrip } from "@/components/app/summary-strip";
import { useSidebarCollapsed } from "@/components/app/app-shell";
import { linkFamily, moveToFamily, unlinkSibling } from "@/lib/actions/students";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import type { FamiliesOverview, FamilyMember } from "@/lib/api/types";
import { FamilyCard } from "./family-card";
import { FamilySuggestions } from "./family-suggestions";
import { FamilyStudentsPanel } from "./family-students-panel";
import {
  MAX_FAMILY,
  applyFamilyChange,
  canDrop,
  familyAnchor,
  groupFamilies,
  joinNames,
  parseDismissed,
  parseTargetKey,
  readDismissed,
  setDragGhost,
  subscribeDismissed,
  suggestionKey,
  targetKey,
  writeDismissed,
  type DragItem,
  type DropProps,
  type DropTarget,
  type Family,
  type Suggestion,
} from "./families-shared";

const NO_IDS = new Set<string>();

/**
 * The Families page: link brothers and sisters in bulk.
 *
 * - Suggestions (same parent phone): one click each, or "Link all".
 * - Families: cards of chips; drop a student (or another family's child) on a
 *   card to add them, × to take one out (with undo).
 * - Students without a family: drag one onto another for a new family, or
 *   tick them and use "Link N as siblings" / "+ Add N here" (the no-drag way
 *   for phones, keyboards and screen readers).
 *
 * Changes show at once (useOptimistic); the server actions revalidate the
 * page, which replaces the optimistic state with the real one.
 */
export function FamiliesClient({ overview }: { overview: FamiliesOverview }) {
  const t = useT();
  const sidebarCollapsed = useSidebarCollapsed();
  const [, startOp] = useTransition();

  // Everyone involved, once: family members (incl. children who left) + current students.
  const base = useMemo(() => {
    const map = new Map<string, FamilyMember>();
    for (const f of overview.families) for (const m of f.members) map.set(m.id, m);
    for (const s of overview.students) if (!map.has(s.id)) map.set(s.id, s);
    return [...map.values()];
  }, [overview]);
  const familyOrder = useMemo(
    () => new Map(overview.families.map((f, i) => [f.familyId, i])),
    [overview.families],
  );

  const [members, applyOptimistic] = useOptimistic(base, applyFamilyChange);

  const families = useMemo(() => groupFamilies(members, familyOrder), [members, familyOrder]);
  const byId = useMemo(() => new Map(members.map((m) => [m.id, m])), [members]);
  const lone = useMemo(() => {
    const inFamily = new Set(families.flatMap((f) => f.members.map((m) => m.id)));
    return members
      .filter((m) => !m.archived && !inFamily.has(m.id))
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [members, families]);
  const childrenInFamilies = families.reduce((n, f) => n + f.members.length, 0);

  // ---- Suggestions ----
  const dismissedRaw = useSyncExternalStore(subscribeDismissed, readDismissed, () => "");
  const dismissed = useMemo(() => new Set(parseDismissed(dismissedRaw)), [dismissedRaw]);
  const openSuggestions = useMemo<Suggestion[]>(
    () =>
      overview.suggestions
        .map((s) => ({
          key: suggestionKey(s.phone, s.members),
          phone: s.phone,
          members: s.members.map((m) => byId.get(m.id) ?? m),
        }))
        // Gone as soon as they're one family (optimistically too).
        .filter((s) => {
          const ids = new Set(s.members.map((m) => m.familyId));
          return !(ids.size === 1 && !ids.has(null));
        }),
    [overview.suggestions, byId],
  );
  const suggestions = openSuggestions.filter((s) => !dismissed.has(s.key));
  const hiddenCount = openSuggestions.length - suggestions.length;
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  // ---- Checked students (the no-drag way) ----
  const [checkedOrder, setCheckedOrder] = useState<string[]>([]);
  const loneById = useMemo(() => new Map(lone.map((s) => [s.id, s])), [lone]);
  const checked = checkedOrder
    .map((id) => loneById.get(id))
    .filter((s): s is FamilyMember => !!s);
  const check = (ids: string[]) =>
    setCheckedOrder((prev) => [...prev, ...ids.filter((id) => !prev.includes(id))]);
  const uncheck = (ids: string[]) =>
    setCheckedOrder((prev) => prev.filter((id) => !ids.includes(id)));

  // ---- Actions ----
  const nameOf = (id: string) => byId.get(id)?.fullName ?? "";
  const namesOf = (ids: string[]) => joinNames(ids.map(nameOf), t);

  const runLink = (ids: string[], success: string) => {
    if (ids.length > MAX_FAMILY) {
      toast.error(t("students.families.error.max"));
      return;
    }
    startOp(async () => {
      applyOptimistic({ type: "link", ids });
      const res = await linkFamily(ids);
      if (res.success === false) {
        toast.error(res.error);
        return;
      }
      toast.success(success);
    });
  };

  const linkNew = (ids: string[]) => {
    uncheck(ids);
    runLink(ids, t("students.families.toast.linked", { names: namesOf(ids) }));
  };

  const addToFamily = (family: Family, ids: string[]) => {
    const anchor = familyAnchor(family);
    if (!anchor) return;
    if (family.members.length + ids.length > MAX_FAMILY) {
      toast.error(t("students.families.error.max"));
      return;
    }
    uncheck(ids);
    runLink(
      [anchor, ...ids],
      t("students.families.toast.added", { names: namesOf(ids), family: nameOf(anchor) }),
    );
  };

  /** Out of their family, into another one (or a new one with a lone student). */
  const moveMember = (id: string, targetIds: string[], success: string) => {
    startOp(async () => {
      applyOptimistic({ type: "move", id, targetIds });
      const res = await moveToFamily(id, targetIds);
      if (res.success === false) {
        toast.error(res.error);
        return;
      }
      toast.success(success);
    });
  };

  const removeMember = (family: Family, member: FamilyMember) => {
    const anchor = familyAnchor(family, member.id);
    startOp(async () => {
      applyOptimistic({ type: "unlink", id: member.id });
      const res = await unlinkSibling(member.id);
      if (res.success === false) {
        toast.error(res.error);
        return;
      }
      toast.success(t("students.families.toast.removed", { name: member.fullName }), {
        action: anchor
          ? {
              label: t("students.families.undo"),
              onClick: () =>
                runLink(
                  [member.id, anchor],
                  t("students.families.toast.linked", {
                    names: joinNames([member.fullName, nameOf(anchor)], t),
                  }),
                ),
            }
          : undefined,
      });
    });
  };

  const linkSuggestion = (s: Suggestion) =>
    runLink(
      s.members.map((m) => m.id),
      t("students.families.toast.linked", {
        names: joinNames(
          s.members.map((m) => m.fullName),
          t,
        ),
      }),
    );

  const dismissSuggestion = (s: Suggestion) => {
    // Keep only keys that still match a suggestion, so the list can't grow forever.
    const known = new Set(overview.suggestions.map((x) => suggestionKey(x.phone, x.members)));
    const keep = parseDismissed(readDismissed()).filter((k) => known.has(k) && k !== s.key);
    writeDismissed([...keep, s.key]);
    toast(t("students.families.toast.dismissed"), {
      action: {
        label: t("students.families.undo"),
        onClick: () => writeDismissed(parseDismissed(readDismissed()).filter((k) => k !== s.key)),
      },
    });
  };

  const linkAll = () => {
    const list = suggestions;
    if (list.length === 0 || progress) return;
    const total = list.length;
    setProgress({ done: 0, total });
    startOp(async () => {
      let ok = 0;
      let failed = 0;
      let lastError = "";
      // One at a time: each call merges families, so they mustn't race.
      for (const s of list) {
        const ids = s.members.map((m) => m.id);
        startOp(() => applyOptimistic({ type: "link", ids }));
        const res = await linkFamily(ids);
        if (res.success) ok++;
        else {
          failed++;
          lastError = res.error;
        }
        setProgress({ done: ok + failed, total });
      }
      setProgress(null);
      if (failed === 0) {
        toast.success(
          ok === 1
            ? t("students.families.toast.linkedAll.one")
            : t("students.families.toast.linkedAll", { count: ok }),
        );
      } else {
        toast.error(
          t("students.families.toast.linkedAllPartial", { done: ok, total, failed }),
          { description: lastError },
        );
      }
    });
  };

  // ---- Drag & drop (native HTML5) ----
  // The ref is what the handlers read; the state only paints the UI.
  const dragRef = useRef<DragItem | null>(null);
  const [drag, setDrag] = useState<DragItem | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);

  const beginDrag = (e: DragEvent, item: DragItem, label: string) => {
    dragRef.current = item;
    e.dataTransfer.effectAllowed = "move";
    // A private type (not text/plain), so a drop on the search box types nothing.
    e.dataTransfer.setData("application/x-academy-student", label);
    setDragGhost(e, label);
    // Re-rendering the dragged element during dragstart can cancel the drag
    // in some browsers, so paint the "dragging" styles just after.
    window.setTimeout(() => {
      if (dragRef.current === item) setDrag(item);
    }, 0);
  };

  const endDrag = () => {
    dragRef.current = null;
    setDrag(null);
    setOverKey(null);
  };

  const handleDrop = (item: DragItem, target: DropTarget) => {
    if (target.kind === "new") {
      if (item.kind === "students") check(item.ids);
      return;
    }
    const family =
      target.kind === "family" ? families.find((f) => f.familyId === target.familyId) : undefined;

    if (item.kind === "students") {
      if (family) addToFamily(family, item.ids);
      else if (target.kind === "student") linkNew([...item.ids, target.id]);
      return;
    }

    // A child dragged out of their family.
    const name = nameOf(item.id);
    if (family) {
      const anchor = familyAnchor(family);
      if (!anchor) return;
      if (family.members.length + 1 > MAX_FAMILY) {
        toast.error(t("students.families.error.max"));
        return;
      }
      moveMember(
        item.id,
        [anchor],
        t("students.families.toast.moved", { name, family: nameOf(anchor) }),
      );
    } else if (target.kind === "student") {
      uncheck([target.id]);
      moveMember(
        item.id,
        [target.id],
        t("students.families.toast.linked", { names: joinNames([name, nameOf(target.id)], t) }),
      );
    }
  };

  // One set of handlers for every target; the element names itself in data-drop.
  const targetOf = (e: DragEvent) =>
    parseTargetKey((e.currentTarget as HTMLElement).dataset.drop);
  const accept = (e: DragEvent) => {
    const item = dragRef.current;
    const target = targetOf(e);
    if (!item || !target || !canDrop(item, target)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverKey(targetKey(target));
  };
  const dropHandlers: DropProps = {
    onDragEnter: accept,
    onDragOver: accept,
    onDragLeave: (e) => {
      // Moving onto a child element isn't leaving.
      const next = e.relatedTarget as Node | null;
      if (next && e.currentTarget.contains(next)) return;
      const key = (e.currentTarget as HTMLElement).dataset.drop;
      setOverKey((k) => (k === key ? null : k));
    },
    onDrop: (e) => {
      e.preventDefault();
      const item = dragRef.current;
      const target = targetOf(e);
      dragRef.current = null;
      setDrag(null);
      setOverKey(null);
      if (item && target && canDrop(item, target)) handleDrop(item, target);
    },
  };

  const onRowDragStart = (e: DragEvent, s: FamilyMember) => {
    // Dragging a checked row carries all the checked students.
    const ids =
      checked.length > 1 && checked.some((c) => c.id === s.id) ? checked.map((c) => c.id) : [s.id];
    beginDrag(
      e,
      { kind: "students", ids },
      ids.length > 1
        ? t("students.families.ghost.more", { name: s.fullName, count: ids.length - 1 })
        : s.fullName,
    );
  };

  const draggingLone = drag?.kind === "students" ? new Set(drag.ids) : NO_IDS;

  return (
    <div className={cn("space-y-6", checked.length > 0 && "max-lg:pb-32")}>
      <div className="space-y-2">
        <SummaryStrip
          items={[
            { label: t("students.families.stat.families"), value: families.length },
            {
              label: t("students.families.stat.children"),
              value: childrenInFamilies,
              sub: t("students.families.stat.children.sub", { count: lone.length }),
            },
            {
              label: t("students.families.stat.suggestions"),
              value: suggestions.length,
              sub:
                hiddenCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => writeDismissed([])}
                    className="font-medium text-sea-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {t("students.families.stat.suggestions.restore", { count: hiddenCount })}
                  </button>
                ) : (
                  t("students.families.stat.suggestions.sub")
                ),
            },
          ]}
        />
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info aria-hidden className="mt-px size-3.5 shrink-0" />
          <span>
            {t("students.families.explain")}{" "}
            <Link
              href="/settings"
              className="inline-flex items-center gap-0.5 font-medium text-sea-700 hover:underline"
            >
              {t("nav.settings")}
              <ArrowUpRight aria-hidden className="size-3 rtl:-scale-x-100" />
            </Link>
          </span>
        </p>
      </div>

      {(suggestions.length > 0 || progress) && (
        <FamilySuggestions
          suggestions={suggestions}
          progress={progress}
          onLink={linkSuggestion}
          onDismiss={dismissSuggestion}
          onLinkAll={linkAll}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start">
        <section aria-labelledby="families-list-title" className="min-w-0 space-y-3">
          <h2 id="families-list-title" className="text-sm font-semibold text-sea-900">
            {t("students.families.list.title")}{" "}
            <span className="font-normal text-muted-foreground tabular-nums">
              ({families.length})
            </span>
          </h2>
          {families.length === 0 ? (
            <p className="rounded-xl border border-dashed border-sea-300 bg-card p-6 text-center text-sm text-muted-foreground">
              {t("students.families.list.empty")}
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3">
              {families.map((f) => {
                const target: DropTarget = { kind: "family", familyId: f.familyId };
                return (
                  <FamilyCard
                    key={f.familyId}
                    family={f}
                    checkedCount={checked.length}
                    isOver={overKey === targetKey(target)}
                    canReceive={!!drag && canDrop(drag, target)}
                    draggingId={drag?.kind === "member" ? drag.id : null}
                    dropKey={targetKey(target)}
                    dropHandlers={dropHandlers}
                    onAddChecked={() =>
                      addToFamily(
                        f,
                        checked.map((c) => c.id),
                      )
                    }
                    onRemove={(m) => removeMember(f, m)}
                    onMemberDragStart={(e, m) =>
                      beginDrag(e, { kind: "member", id: m.id, familyId: f.familyId }, m.fullName)
                    }
                    onDragEnd={endDrag}
                  />
                );
              })}
            </div>
          )}
        </section>

        <FamilyStudentsPanel
          students={lone}
          checked={checked}
          overKey={overKey}
          dragging={draggingLone}
          dropHandlers={dropHandlers}
          newZoneCanReceive={!!drag && canDrop(drag, { kind: "new" })}
          onToggle={(id, on) => (on ? check([id]) : uncheck([id]))}
          onLinkChecked={() => linkNew(checked.map((c) => c.id))}
          onRowDragStart={onRowDragStart}
          onDragEnd={endDrag}
        />
      </div>

      {/* Phones / tablets: the "New family" zone may be scrolled away. */}
      {checked.length > 0 && (
        <div
          role="region"
          aria-label={t("students.families.bar.selected", { count: checked.length })}
          className={cn(
            "fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md transition-[inset-inline-start] duration-300 ease-out md:px-6 lg:hidden",
            sidebarCollapsed ? "md:start-16" : "md:start-64",
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <div className="min-w-0 flex-1 basis-48">
              <p className="text-sm font-medium text-sea-900">
                {t("students.families.bar.selected", { count: checked.length })}
              </p>
              <p className="text-xs text-muted-foreground">
                {checked.length === 1
                  ? t("students.families.bar.hintOne")
                  : t("students.families.bar.hintMany")}
              </p>
            </div>
            <div className="flex items-center gap-2 max-sm:w-full max-sm:[&>*]:flex-1">
              <Button type="button" variant="outline" size="sm" onClick={() => setCheckedOrder([])}>
                {t("common.clear")}
              </Button>
              {checked.length >= 2 && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => linkNew(checked.map((c) => c.id))}
                >
                  <Link2 className="size-4" />
                  {t("students.families.bar.link", { count: checked.length })}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
