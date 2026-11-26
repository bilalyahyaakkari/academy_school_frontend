"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  linkSibling,
  listSiblingCandidates,
  type SiblingCandidate,
} from "@/lib/actions/students";
import { normalizeArabic } from "@/lib/arabic";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import type { SiblingSuggestion } from "@/lib/api/types";
import { toast } from "sonner";
import { Loader2, Phone, Plus, Search } from "lucide-react";

/** Rows shown before the admin types anything (the list can be long). */
const MAX_ROWS = 60;

/**
 * "Link sibling": students with the same parent phone first (one click each),
 * then every other student, searchable by name or phone.
 */
export function LinkSiblingDialog({
  studentId,
  studentName,
  excludeIds,
  suggestions,
  onClose,
}: {
  studentId: string;
  studentName: string;
  /** This student and the siblings already linked. */
  excludeIds: string[];
  suggestions: SiblingSuggestion[];
  onClose: () => void;
}) {
  const t = useT();
  const [candidates, setCandidates] = useState<SiblingCandidate[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    listSiblingCandidates().then((res) => {
      if (cancelled) return;
      if (res.success) setCandidates(res.students);
      else setLoadError(res.error);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const excluded = useMemo(() => new Set(excludeIds), [excludeIds]);
  const shownSuggestions = suggestions.filter((s) => !excluded.has(s.id));

  const filtered = useMemo(() => {
    if (!candidates) return [];
    const needle = normalizeArabic(q);
    const digits = q.replace(/\D/g, "");
    return candidates
      .filter((c) => !excluded.has(c.id))
      .filter((c) => {
        if (!needle) return true;
        if (normalizeArabic(c.fullName).includes(needle)) return true;
        return digits.length >= 3 && (c.phoneNumber ?? "").replace(/\D/g, "").includes(digits);
      })
      // Current students first, then those who left; alphabetical within each.
      .sort(
        (a, b) =>
          Number(a.archived) - Number(b.archived) || a.fullName.localeCompare(b.fullName),
      );
  }, [candidates, excluded, q]);

  const onPick = (sibling: { id: string; fullName: string }) => {
    setPendingId(sibling.id);
    startTransition(async () => {
      const res = await linkSibling(studentId, sibling.id);
      setPendingId(null);
      if (res.success === false) {
        toast.error(res.error);
        return;
      }
      toast.success(t("students.siblings.toast.linked", { name: sibling.fullName }));
      onClose();
    });
  };

  const rows = filtered.slice(0, MAX_ROWS);

  return (
    <Dialog open onOpenChange={(o) => !o && !pending && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("students.siblings.dialog.title", { name: studentName })}</DialogTitle>
          <DialogDescription>{t("students.siblings.dialog.desc")}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {shownSuggestions.length > 0 && (
            <section className="space-y-2">
              <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Phone aria-hidden className="size-3.5" />
                {t("students.siblings.suggestions")}
              </h3>
              <ul className="space-y-1.5">
                {shownSuggestions.map((s) => (
                  <li key={s.id}>
                    <PickRow
                      name={s.fullName}
                      group={s.group?.name}
                      phone={s.phoneNumber}
                      archived={s.archived}
                      highlighted
                      pending={pendingId === s.id}
                      disabled={pending}
                      onPick={() => onPick(s)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("students.siblings.all")}
            </h3>
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                type="search"
                autoFocus
                aria-label={t("students.siblings.search.label")}
                placeholder={t("students.siblings.search.placeholder")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-10 ps-9 sm:h-9"
              />
            </div>

            <div className="max-h-[40dvh] min-h-24 overflow-y-auto rounded-lg border border-border">
              {loadError ? (
                <p className="p-4 text-sm text-alert">{loadError}</p>
              ) : candidates === null ? (
                <p className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  {t("common.loading")}
                </p>
              ) : rows.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">
                  {t("students.siblings.noMatches")}
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {rows.map((c) => (
                    <li key={c.id}>
                      <PickRow
                        name={c.fullName}
                        group={c.group?.name}
                        phone={c.phoneNumber}
                        archived={c.archived}
                        hasFamily={!!c.familyId}
                        pending={pendingId === c.id}
                        disabled={pending}
                        onPick={() => onPick(c)}
                        flat
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {filtered.length > rows.length && (
              <p className="text-xs text-muted-foreground">
                {t("students.siblings.more", { shown: rows.length, total: filtered.length })}
              </p>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PickRow({
  name,
  group,
  phone,
  archived,
  hasFamily,
  highlighted,
  flat,
  pending,
  disabled,
  onPick,
}: {
  name: string;
  group?: string;
  phone: string | null;
  archived: boolean;
  hasFamily?: boolean;
  highlighted?: boolean;
  flat?: boolean;
  pending: boolean;
  disabled: boolean;
  onPick: () => void;
}) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onPick}
      disabled={disabled}
      title={t("students.siblings.pick", { name })}
      className={cn(
        "flex w-full min-h-12 items-center gap-3 px-3 py-2 text-start text-sm transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:opacity-60",
        flat ? "hover:bg-muted/60" : "rounded-lg border",
        highlighted && "border-sea-300 bg-sea-100/50 hover:bg-sea-100",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-2">
          <span className="truncate font-medium">{name}</span>
          {archived && (
            <Badge variant="soft" className="shrink-0 rounded-full px-2 text-[10px]">
              {t("students.badge.left")}
            </Badge>
          )}
        </span>
        <span className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
          {group && <span>{group}</span>}
          {phone && <span dir="ltr">{phone}</span>}
        </span>
        {hasFamily && (
          <span className="block text-xs text-sea-700">{t("students.siblings.hasFamily")}</span>
        )}
      </span>
      <span
        aria-hidden
        className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"
      >
        {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
      </span>
    </button>
  );
}
