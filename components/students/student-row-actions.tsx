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
import { deleteStudent } from "@/lib/actions/students";
import { toast } from "sonner";
import { Pencil, Trash2, Loader2 } from "lucide-react";

export function StudentRowActions({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const onDelete = () => {
    startTransition(async () => {
      const res = await deleteStudent(studentId);
      if (res && res.success === false) {
        toast.error(res.error);
        return;
      }
      toast.success(`Deleted ${studentName}`);
      // The action redirects to /students and revalidates the list.
    });
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <Button asChild size="icon" variant="ghost">
        <Link href={`/students/${studentId}/edit`} aria-label={`Edit ${studentName}`}>
          <Pencil className="size-4" />
        </Link>
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
