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
import { toast } from "sonner";
import { Search, Loader2, ShoppingBag, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type StudentRow = {
  id: string;
  fullName: string;
  isActive: boolean;
  existingOrders: number;
};

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
  const [pending, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "noOrder">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [size, setSize] = useState("M");
  const [addingSize, setAddingSize] = useState(false);
  const [newSize, setNewSize] = useState("");
  const [price, setPrice] = useState("");
  const [isPaid, setIsPaid] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students.filter((s) => {
      if (filter === "active" && !s.isActive) return false;
      if (filter === "noOrder" && s.existingOrders > 0) return false;
      if (q && !s.fullName.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [students, query, filter]);

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

    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      toast.error(t("uniforms.bulk.toast.invalidPrice"));
      return;
    }

    startTransition(async () => {
      const res = await bulkOrderUniforms({
        studentIds: Array.from(selected),
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
      } else {
        toast.warning(
          t("uniforms.bulk.toast.partial", {
            ok: res.created,
            failed: res.failed,
          }),
        );
      }
      router.push("/uniforms");
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
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("uniforms.bulk.filter.all")}</SelectItem>
            <SelectItem value="active">
              {t("uniforms.bulk.filter.active")}
            </SelectItem>
            <SelectItem value="noOrder">
              {t("uniforms.bulk.filter.noOrder")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

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
                        {!s.isActive && (
                          <span className="rounded-full border border-slate-400/20 bg-slate-500/10 px-2 py-0.5 font-medium text-slate-600 dark:text-slate-400">
                            {t("common.inactive")}
                          </span>
                        )}
                        {s.existingOrders > 0 && (
                          <span className="text-amber-600 dark:text-amber-400">
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
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md md:start-64 md:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
          <div className="space-y-1">
            <Label className="text-xs">
              {t("uniformDialog.field.size")}
            </Label>
            {addingSize ? (
              <div className="flex items-center gap-2">
                <Input
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
                <SelectTrigger>
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
              {t("uniformDialog.field.price")}
            </Label>
            <Input
              id="bulk-price"
              type="number"
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
