"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  deleteStudent,
  archiveStudent,
  unarchiveStudent,
} from "@/lib/actions/students";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/client";
import {
  Pencil,
  Trash2,
  Loader2,
  LogOut,
  ArchiveRestore,
} from "lucide-react";

export function StudentRowActions({
  studentId,
  studentName,
  archived = false,
}: {
  studentId: string;
  studentName: string;
  archived?: boolean;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [archivePending, startArchiveTransition] = useTransition();

  const onDelete = () => {
    startTransition(async () => {
      const res = await deleteStudent(studentId);
      if (res && res.success === false) {
        toast.error(res.error);
        return;
      }
      toast.success(t("students.toast.deleted", { name: studentName }));
    });
  };

  // Marking as left removes the student from every future month (roster and
  // invoices), so it goes through a confirmation. Restoring is harmless and
  // runs straight away.
  const runArchive = () => {
    startArchiveTransition(async () => {
      const res = archived
        ? await unarchiveStudent(studentId)
        : await archiveStudent(studentId);
      if (res && res.success === false) {
        toast.error(res.error);
        return;
      }
      setArchiveOpen(false);
      toast.success(
        archived
          ? t("students.toast.restored", { name: studentName })
          : t("students.toast.markedLeft", { name: studentName }),
      );
    });
  };

  const archiveLabel = archived
    ? t("students.restore.action")
    : t("students.markLeft.action");

  return (
    <div className="flex items-center justify-end gap-1">
      <Button asChild size="icon" variant="ghost">
        <Link
          href={`/students/${studentId}/edit`}
          aria-label={t("students.action.editName", { name: studentName })}
        >
          <Pencil className="size-4" />
        </Link>
      </Button>

      <Button
        size="icon"
        variant="ghost"
        onClick={archived ? runArchive : () => setArchiveOpen(true)}
        disabled={archivePending}
        aria-label={archiveLabel}
        title={archiveLabel}
        className={
          archived
            ? "text-sea-700 hover:bg-sea-100 hover:text-sea-800"
            : "text-sea-900/70 hover:bg-sea-100 hover:text-sea-900"
        }
      >
        {archivePending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : archived ? (
          <ArchiveRestore className="size-4" />
        ) : (
          <LogOut className="size-4 rtl:rotate-180" />
        )}
      </Button>

      {!archived && (
        <Dialog open={archiveOpen} onOpenChange={setArchiveOpen}>
          <DialogContent onClick={(e) => e.stopPropagation()}>
            <DialogHeader>
              <DialogTitle>{t("students.markLeft.title", { name: studentName })}</DialogTitle>
              <DialogDescription>{t("students.markLeft.desc")}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setArchiveOpen(false)}
                disabled={archivePending}
              >
                {t("common.cancel")}
              </Button>
              <Button onClick={runArchive} disabled={archivePending}>
                {archivePending && <Loader2 className="size-4 animate-spin" />}
                {t("students.markLeft.confirm")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label={t("students.action.deleteName", { name: studentName })}
          >
            <Trash2 className="size-4" />
          </Button>
        </DialogTrigger>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>{t("students.delete.title", { name: studentName })}</DialogTitle>
            <DialogDescription>{t("students.delete.desc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
