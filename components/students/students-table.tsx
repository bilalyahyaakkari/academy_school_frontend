"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { StudentRowActions } from "@/components/students/student-row-actions";
import { StudentAvatar } from "@/components/students/student-avatar";
import { bulkDeleteStudents } from "@/lib/actions/students";
import { formatAge, cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { toast } from "sonner";
import { Trash2, Loader2, Phone } from "lucide-react";
import type { StudentWithGroup } from "@/lib/api/types";

export function StudentsTable({ students }: { students: StudentWithGroup[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const t = useT();

  const allSelected = students.length > 0 && selected.size === students.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(students.map((s) => s.id)));
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onBulkDelete = () => {
    const ids = Array.from(selected);
    startTransition(async () => {
      const res = await bulkDeleteStudents(ids);
      if (res.success === false) {
        toast.error(res.error);
        return;
      }
      toast.success(`Deleted ${res.deleted} student${res.deleted === 1 ? "" : "s"}`);
      setSelected(new Set());
      setConfirmOpen(false);
    });
  };

  return (
    <Card className="relative overflow-hidden">
      {/* Decorative top accent */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
      />

      {/* Bulk action toolbar — appears when at least one row is selected */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-4 py-2.5 text-sm">
          <span className="flex items-center gap-2 font-medium">
            <span className="grid size-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {selected.size}
            </span>
            <span>{t("students.bulk.selected", { count: selected.size }).replace(/^\d+\s*/, "")}</span>
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
              {t("common.clear")}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="size-4" />
              {t("students.bulk.delete")}
            </Button>
          </div>
        </div>
      )}

      {/* ===== Desktop / tablet: table layout ===== */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30 hover:bg-muted/30">
              <TableHead className="w-10">
                <Checkbox
                  aria-label="Select all"
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>{t("table.student")}</TableHead>
              <TableHead>{t("table.age")}</TableHead>
              <TableHead>{t("table.group")}</TableHead>
              <TableHead>{t("table.parentPhone")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
              <TableHead className="text-end">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s) => {
              const isSelected = selected.has(s.id);
              return (
                <TableRow
                  key={s.id}
                  data-state={isSelected ? "selected" : undefined}
                  className={cn(
                    "group transition-colors",
                    isSelected && "bg-primary/5 hover:bg-primary/10",
                  )}
                >
                  <TableCell>
                    <Checkbox
                      aria-label={`Select ${s.fullName}`}
                      checked={isSelected}
                      onCheckedChange={() => toggleOne(s.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/students/${s.id}`}
                      className="flex items-center gap-3"
                    >
                      <StudentAvatar
                        name={s.fullName}
                        size="md"
                        className="transition-transform group-hover:scale-110"
                      />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground transition-colors group-hover:text-primary">
                          {s.fullName}
                        </p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm font-medium">
                    {formatAge(s.dateOfBirth)}
                  </TableCell>
                  <TableCell>
                    {s.group ? (
                      <Link
                        href={`/groups/${s.group.id}`}
                        className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-2.5 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                      >
                        {s.group.name}
                      </Link>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {s.phoneNumber ? (
                      <span className="inline-flex items-center gap-1.5 text-sm">
                        <Phone className="size-3 text-muted-foreground" />
                        {s.phoneNumber}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {s.isActive ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        <span className="relative flex size-1.5">
                          <span className="absolute inset-0 animate-ping-slow rounded-full bg-emerald-500" />
                          <span className="relative size-1.5 rounded-full bg-emerald-500" />
                        </span>
                        {t("common.active")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-400/20 bg-slate-500/10 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                        {t("common.inactive")}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <StudentRowActions studentId={s.id} studentName={s.fullName} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* ===== Mobile: card layout ===== */}
      <ul className="divide-y divide-border md:hidden">
        {students.map((s) => {
          const isSelected = selected.has(s.id);
          return (
            <li
              key={s.id}
              className={cn(
                "flex items-center gap-3 px-3 py-3 transition-colors",
                isSelected && "bg-primary/5",
              )}
            >
              {/* Selection checkbox, big tap zone */}
              <button
                type="button"
                onClick={() => toggleOne(s.id)}
                aria-label={`Select ${s.fullName}`}
                className="grid size-10 shrink-0 place-items-center -m-1.5"
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleOne(s.id)}
                />
              </button>

              {/* Tappable card body → student detail */}
              <Link
                href={`/students/${s.id}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <StudentAvatar name={s.fullName} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-semibold">
                    {s.fullName}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="font-medium">{formatAge(s.dateOfBirth)}</span>
                    {s.group && (
                      <span className="inline-flex items-center gap-1">
                        <span className="size-1 rounded-full bg-primary/60" />
                        {s.group.name}
                      </span>
                    )}
                    {s.phoneNumber && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="size-3" />
                        {s.phoneNumber}
                      </span>
                    )}
                  </div>
                  {!s.isActive && (
                    <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full border border-slate-400/20 bg-slate-500/10 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                      {t("common.inactive")}
                    </span>
                  )}
                </div>
              </Link>

              {/* Row actions */}
              <div className="shrink-0">
                <StudentRowActions studentId={s.id} studentName={s.fullName} />
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("students.bulk.confirm.title", { count: selected.size })}
            </DialogTitle>
            <DialogDescription>
              {t("students.bulk.confirm.desc")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)} disabled={pending}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={onBulkDelete} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {t("students.bulk.confirm.btn", { count: selected.size })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
