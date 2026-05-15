"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UniformDialog } from "./uniform-dialog";
import {
  toggleUniformPaid,
  deleteUniform,
} from "@/lib/actions/uniforms";
import { toast } from "sonner";
import {
  Plus,
  Check,
  RotateCcw,
  Pencil,
  Trash2,
  Loader2,
  Shirt,
  Upload,
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
  const [editing, setEditing] = useState<UniformWithStudent | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const filtered = uniforms.filter((u) =>
    filter === "all" ? true : filter === "paid" ? u.isPaid : !u.isPaid,
  );

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
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.student")}</TableHead>
                <TableHead className="w-20 text-center">
                  {t("uniforms.table.size")}
                </TableHead>
                <TableHead className="text-end">
                  {t("uniforms.table.price")}
                </TableHead>
                <TableHead>{t("uniforms.table.ordered")}</TableHead>
                <TableHead>{t("table.status")}</TableHead>
                <TableHead className="text-end">{t("table.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
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
                    {formatCurrency(u.price)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(u.orderedAt)}
                  </TableCell>
                  <TableCell>
                    {u.isPaid ? (
                      <Badge variant="success">{t("common.paid")}</Badge>
                    ) : (
                      <Badge variant="secondary">{t("common.unpaid")}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="sm"
                        variant={u.isPaid ? "outline" : "default"}
                        onClick={() => onTogglePaid(u)}
                        disabled={pendingId === u.id}
                      >
                        {pendingId === u.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : u.isPaid ? (
                          <RotateCcw className="size-4" />
                        ) : (
                          <Check className="size-4" />
                        )}
                        {u.isPaid
                          ? t("uniforms.action.undo")
                          : t("uniforms.action.markPaid")}
                      </Button>
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
              ))}
            </TableBody>
          </Table>
        </Card>
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
    </>
  );
}
