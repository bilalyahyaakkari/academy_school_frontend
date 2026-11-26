"use client";

import { useState, useTransition } from "react";
import { Info, Loader2, PackageCheck, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn, todayIso } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import type { SupplierOrder } from "@/lib/api/types";
import { receiveSupplierOrder } from "@/lib/actions/supplier-orders";
import { compareSizes, normalizeSize } from "./uniforms-filters";

type Row = {
  size: string;
  ordered: number;
  /** Received so far, over every earlier delivery. */
  received: number;
  /** This delivery, as typed. */
  value: string;
  /** Typed in here: a size that wasn't ordered. */
  added?: boolean;
};

/** A typed quantity as a whole number ≥ 0 ("" / junk → 0). */
function qtyOf(value: string): number {
  const n = Math.floor(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

const inputId = (size: string) => `receive-qty-${encodeURIComponent(size)}`;

/**
 * «تسجيل استلام»: one delivery batch from the supplier, matched against the
 * order per size. Shows what's still missing, lets the admin add a size that
 * wasn't ordered, and previews the result before saving.
 */
export function SupplierReceiveDialog({
  order,
  onClose,
}: {
  order: SupplierOrder;
  onClose: () => void;
}) {
  const t = useT();
  const [rows, setRows] = useState<Row[]>(() =>
    [...order.reconciliation]
      .sort((a, b) => compareSizes(a.size, b.size))
      .map((r) => ({ size: r.size, ordered: r.ordered, received: r.received, value: "" })),
  );
  const [newSize, setNewSize] = useState("");
  const [focusSize, setFocusSize] = useState<string | null>(null);
  const [date, setDate] = useState(todayIso);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const results = rows.map((r) => {
    const batch = qtyOf(r.value);
    const after = r.received + batch;
    return {
      ...r,
      batch,
      after,
      missing: Math.max(0, r.ordered - after),
      extra: Math.max(0, after - r.ordered),
    };
  });
  const batchTotal = results.reduce((s, r) => s + r.batch, 0);
  const orderedTotal = results.reduce((s, r) => s + r.ordered, 0);
  const afterTotal = results.reduce((s, r) => s + r.after, 0);
  const missingRows = results.filter((r) => r.missing > 0);
  const extraRows = results.filter((r) => r.extra > 0);
  const anyMissingNow = rows.some((r) => r.ordered - r.received > 0);

  const setValue = (size: string, value: string) =>
    setRows((prev) => prev.map((r) => (r.size === size ? { ...r, value } : r)));

  const onAddSize = () => {
    const raw = newSize.trim();
    if (!raw) return;
    const size = normalizeSize(raw);
    setNewSize("");
    if (rows.some((r) => r.size === size)) {
      // Already listed: jump to it instead of adding it twice.
      document.getElementById(inputId(size))?.focus();
      return;
    }
    setFocusSize(size);
    setRows((prev) => [...prev, { size, ordered: 0, received: 0, value: "", added: true }]);
  };

  const onFillMissing = () =>
    setRows((prev) =>
      prev.map((r) => {
        const rest = Math.max(0, r.ordered - r.received);
        return rest > 0 ? { ...r, value: String(rest) } : r;
      }),
    );

  const onSave = () => {
    setError(null);
    const lines = results
      .filter((r) => r.batch > 0)
      .map((r) => ({ size: r.size, quantity: r.batch }));
    if (lines.length === 0) {
      setError(t("uniforms.receive.err.empty"));
      return;
    }
    startTransition(async () => {
      const res = await receiveSupplierOrder(order.id, { receivedAt: date, note, lines });
      if (res.success === false) {
        setError(res.error);
        return;
      }
      toast.success(
        batchTotal === 1
          ? t("uniforms.receive.toast.one")
          : t("uniforms.receive.toast", { count: batchTotal }),
      );
      onClose();
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>
            {t("uniforms.receive.title", { number: order.number })}
          </DialogTitle>
          <DialogDescription>{t("uniforms.receive.desc")}</DialogDescription>
        </DialogHeader>

        <p className="flex items-start gap-2 rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground">
          <Info className="mt-px size-3.5 shrink-0" aria-hidden />
          <span>{t("uniforms.receive.separation")}</span>
        </p>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium">{t("uniforms.receive.perSize")}</h3>
            {anyMissingNow && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-9 sm:h-7"
                onClick={onFillMissing}
              >
                {t("uniforms.receive.fillMissing")}
              </Button>
            )}
          </div>
          <ul className="mt-1 divide-y divide-border rounded-lg border border-border">
            {results.map((r) => {
              const stillMissing = Math.max(0, r.ordered - r.received);
              return (
                <li
                  key={r.size}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 p-2.5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Badge variant="outline" className="rounded-full px-2 font-semibold">
                        <bdi>{r.size}</bdi>
                      </Badge>
                      {r.ordered === 0 && (
                        <Badge variant="soft" className="rounded-full px-2 text-[10px]">
                          {t("uniforms.receive.notOrdered")}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 flex flex-wrap gap-x-2 text-xs text-muted-foreground tabular-nums">
                      <span>{t("uniforms.receive.ordered", { count: r.ordered })}</span>
                      <span>{t("uniforms.receive.receivedSoFar", { count: r.received })}</span>
                      {stillMissing > 0 && (
                        <span className="font-medium text-alert">
                          {t("uniforms.receive.stillMissing", { count: stillMissing })}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Input
                      id={inputId(r.size)}
                      type="number"
                      inputMode="numeric"
                      min={0}
                      max={10000}
                      step={1}
                      placeholder="0"
                      autoFocus={r.size === focusSize}
                      aria-label={t("uniforms.receive.thisBatch.aria", { size: r.size })}
                      value={r.value}
                      onChange={(e) => setValue(r.size, e.target.value)}
                      className="w-20 text-center tabular-nums"
                    />
                    {r.added && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="sm:size-8"
                        aria-label={t("uniforms.receive.removeSize", { size: r.size })}
                        onClick={() =>
                          setRows((prev) => prev.filter((x) => x.size !== r.size))
                        }
                      >
                        <X />
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="mt-1 text-end text-xs text-muted-foreground">
            {t("uniforms.receive.thisBatch.hint")}
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="receive-new-size">{t("uniforms.receive.addSize")}</Label>
          <div className="flex gap-2">
            <Input
              id="receive-new-size"
              value={newSize}
              maxLength={20}
              placeholder={t("uniforms.receive.addSize.placeholder")}
              onChange={(e) => setNewSize(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onAddSize();
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={onAddSize}
              disabled={!newSize.trim()}
              className="shrink-0"
            >
              <Plus />
              {t("uniforms.receive.addSize.btn")}
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="receive-date">{t("uniforms.receive.date")}</Label>
            <Input
              id="receive-date"
              type="date"
              value={date}
              max={todayIso()}
              required
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="receive-note">{t("uniforms.receive.note")}</Label>
            <Input
              id="receive-note"
              value={note}
              maxLength={300}
              placeholder={t("uniforms.receive.note.placeholder")}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <div
          role="status"
          aria-live="polite"
          className="space-y-1 rounded-lg border border-border bg-muted/40 p-3 text-sm"
        >
          <p className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="font-medium">{t("uniforms.receive.preview.title")}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {t("uniforms.receive.preview.totals", {
                after: afterTotal,
                ordered: orderedTotal,
              })}
            </span>
          </p>
          {missingRows.length === 0 && extraRows.length === 0 ? (
            <p className="text-sea-700 dark:text-sea-300">{t("uniforms.receive.preview.allIn")}</p>
          ) : (
            <p className="flex flex-wrap gap-x-1.5 tabular-nums">
              {[
                ...missingRows.map((r) => ({
                  key: `m-${r.size}`,
                  text: t("uniforms.receive.preview.missing", { qty: r.missing, size: r.size }),
                  alert: true,
                })),
                ...extraRows.map((r) => ({
                  key: `e-${r.size}`,
                  text: t("uniforms.receive.preview.extra", { qty: r.extra, size: r.size }),
                  alert: false,
                })),
              ].map((p, i) => (
                <span key={p.key} className={cn(p.alert ? "font-medium text-alert" : "text-sea-800 dark:text-sea-300")}>
                  {i > 0 && <span className="me-1.5 text-muted-foreground">·</span>}
                  {p.text}
                </span>
              ))}
            </p>
          )}
          {afterTotal === orderedTotal && (missingRows.length > 0 || extraRows.length > 0) && (
            <p className="text-xs text-muted-foreground">{t("uniforms.receive.preview.totalMatches")}</p>
          )}
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button onClick={onSave} disabled={pending || batchTotal === 0 || !date}>
            {pending ? <Loader2 className="animate-spin" /> : <PackageCheck />}
            {t("uniforms.receive.save", { count: batchTotal })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
