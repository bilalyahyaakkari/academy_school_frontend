"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { normalizeArabic } from "@/lib/arabic";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UniformDialog } from "./uniform-dialog";
import { UniformAddPaymentDialog } from "./uniform-add-payment-dialog";
import {
  toggleUniformPaid,
  toggleUniformReceived,
  deleteUniform,
  bulkDeleteUniforms,
} from "@/lib/actions/uniforms";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Plus,
  Check,
  RotateCcw,
  Pencil,
  Trash2,
  Loader2,
  Shirt,
  Upload,
  Users,
  PackageCheck,
  Package,
  Search,
  X,
  Wallet,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import type { UniformWithStudent } from "@/lib/api/types";

type StudentOption = { id: string; fullName: string };

export function UniformsClient({
  uniforms,
  students,
}: {
  uniforms: UniformWithStudent[];
  students: StudentOption[];
}) {
  const t = useT();
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<UniformWithStudent | null>(null);
  const [recording, setRecording] = useState<UniformWithStudent | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);
  const [bulkPending, startBulkTransition] = useTransition();
  const [, startTransition] = useTransition();

  // Arabic-normalized substring search across student name + size + notes.
  const normalizedQ = normalizeArabic(q.trim());
  const filtered = uniforms.filter((u) => {
    if (filter === "paid" && !u.isPaid) return false;
    if (filter === "unpaid" && u.isPaid) return false;
    if (!normalizedQ) return true;
    const haystack = normalizeArabic(
      `${u.student.fullName} ${u.size} ${u.notes ?? ""}`,
    );
    return haystack.includes(normalizedQ);
  });

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((u) => selected.has(u.id));
  const someFilteredSelected =
    !allFilteredSelected && filtered.some((u) => selected.has(u.id));

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllFiltered = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        for (const u of filtered) next.delete(u.id);
      } else {
        for (const u of filtered) next.add(u.id);
      }
      return next;
    });
  };

  const onBulkDelete = () => {
    const ids = Array.from(selected);
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

  const knownSizes = Array.from(
    new Set(uniforms.map((u) => u.size).filter((s): s is string => !!s)),
  ).sort();

  const onTogglePaid = (u: UniformWithStudent) => {
    setPendingId(u.id);
    startTransition(async () => {
      const res = await toggleUniformPaid(u.id);
      setPendingId(null);
      if (res.success === false) toast.error(res.error);
      else
        toast.success(
          u.isPaid
            ? t("uniforms.toast.markedUnpaid")
            : t("uniforms.toast.markedPaid"),
        );
    });
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
      if (res.success === false) toast.error(res.error);
      else toast.success(t("uniforms.toast.deleted"));
    });
  };

  return (
    <>
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder={t("uniforms.search.placeholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="ps-9 pe-9"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            aria-label={t("common.clear")}
            className="absolute end-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-md border border-border bg-muted/30 p-1 text-sm">
          {(["all", "unpaid", "paid"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={
                filter === f
                  ? "rounded px-3 py-1 bg-background font-medium shadow-sm"
                  : "rounded px-3 py-1 text-muted-foreground hover:text-foreground"
              }
            >
              {f === "all"
                ? t("uniforms.filter.all")
                : f === "paid"
                  ? t("uniforms.filter.paid")
                  : t("uniforms.filter.unpaid")}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/uniforms/bulk">
              <Users className="size-4" />
              {t("uniforms.action.bulk")}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/uniforms/import">
              <Upload className="size-4" />
              {t("uniforms.action.import")}
            </Link>
          </Button>
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            {t("uniforms.action.new")}
          </Button>
        </div>
      </div>

      {/* Bulk action toolbar — appears when at least one order is selected */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-2.5 text-sm">
          <span className="flex items-center gap-2 font-medium">
            <span className="grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {selected.size}
            </span>
            <span>
              {t("uniforms.bulkDelete.selected", { count: selected.size })}
            </span>
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelected(new Set())}
            >
              {t("common.clear")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkConfirmOpen(true)}
            >
              <Trash2 className="size-4" />
              {t("uniforms.bulkDelete.btn")}
            </Button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <Shirt className="size-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold">
            {uniforms.length === 0
              ? t("uniforms.empty.title")
              : t("uniforms.empty.title.filtered")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {uniforms.length === 0
              ? t("uniforms.empty.sub")
              : t("uniforms.empty.sub.filtered")}
          </p>
        </Card>
      ) : (
        <>
          {/* ===== Desktop / tablet: table ===== */}
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      aria-label="Select all"
                      checked={
                        allFilteredSelected
                          ? true
                          : someFilteredSelected
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={toggleAllFiltered}
                    />
                  </TableHead>
                  <TableHead>{t("table.student")}</TableHead>
                  <TableHead className="w-20 text-center">
                    {t("uniforms.table.size")}
                  </TableHead>
                  <TableHead className="text-end">
                    {t("uniforms.table.price")}
                  </TableHead>
                  <TableHead>{t("uniforms.table.ordered")}</TableHead>
                  <TableHead>{t("table.status")}</TableHead>
                  <TableHead>{t("uniforms.table.received")}</TableHead>
                  <TableHead className="text-end">{t("table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => {
                  const isSelected = selected.has(u.id);
                  return (
                  <TableRow
                    key={u.id}
                    data-state={isSelected ? "selected" : undefined}
                    className={cn(isSelected && "bg-primary/5")}
                  >
                    <TableCell>
                      <Checkbox
                        aria-label={`Select ${u.student.fullName}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(u.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link
                        href={`/students/${u.student.id}`}
                        className="hover:underline"
                      >
                        {u.student.fullName}
                      </Link>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{u.size}</Badge>
                    </TableCell>
                    <TableCell className="text-end">
                      <div className="flex flex-col items-end leading-tight">
                        <span className="font-medium">
                          {formatCurrency(u.price)}
                        </span>
                        {!u.isPaid && u.paidAmount > 0 && (
                          <span className="text-[10px] text-muted-foreground">
                            {t("uniforms.row.paidOf", {
                              paid: formatCurrency(u.paidAmount),
                            })}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(u.orderedAt)}
                    </TableCell>
                    <TableCell>
                      {u.isPaid ? (
                        <Badge variant="success">{t("common.paid")}</Badge>
                      ) : u.paidAmount > 0 ? (
                        <Badge variant="warning">{t("common.partial")}</Badge>
                      ) : (
                        <Badge variant="secondary">{t("common.unpaid")}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {u.isReceived ? (
                        <Badge variant="success">
                          <PackageCheck className="size-3" />
                          {t("uniforms.badge.received")}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Package className="size-3" />
                          {t("uniforms.badge.notReceived")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant={u.isReceived ? "outline" : "default"}
                          onClick={() => onToggleReceived(u)}
                          disabled={pendingId === u.id}
                        >
                          {pendingId === u.id ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : u.isReceived ? (
                            <RotateCcw className="size-4" />
                          ) : (
                            <PackageCheck className="size-4" />
                          )}
                          {u.isReceived
                            ? t("uniforms.action.undoReceived")
                            : t("uniforms.action.markReceived")}
                        </Button>
                        {u.isPaid ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onTogglePaid(u)}
                            disabled={pendingId === u.id}
                          >
                            {pendingId === u.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <RotateCcw className="size-4" />
                            )}
                            {t("uniforms.action.undo")}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setRecording(u)}
                            disabled={pendingId === u.id}
                          >
                            <Wallet className="size-4" />
                            {t("uniforms.action.recordPayment")}
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => setEditing(u)}
                          aria-label={t("common.edit")}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => onDelete(u)}
                          disabled={pendingId === u.id}
                          aria-label={t("common.delete")}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>

          {/* ===== Mobile: card layout ===== */}
          <ul className="space-y-2 md:hidden">
            {filtered.map((u) => {
              const isSelected = selected.has(u.id);
              return (
              <li
                key={u.id}
                className={cn(
                  "rounded-xl border border-border bg-card p-3 shadow-sm transition-colors",
                  isSelected && "border-primary/40 bg-primary/5",
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center -m-1.5">
                    <Checkbox
                      aria-label={`Select ${u.student.fullName}`}
                      checked={isSelected}
                      onCheckedChange={() => toggleOne(u.id)}
                    />
                  </span>
                  <span className="inline-flex shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-blue-600 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                    {u.size}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/students/${u.student.id}`}
                      className="block truncate font-semibold hover:underline"
                    >
                      {u.student.fullName}
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {formatCurrency(u.price)}
                      </span>
                      {!u.isPaid && u.paidAmount > 0 && (
                        <span className="text-warning">
                          {t("uniforms.row.paidOf", {
                            paid: formatCurrency(u.paidAmount),
                          })}
                        </span>
                      )}
                      <span>{formatDate(u.orderedAt)}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {u.isPaid ? (
                      <Badge variant="success">{t("common.paid")}</Badge>
                    ) : u.paidAmount > 0 ? (
                      <Badge variant="warning">{t("common.partial")}</Badge>
                    ) : (
                      <Badge variant="secondary">{t("common.unpaid")}</Badge>
                    )}
                    {u.isReceived ? (
                      <Badge variant="success">
                        <PackageCheck className="size-3" />
                        {t("uniforms.badge.received")}
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Package className="size-3" />
                        {t("uniforms.badge.notReceived")}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-end gap-1 border-t border-border pt-2">
                  <Button
                    size="sm"
                    variant={u.isReceived ? "outline" : "default"}
                    onClick={() => onToggleReceived(u)}
                    disabled={pendingId === u.id}
                  >
                    {pendingId === u.id ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : u.isReceived ? (
                      <RotateCcw className="size-4" />
                    ) : (
                      <PackageCheck className="size-4" />
                    )}
                    {u.isReceived
                      ? t("uniforms.action.undoReceived")
                      : t("uniforms.action.markReceived")}
                  </Button>
                  {u.isPaid ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onTogglePaid(u)}
                      disabled={pendingId === u.id}
                    >
                      {pendingId === u.id ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <RotateCcw className="size-4" />
                      )}
                      {t("uniforms.action.undo")}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setRecording(u)}
                      disabled={pendingId === u.id}
                    >
                      <Wallet className="size-4" />
                      {t("uniforms.action.recordPayment")}
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditing(u)}
                    aria-label={t("common.edit")}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDelete(u)}
                    disabled={pendingId === u.id}
                    aria-label={t("common.delete")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
              );
            })}
          </ul>
        </>
      )}

      {creating && (
        <UniformDialog
          students={students}
          knownSizes={knownSizes}
          onClose={() => setCreating(false)}
          mode="create"
        />
      )}
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

      <Dialog open={bulkConfirmOpen} onOpenChange={setBulkConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("uniforms.bulkDelete.confirm.title", {
                count: selected.size,
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
              {t("uniforms.bulkDelete.confirm.btn", { count: selected.size })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
