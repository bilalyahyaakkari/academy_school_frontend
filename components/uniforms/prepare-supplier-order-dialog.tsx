"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ClipboardList, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import type { SupplierOrderPreview } from "@/lib/api/types";
import { createSupplierOrder } from "@/lib/actions/supplier-orders";
import { compareSizes } from "./uniforms-filters";

type Mode = "exclude" | "reorder";

/** preview.lines minus the requests that are left out (sizes come grouped). */
function withoutAlreadyOrdered(
  lines: SupplierOrderPreview["lines"],
  already: SupplierOrderPreview["alreadyOrdered"],
): SupplierOrderPreview["lines"] {
  const qty = new Map(lines.map((l) => [l.size, l.quantity]));
  for (const a of already) {
    if (qty.has(a.size)) qty.set(a.size, Math.max(0, qty.get(a.size)! - 1));
  }
  return Array.from(qty, ([size, quantity]) => ({ size, quantity })).filter((l) => l.quantity > 0);
}

/**
 * «تجهيز طلبية للمورّد»: quantities per size for the selected requests, a
 * warning for requests already in an open order, an optional note, then a
 * DRAFT order is created and opened.
 */
export function PrepareSupplierOrderDialog({
  uniformIds,
  preview: initialPreview,
  onClose,
  onCreated,
}: {
  uniformIds: string[];
  preview: SupplierOrderPreview;
  onClose: () => void;
  /** Called once the draft exists (e.g. to clear the selection). */
  onCreated?: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const [preview, setPreview] = useState(initialPreview);
  const [mode, setMode] = useState<Mode>("exclude");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const already = preview.alreadyOrdered;
  const alreadyIds = new Set(already.map((a) => a.uniformId));
  const excluding = already.length > 0 && mode === "exclude";
  const ids = excluding ? uniformIds.filter((id) => !alreadyIds.has(id)) : uniformIds;
  const lines = (excluding ? withoutAlreadyOrdered(preview.lines, already) : preview.lines)
    .slice()
    .sort((a, b) => compareSizes(a.size, b.size));
  const total = lines.reduce((sum, l) => sum + l.quantity, 0);
  const nothingLeft = ids.length === 0 || total === 0;

  const onConfirm = () => {
    setError(null);
    startTransition(async () => {
      const res = await createSupplierOrder({
        uniformIds: ids,
        notes,
        allowReorder: already.length > 0 && mode === "reorder",
      });
      if (res.success === false) {
        if (res.alreadyOrdered && res.alreadyOrdered.length > 0) {
          // Someone else ordered some of them meanwhile: show who, ask again.
          setPreview((p) => ({ ...p, alreadyOrdered: res.alreadyOrdered! }));
          setMode("exclude");
        }
        setError(res.error);
        return;
      }
      toast.success(t("uniforms.supplier.prepare.toast", { number: res.number }));
      onCreated?.();
      router.push(`/uniforms/orders/${res.id}`);
    });
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !pending && onClose()}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{t("uniforms.supplier.prepare.title")}</DialogTitle>
          <DialogDescription>
            {t("uniforms.supplier.prepare.desc", { count: uniformIds.length })}
          </DialogDescription>
        </DialogHeader>

        {already.length > 0 && (
          <div
            role="alert"
            className="space-y-3 rounded-lg border border-sea-300 bg-sea-100/60 p-3 dark:bg-sea-900/40"
          >
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-sea-800" aria-hidden />
              <p className="text-sm font-medium text-sea-900 dark:text-sea-100">
                {already.length === 1
                  ? t("uniforms.supplier.prepare.already.one")
                  : t("uniforms.supplier.prepare.already", { count: already.length })}
              </p>
            </div>
            <ul className="max-h-36 space-y-1 overflow-y-auto ps-6 text-sm">
              {already.map((a) => (
                <li key={a.uniformId} className="break-words">
                  {t("uniforms.supplier.prepare.alreadyItem", {
                    name: a.studentName,
                    size: a.size,
                    number: a.orderNumber,
                  })}
                </li>
              ))}
            </ul>
            <fieldset className="space-y-2">
              <legend className="sr-only">{t("uniforms.supplier.prepare.choice")}</legend>
              <ChoiceOption
                name="reorder-mode"
                checked={mode === "exclude"}
                onSelect={() => setMode("exclude")}
                title={t("uniforms.supplier.prepare.exclude")}
                hint={t("uniforms.supplier.prepare.exclude.hint")}
              />
              <ChoiceOption
                name="reorder-mode"
                checked={mode === "reorder"}
                onSelect={() => setMode("reorder")}
                title={t("uniforms.supplier.prepare.reorder")}
                hint={t("uniforms.supplier.prepare.reorder.hint")}
              />
            </fieldset>
          </div>
        )}

        {nothingLeft ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            {t("uniforms.supplier.prepare.nothingLeft")}
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2 text-start font-medium">
                    {t("uniforms.table.size")}
                  </th>
                  <th scope="col" className="px-3 py-2 text-end font-medium">
                    {t("uniforms.orders.col.quantity")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.size} className="border-t border-border">
                    <td className="px-3 py-2 font-semibold">
                      <bdi>{l.size}</bdi>
                    </td>
                    <td className="px-3 py-2 text-end tabular-nums">{l.quantity}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-muted/30 font-semibold">
                  <td className="px-3 py-2">{t("uniforms.orders.total")}</td>
                  <td className="px-3 py-2 text-end tabular-nums">{total}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="supplier-order-notes">{t("uniforms.supplier.prepare.notes")}</Label>
          <Textarea
            id="supplier-order-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            rows={2}
            placeholder={t("uniforms.supplier.prepare.notes.placeholder")}
          />
          <p className="text-xs text-muted-foreground">{t("uniforms.supplier.prepare.draftHint")}</p>
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
          <Button onClick={onConfirm} disabled={pending || nothingLeft}>
            {pending ? <Loader2 className="animate-spin" /> : <ClipboardList />}
            {t("uniforms.supplier.prepare.confirm", { count: total })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChoiceOption({
  name,
  checked,
  onSelect,
  title,
  hint,
}: {
  name: string;
  checked: boolean;
  onSelect: () => void;
  title: string;
  hint: string;
}) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-2.5 rounded-md border bg-card p-2.5 transition-colors",
        checked ? "border-primary" : "border-border hover:bg-accent/50",
      )}
    >
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onSelect}
        className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </label>
  );
}
