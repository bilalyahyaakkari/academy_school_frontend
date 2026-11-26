"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { addGuest, loadGuestCandidates } from "@/lib/actions/attendance";
import type { AttendanceChecklist, GuestCandidate } from "@/lib/api/types";
import { normalizeArabic } from "@/lib/arabic";
import { useT } from "@/lib/i18n/client";
import { toast } from "sonner";
import { Loader2, Search, UserPlus } from "lucide-react";

/** Name (Arabic-insensitive) or phone digits. */
function matches(c: GuestCandidate, query: string): boolean {
  const q = normalizeArabic(query);
  if (!q) return true;
  if (normalizeArabic(c.fullName).includes(q)) return true;
  const digits = query.replace(/\D/g, "");
  return digits.length >= 2 && (c.phoneNumber ?? "").replace(/\D/g, "").includes(digits);
}

/**
 * «Add guest player»: a searchable list of current players from other groups.
 * Picking one adds them to this session only (present), creating the session
 * if it hadn't been saved yet.
 */
export function AddGuestButton({
  groupId,
  originalDate,
  disabled,
  onAdded,
}: {
  groupId: string;
  /** The session's original day (YYYY-MM-DD). */
  originalDate: string;
  disabled?: boolean;
  /** Gets the updated checklist (with the new guest). */
  onAdded: (checklist: AttendanceChecklist, studentId: string) => void;
}) {
  const t = useT();
  const searchId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<GuestCandidate[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [loading, startLoad] = useTransition();
  const [, startAdd] = useTransition();

  const load = () => {
    setLoadError(null);
    startLoad(async () => {
      const res = await loadGuestCandidates(groupId, originalDate);
      if (res.success === false) {
        setLoadError(res.error);
        setCandidates([]);
        return;
      }
      setCandidates(res.data ?? []);
    });
  };

  const onOpenChange = (o: boolean) => {
    if (addingId) return;
    setOpen(o);
    if (o) {
      setQuery("");
      setCandidates(null);
      load();
    }
  };

  const shown = useMemo(
    () => (candidates ?? []).filter((c) => matches(c, query)),
    [candidates, query],
  );

  const pick = (c: GuestCandidate) => {
    setAddingId(c.id);
    startAdd(async () => {
      const res = await addGuest(groupId, originalDate, c.id);
      setAddingId(null);
      if (res.success === false || !res.data) {
        // 409s ("already on the list" / "already a guest") come through here.
        toast.error(res.success === false ? res.error : t("attendance.error.addGuest"));
        return;
      }
      toast.success(t("attendance.guest.added", { name: c.fullName }));
      onAdded(res.data, c.id);
      setOpen(false);
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onOpenChange(true)}
        disabled={disabled}
      >
        <UserPlus />
        {t("attendance.guest.add")}
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[88dvh] flex-col gap-3 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>{t("attendance.guest.title")}</DialogTitle>
            <DialogDescription>{t("attendance.guest.desc")}</DialogDescription>
          </DialogHeader>

          <div className="space-y-1.5">
            <Label htmlFor={searchId} className="sr-only">
              {t("attendance.guest.search")}
            </Label>
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                id={searchId}
                type="search"
                autoFocus
                autoComplete="off"
                value={query}
                placeholder={t("attendance.guest.search")}
                onChange={(e) => setQuery(e.target.value)}
                className="ps-9"
              />
            </div>
          </div>

          <p aria-live="polite" className="sr-only">
            {candidates && !loading ? t("attendance.guest.results", { count: shown.length }) : ""}
          </p>

          <div className="-mx-4 min-h-0 flex-1 overflow-y-auto border-t border-border sm:-mx-6">
            {loading || candidates === null ? (
              <p className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
                <Loader2 aria-hidden className="size-4 animate-spin" />
                {t("common.loading")}
              </p>
            ) : loadError ? (
              <p role="alert" className="px-4 py-8 text-center text-sm text-destructive sm:px-6">
                {loadError}
              </p>
            ) : candidates.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">
                {t("attendance.guest.empty")}
              </p>
            ) : shown.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground sm:px-6">
                {t("attendance.guest.noMatch", { q: query.trim() })}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {shown.map((c) => {
                  const adding = addingId === c.id;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => pick(c)}
                        disabled={!!addingId}
                        className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-start transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none disabled:opacity-60 sm:px-6"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{c.fullName}</span>
                          {c.phoneNumber && (
                            <span className="block text-xs text-muted-foreground">
                              <span dir="ltr">{c.phoneNumber}</span>
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 rounded-md bg-sea-100 px-2 py-0.5 text-xs font-medium text-sea-900">
                          {c.group?.name ?? t("attendance.guest.noGroup")}
                        </span>
                        {adding ? (
                          <Loader2 aria-hidden className="size-4 shrink-0 animate-spin text-muted-foreground" />
                        ) : (
                          <UserPlus aria-hidden className="size-4 shrink-0 text-sea-700" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
