"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudentAvatar } from "@/components/students/student-avatar";
import { bulkOrderUniforms } from "@/lib/actions/bulk-order-uniforms";
import { useT } from "@/lib/i18n/client";
import { normalizeArabic } from "@/lib/arabic";
import { useSidebarCollapsed } from "@/components/app/app-shell";
import { toast } from "sonner";
import { Search, Loader2, ShoppingBag, Plus, X, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type StudentRow = {
  id: string;
  fullName: string;
  existingOrders: number;
};

type FailedRow = { studentId: string; fullName: string; error: string };

const DEFAULT_SIZES = ["S", "M", "L", "XL"];
const ADD_NEW_VALUE = "__add_new__";

export function BulkOrderClient({
  students,
  knownSizes,
}: {
  students: StudentRow[];
  knownSizes: string[];
}) {
  const t = useT();
  const router = useRouter();
  const sidebarCollapsed = useSidebarCollapsed();
  const [pending, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "noOrder">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // Rows the last submit couldn't create — shown until dismissed/resubmitted.
  const [failures, setFailures] = useState<FailedRow[]>([]);

  const [size, setSize] = useState("M");
  const [addingSize, setAddingSize] = useState(false);
  const [newSize, setNewSize] = useState("");
  const [price, setPrice] = useState("");
  const [isPaid, setIsPaid] = useState(false);

  // Normalized once per student list, so the search is Arabic-aware (alif
  // variants, taa marbuta, diacritics…) without re-normalizing on each key.
  const normalizedNames = useMemo(
    () => new Map(students.map((s) => [s.id, normalizeArabic(s.fullName)])),
    [students],
  );

  const filtered = useMemo(() => {
    const q = normalizeArabic(query);
    return students.filter((s) => {
      if (filter === "noOrder" && s.existingOrders > 0) return false;
      if (q && !(normalizedNames.get(s.id) ?? "").includes(q)) return false;
      return true;
    });
  }, [students, normalizedNames, query, filter]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((s) => selected.has(s.id));

  const sizeOptions = useMemo(() => {
    const set = new Set<string>(DEFAULT_SIZES);
    for (const s of knownSizes) if (s) set.add(s);
    if (size) set.add(size);
    return Array.from(set);
  }, [knownSizes, size]);

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
        for (const s of filtered) next.delete(s.id);
      } else {
        for (const s of filtered) next.add(s.id);
      }
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const onSelectSize = (v: string) => {
    if (v === ADD_NEW_VALUE) {
      setAddingSize(true);
      setNewSize("");
      return;
    }
    setSize(v);
  };

  const confirmNewSize = () => {
    const trimmed = newSize.trim();
    if (!trimmed) {
      toast.error(t("uniformDialog.validation.emptySize"));
      return;
    }
    if (trimmed.length > 20) {
      toast.error(t("uniformDialog.validation.sizeTooLong"));
      return;
    }
    setSize(trimmed);
    setAddingSize(false);
    setNewSize("");
  };

  const cancelNewSize = () => {
    setAddingSize(false);
    setNewSize("");
  };

  const onSubmit = () => {
    if (selected.size === 0) {
      toast.error(t("uniforms.bulk.toast.pickStudents"));
      return;
    }

    let effectiveSize = size;
    if (addingSize) {
      const trimmed = newSize.trim();
      if (!trimmed) {
        toast.error(t("uniformDialog.validation.emptySize"));
        return;
      }
      if (trimmed.length > 20) {
        toast.error(t("uniformDialog.validation.sizeTooLong"));
        return;
      }
      effectiveSize = trimmed;
      setSize(trimmed);
      setAddingSize(false);
      setNewSize("");
    }

    // A price is required: Number("") is 0, which would silently create
    // free orders.
    const priceText = price.trim();
    const priceNum = priceText === "" ? NaN : Number(priceText);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      toast.error(t("uniforms.bulk.toast.invalidPrice"));
      return;
    }

    const studentIds = Array.from(selected);
    const nameById = new Map(students.map((s) => [s.id, s.fullName]));

    startTransition(async () => {
      const res = await bulkOrderUniforms({
        studentIds,
        size: effectiveSize,
        price: priceNum,
        isPaid,
      });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      if (res.failed === 0) {
        toast.success(
          t("uniforms.bulk.toast.created", { count: res.created }),
        );
        setFailures([]);
        // Everything went through — head back to the list.
        router.push("/uniforms");
        return;
      }
      toast.warning(
        t("uniforms.bulk.toast.partial", {
          ok: res.created,
          failed: res.failed,
        }),
      );
      // Partial failure: stay here, list who failed, and keep only those
      // students selected so a fix + resubmit doesn't duplicate the others.
      const failed = res.errors.map((e) => ({
        studentId: e.studentId,
        fullName: nameById.get(e.studentId) ?? e.studentId,
        error: e.error,
      }));
      setFailures(failed);
      setSelected(new Set(failed.map((f) => f.studentId)));
      router.refresh();
    });
  };

  return (
    <div className="space-y-4 pb-40">
      {/* Search + filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("uniforms.bulk.search")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="ps-9"
          />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <SelectTrigger className="sm:w-48" aria-label={t("common.filter")}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("uniforms.bulk.filter.all")}</SelectItem>
            <SelectItem value="noOrder">
              {t("uniforms.bulk.filter.noOrder")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {failures.length > 0 && (
        <div
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="flex items-center gap-2 font-medium text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              {t("uniforms.bulk.failed.title", { count: failures.length })}
            </p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFailures([])}
            >
              {t("uniforms.bulk.failed.dismiss")}
            </Button>
          </div>
          <ul className="mt-2 space-y-1 text-xs">
            {failures.map((f, i) => (
              <li key={`${f.studentId}-${i}`} className="flex flex-wrap gap-x-2">
                <span className="font-medium">{f.fullName}</span>
                <span className="text-destructive">— {f.error}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            {t("uniforms.bulk.failed.hint")}
          </p>
        </div>
      )}

      {/* Bulk select toolbar */}
      <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 px-3 py-2 text-sm">
        <button
          type="button"
          onClick={toggleAllFiltered}
          className="font-medium hover:underline"
          disabled={filtered.length === 0}
        >
          {allFilteredSelected
            ? t("uniforms.bulk.deselectAll")
            : t("uniforms.bulk.selectAll", { count: filtered.length })}
        </button>
        <span className="text-muted-foreground">
          {t("uniforms.bulk.selectedCount", { count: selected.size })}
        </span>
      </div>

      {/* Student list */}
      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <p className="p-12 text-center text-sm text-muted-foreground">
            {t("uniforms.bulk.empty")}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((s) => {
              const isSelected = selected.has(s.id);
              return (
                <li
                  key={s.id}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 transition-colors",
                    isSelected && "bg-primary/5",
                  )}
                >
                  <label
                    htmlFor={`bulk-${s.id}`}
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                  >
                    <span className="grid size-10 shrink-0 place-items-center -m-1.5">
                      <Checkbox
                        id={`bulk-${s.id}`}
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(s.id)}
                      />
                    </span>
                    <StudentAvatar name={s.fullName} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{s.fullName}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        {s.existingOrders > 0 && (
                          <span className="font-medium text-sea-800">
                            {t("uniforms.bulk.alreadyOrdered", {
                              count: s.existingOrders,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {/* Sticky submit panel */}
      {/* Starts where the sidebar ends: w-64 expanded, w-16 collapsed. */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md transition-[inset-inline-start] duration-300 ease-out md:px-6 lg:px-8",
          sidebarCollapsed ? "md:start-16" : "md:start-64",
        )}
      >
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
          <div className="space-y-1">
            <Label
              htmlFor={addingSize ? "bulk-new-size" : "bulk-size"}
              className="text-xs"
            >
              {t("uniformDialog.field.size")}
            </Label>
            {addingSize ? (
              <div className="flex items-center gap-2">
                <Input
                  id="bulk-new-size"
                  autoFocus
                  value={newSize}
                  onChange={(e) => setNewSize(e.target.value)}
                  placeholder={t("uniformDialog.placeholder.newSize")}
                  maxLength={20}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      confirmNewSize();
                    } else if (e.key === "Escape") {
                      e.preventDefault();
                      cancelNewSize();
                    }
                  }}
                  onBlur={(e) => {
                    const next = e.relatedTarget as HTMLElement | null;
                    if (next?.closest("[data-size-action]")) return;
                    const trimmed = newSize.trim();
                    if (trimmed && trimmed.length <= 20) {
                      setSize(trimmed);
                      setAddingSize(false);
                      setNewSize("");
                    }
                  }}
                />
                <Button
                  type="button"
                  size="icon"
                  onClick={confirmNewSize}
                  aria-label={t("common.add")}
                  data-size-action
                >
                  <Plus className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={cancelNewSize}
                  aria-label={t("common.cancel")}
                  data-size-action
                >
                  <X className="size-4" />
                </Button>
              </div>
            ) : (
              <Select value={size} onValueChange={onSelectSize}>
                <SelectTrigger id="bulk-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sizeOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                  <SelectItem
                    value={ADD_NEW_VALUE}
                    className="font-medium text-primary"
                  >
                    + {t("uniformDialog.size.addNew")}
                  </SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="bulk-price" className="text-xs">
              {t("uniformDialog.field.price")} *
            </Label>
            <Input
              id="bulk-price"
              type="number"
              required
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="flex items-center gap-2 pb-2">
            <Checkbox
              id="bulk-isPaid"
              checked={isPaid}
              onCheckedChange={(v) => setIsPaid(v === true)}
            />
            <Label htmlFor="bulk-isPaid" className="cursor-pointer text-sm">
              {t("uniformDialog.field.alreadyPaid")}
            </Label>
          </div>

          <div className="flex items-center gap-2">
            {selected.size > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSelection}
              >
                {t("common.clear")}
              </Button>
            )}
            <Button
              type="button"
              onClick={onSubmit}
              disabled={pending || selected.size === 0}
            >
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShoppingBag className="size-4" />
              )}
              {t("uniforms.bulk.submit", { count: selected.size })}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
