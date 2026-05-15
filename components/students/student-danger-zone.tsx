"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteStudent, toggleStudentActive } from "@/lib/actions/students";
import { toast } from "sonner";
import { Trash2, PowerOff, Power, Loader2 } from "lucide-react";

export function StudentDangerZone({
  studentId,
  fullName,
  isActive,
}: {
  studentId: string;
  fullName: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const onToggle = () => {
    startTransition(async () => {
      const res = await toggleStudentActive(studentId);
      if (res?.success === false) toast.error(res.error);
      else toast.success(isActive ? "Marked inactive" : "Marked active");
    });
  };

  const onDelete = () => {
    startTransition(async () => {
      const res = await deleteStudent(studentId);
      if (res && res.success === false) toast.error(res.error);
      // Redirect will navigate away on success.
    });
  };

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
        <CardDescription>These actions cannot be easily undone.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={onToggle} disabled={pending}>
            {isActive ? <PowerOff className="size-4" /> : <Power className="size-4" />}
            {isActive ? "Mark inactive" : "Mark active"}
          </Button>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="size-4" />
                Delete student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete {fullName}?</DialogTitle>
                <DialogDescription>
                  This permanently removes the student and all their payment records.
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
      </CardContent>
    </Card>
  );
}
