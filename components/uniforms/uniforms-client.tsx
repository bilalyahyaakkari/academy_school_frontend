"use client";

import type { ReactNode } from "react";

import { useState, useTransition } from "react";
import { Loader2, RotateCcw, Shirt } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  toggleUniformPaid,
  toggleUniformReceived,
  deleteUniform,
  bulkDeleteUniforms,
} from "@/lib/actions/uniforms";
import { formatCurrency } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import type { UniformWithStudent } from "@/lib/api/types";
import { UniformDialog } from "./uniform-dialog";
import { UniformAddPaymentDialog } from "./uniform-add-payment-dialog";
import { useReceiptSender } from "@/components/payments/receipt-dialog";
import {
  NO_FILTERS,
  UNIFORM_TABS,
  filterBySizeAndSearch,
  filterUniforms,
  keepVisible,
  matchesTab,
  summarize,
  type UniformFilters,
  type UniformTab,
} from "./uniforms-filters";
import { UniformsSummaryStrip } from "./uniforms-summary";
import { UniformsToolbar } from "./uniforms-toolbar";
import { UniformsList } from "./uniforms-list";
import type { RowHandlers } from "./uniform-row-parts";

type StudentOption = { id: string; fullName: string };

export function UniformsClient({
  uniforms,
  students,
  knownSizes,
  headerActions,
}: {
  uniforms: UniformWithStudent[];
  students: StudentOption[];
  knownSizes: string[];
  /** The page's main buttons; shown inside the summary card. */
  headerActions?: ReactNode;
}) {
  const t = useT();
  const [filters, setFilters] = useState<UniformFilters>(NO_FILTERS);
  const [editing, setEditing] = useState<UniformWithStudent | null>(null);
  const [recording, setRecording] = useState<UniformWithStudent | null>(null);
  // Kept after the dialog closes so its text doesn't blank out mid-animation.
  const [undoing, setUndoing] = useState<UniformWithStudent | null>(null);
  const [undoOpen, setUndoOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkPending, startBulkTransition] = useTransition();
  const [, startTransition] = useTransition();
  const receipts = useReceiptSender();

  const summary = summarize(uniforms);

  // Size + search narrow the set; the tabs (and their counts) split it further.
  const scoped = filterBySizeAndSearch(uniforms, filters.size, filters.q);
  const filtered = scoped.filter((u) => matchesTab(u, filters.tab));
  const counts = Object.fromEntries(
    UNIFORM_TABS.map((tab) => [tab, scoped.filter((u) => matchesTab(u, tab)).length]),
  ) as Record<UniformTab, number>;

  // Selection only ever covers orders that exist and are on screen: hidden
  // rows are dropped when a filter changes, and orders that vanished
  // (deleted, or gone after a refresh) are ignored here — so "Delete selected"
  // can never hit a row the admin can't see.
  const visibleSelected = keepVisible(selected, filtered);
  const selectedCount = visibleSelected.size;

  const updateFilters = (patch: Partial<UniformFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    setSelected((prev) => keepVisible(prev, filterUniforms(uniforms, next)));
  };

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((u) => visibleSelected.has(u.id));
  const someFilteredSelected = !allFilteredSelected && selectedCount > 0;

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = keepVisible(prev, filtered);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllFiltered = () => {
    setSelected(
      allFilteredSelected ? new Set() : new Set(filtered.map((u) => u.id)),
    );
  };

  const onBulkDelete = () => {
    const ids = Array.from(visibleSelected);
    startBulkTransition(async () => {
      const res = await bulkDeleteUniforms(ids);
      if (res.success === false) {
        toast.error(res.error);
        return;
      }
      toast.success(
        t("uniforms.bulkDelete.toast.deleted", { count: res.deleted }),
      );
      setSelected(new Set());
      setBulkConfirmOpen(false);
    });
  };

  const onTogglePaid = (u: UniformWithStudent) => {
    setPendingId(u.id);
    startTransition(async () => {
      const res = await toggleUniformPaid(u.id);
      setPendingId(null);
      if (res.success === false) toast.error(res.error);
      else if (u.isPaid) toast.success(t("uniforms.toast.markedUnpaid"));
      else
        // Marked paid: offer a receipt. The toast button is a user gesture,
        // and the WhatsApp link itself is clicked in the receipt dialog.
        toast.success(t("uniforms.toast.markedPaid"), {
          action: {
            label: t("payments.receipt.send"),
            onClick: () => receipts.send("UNIFORM", u.id),
          },
        });
    });
  };

  // Undoing a paid order erases the money recorded on it, so ask first.
  const onUndoPaid = (u: UniformWithStudent) => {
    if (u.paidAmount > 0) {
      setUndoing(u);
      setUndoOpen(true);
    } else {
      onTogglePaid(u);
    }
  };

  const onToggleReceived = (u: UniformWithStudent) => {
    setPendingId(u.id);
    startTransition(async () => {
      const res = await toggleUniformReceived(u.id);
      setPendingId(null);
      if (res.success === false) toast.error(res.error);
      else
        toast.success(
          u.isReceived
            ? t("uniforms.toast.markedNotReceived")
            : t("uniforms.toast.markedReceived"),
        );
    });
  };

  const onDelete = (u: UniformWithStudent) => {
    if (!confirm(t("uniforms.confirmDelete", { name: u.student.fullName }))) return;
    setPendingId(u.id);
    startTransition(async () => {
      const res = await deleteUniform(u.id);
      setPendingId(null);
      if (res.success === false) {
        toast.error(res.error);
        return;
      }
      setSelected((prev) => {
        if (!prev.has(u.id)) return prev;
        const next = new Set(prev);
        next.delete(u.id);
        return next;
      });
      toast.success(t("uniforms.toast.deleted"));
    });
  };

  const handlers: RowHandlers = {
    pendingId: pendingId ?? receipts.loadingId,
    onEdit: setEditing,
    onRecordPayment: setRecording,
    onToggleReceived,
    onMarkPaid: onTogglePaid,
    onUndoPaid,
    onSendReceipt: (u) => receipts.send("UNIFORM", u.id),
    onDelete,
  };

  const hasFilters =
    filters.tab !== "all" || filters.size !== null || filters.q !== "";

  return (
    <>
      {uniforms.length > 0 ? (
        <UniformsSummaryStrip
          summary={summary}
          activeSize={filters.size}
          onSizeChange={(size) => updateFilters({ size })}
          actions={headerActions}
        />
      ) : (
        headerActions && (
          <div className="flex flex-wrap items-center justify-end gap-2">{headerActions}</div>
        )
      )}

      <div className="space-y-3">
        {uniforms.length > 0 && (
          <UniformsToolbar
            q={filters.q}
            onSearch={(q) => updateFilters({ q })}
            tab={filters.tab}
            onTab={(tab) => updateFilters({ tab })}
            counts={counts}
            size={filters.size}
            onClearSize={() => updateFilters({ size: null })}
            selectedCount={selectedCount}
            onClearSelection={() => setSelected(new Set())}
            onBulkDelete={() => setBulkConfirmOpen(true)}
          />
        )}

        {filtered.length === 0 ? (
          <Card className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
            <Shirt className="size-6 text-muted-foreground" aria-hidden />
            <h3 className="font-medium">
              {uniforms.length === 0
                ? t("uniforms.empty.title")
                : t("uniforms.empty.title.filtered")}
            </h3>
            <p className="text-sm text-muted-foreground">
              {uniforms.length === 0
                ? t("uniforms.empty.sub")
                : t("uniforms.empty.sub.filtered")}
            </p>
            {uniforms.length > 0 && hasFilters && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 h-10 sm:h-8"
                onClick={() => updateFilters(NO_FILTERS)}
              >
                {t("uniforms.empty.clearFilters")}
              </Button>
            )}
          </Card>
        ) : (
          <UniformsList
            rows={filtered}
            selected={visibleSelected}
            allSelected={allFilteredSelected}
            someSelected={someFilteredSelected}
            onToggleOne={toggleOne}
            onToggleAll={toggleAllFiltered}
            handlers={handlers}
          />
        )}
      </div>

      {editing && (
        <UniformDialog
          students={students}
          knownSizes={knownSizes}
          onClose={() => setEditing(null)}
          mode="edit"
          uniform={editing}
        />
      )}
      {recording && (
        <UniformAddPaymentDialog
          uniformId={recording.id}
          studentName={recording.student.fullName}
          total={recording.price}
          alreadyPaid={recording.paidAmount}
          onClose={() => setRecording(null)}
        />
      )}

      {receipts.dialog}

      <Dialog open={undoOpen} onOpenChange={setUndoOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("uniforms.undo.title")}</DialogTitle>
            <DialogDescription>
              {undoing &&
                t("uniforms.undo.desc", {
                  amount: formatCurrency(undoing.paidAmount),
                  name: undoing.student.fullName,
                })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUndoOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setUndoOpen(false);
                if (undoing) onTogglePaid(undoing);
              }}
            >
              <RotateCcw className="size-4" />
              {undoing &&
                t("uniforms.undo.confirm", {
                  amount: formatCurrency(undoing.paidAmount),
                })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkConfirmOpen} onOpenChange={setBulkConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("uniforms.bulkDelete.confirm.title", {
                count: selectedCount,
              })}
            </DialogTitle>
            <DialogDescription>
              {t("uniforms.bulkDelete.confirm.desc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setBulkConfirmOpen(false)}
              disabled={bulkPending}
            >
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={onBulkDelete}
              disabled={bulkPending}
            >
              {bulkPending && <Loader2 className="size-4 animate-spin" />}
              {t("uniforms.bulkDelete.confirm.btn", { count: selectedCount })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
