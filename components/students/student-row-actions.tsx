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
  Archive,
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
  const [pending, startTransition] = useTransition();
  const [archivePending, startArchiveTransition] = useTransition();

  const onDelete = () => {
    startTransition(async () => {
      const res = await deleteStudent(studentId);
      if (res && res.success === false) {
        toast.error(res.error);
        return;
      }
      toast.success(`Deleted ${studentName}`);
    });
  };

  const onArchive = () => {
    startArchiveTransition(async () => {
      const res = archived
        ? await unarchiveStudent(studentId)
        : await archiveStudent(studentId);
      if (res && res.success === false) {
        toast.error(res.error);
        return;
      }
      toast.success(
        archived
          ? t("students.archive.restored", { name: studentName })
          : t("students.archive.archived", { name: studentName }),
      );
    });
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <Button asChild size="icon" variant="ghost">
        <Link href={`/students/${studentId}/edit`} aria-label={`Edit ${studentName}`}>
          <Pencil className="size-4" />
        </Link>
      </Button>

      <Button
        size="icon"
        variant="ghost"
        onClick={onArchive}
        disabled={archivePending}
        aria-label={
          archived
            ? t("students.archive.action.restore")
            : t("students.archive.action.archive")
        }
        title={
          archived
            ? t("students.archive.action.restore")
            : t("students.archive.action.archive")
        }
        className={
          archived
            ? "text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400"
            : "text-amber-600 hover:bg-amber-500/10 hover:text-amber-700 dark:text-amber-400"
        }
      >
        {archivePending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : archived ? (
          <ArchiveRestore className="size-4" />
        ) : (
          <Archive className="size-4" />
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label={`Delete ${studentName}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </DialogTrigger>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Delete {studentName}?</DialogTitle>
            <DialogDescription>
              This permanently removes the student and all their payment records.
              This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
