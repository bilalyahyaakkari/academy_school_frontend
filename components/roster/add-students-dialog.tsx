"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { addStudentsToMonth } from "@/lib/actions/roster";
import type { RosterCandidate } from "@/lib/api/types";
import { toast } from "sonner";
import { useLocale, useT } from "@/lib/i18n/client";
import { normalizeArabic } from "@/lib/arabic";
import { Loader2, UserPlus } from "lucide-react";

/**
 * Adds students to one month — new joiners, and students who left earlier and
 * are coming back. Anyone returning is automatically un-archived.
 */
export function AddStudentsDialog({
  year,
  month,
  monthName,
  candidates,
  variant = "default",
}: {
  year: number;
  month: number;
  monthName: string;
  candidates: RosterCandidate[];
  variant?: "default" | "outline";
}) {
  const t = useT();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pending, start] = useTransition();

  const filtered = useMemo(() => {
    const q = normalizeArabic(query);
    if (!q) return candidates;
    return candidates.filter((c) => normalizeArabic(c.fullName).includes(q));
  }, [candidates, query]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSubmit = () => {
    const ids = Array.from(selected);
    start(async () => {
      const res = await addStudentsToMonth(year, month, ids);
      if (res.success === false) {
        toast.error(res.error);
        return;
      }
      const added = res.data?.added ?? 0;
      const restored = res.data?.restored ?? 0;
      // The backend only reports how many were added, not who. Anyone already
      // in the month is skipped, so names are only safe when every pick went in.
      if (added === 0) {
        toast.info(t("payments.roster.added.none", { month: monthName }));
      } else if (added < ids.length) {
        toast.success(
          t("payments.roster.added.partial", {
            added,
            selected: ids.length,
            month: monthName,
          }),
        );
      } else if (added === 1) {
        const name = candidates.find((c) => c.id === ids[0])?.fullName ?? "";
        toast.success(t("roster.toast.added.one", { name, month: monthName }));
      } else if (added <= 3) {
        const names = ids
          .map((id) => candidates.find((c) => c.id === id)?.fullName)
          .filter(Boolean)
          .join(locale === "ar" ? "، " : ", ");
        toast.success(t("payments.roster.added.names", { names, month: monthName }));
      } else {
        toast.success(t("roster.toast.added", { count: added, month: monthName }));
      }
      if (restored > 0) {
        toast.info(t("payments.roster.restored", { count: restored }));
      }
      setSelected(new Set());
      setQuery("");
      setOpen(false);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) {
          setSelected(new Set());
          setQuery("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant={variant}>
          <UserPlus className="size-4" />
          {t("roster.action.add")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("roster.add.title", { month: monthName })}</DialogTitle>
          <DialogDescription>{t("roster.add.desc")}</DialogDescription>
        </DialogHeader>

        {candidates.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            {t("roster.add.empty")}
          </p>
        ) : (
          <>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("roster.add.search")}
            />
            <div className="max-h-72 space-y-1 overflow-y-auto rounded-md border border-border p-1">
              {filtered.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/60"
                >
                  <Checkbox
                    checked={selected.has(c.id)}
                    onCheckedChange={() => toggle(c.id)}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {c.fullName}
                  </span>
                  {c.group && (
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {c.group.name}
                    </span>
                  )}
                  {c.archived && (
                    <Badge variant="soft" className="shrink-0">
                      {t("roster.add.returning")}
                    </Badge>
                  )}
                </label>
              ))}
            </div>
          </>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button onClick={onSubmit} disabled={pending || selected.size === 0}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {selected.size === 1
              ? t("roster.add.submit.one")
              : t("roster.add.submit", { count: selected.size })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
