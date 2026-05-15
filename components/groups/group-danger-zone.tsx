"use client";

import { useState, useTransition } from "react";
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
import { deleteGroup } from "@/lib/actions/groups";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

export function GroupDangerZone({
  groupId,
  groupName,
  studentCount,
}: {
  groupId: string;
  groupName: string;
  studentCount: number;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const onDelete = () => {
    startTransition(async () => {
      const res = await deleteGroup(groupId);
      if (res && res.success === false) toast.error(res.error);
    });
  };

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-base text-destructive">Danger zone</CardTitle>
        <CardDescription>
          {studentCount > 0
            ? `Unassign or move ${studentCount} student${studentCount === 1 ? "" : "s"} before deleting.`
            : "This group has no students and can be deleted safely."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="size-4" />
              Delete group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete {groupName}?</DialogTitle>
              <DialogDescription>
                {studentCount > 0
                  ? `${studentCount} student(s) are still assigned. Deletion will fail until they're moved.`
                  : "This action cannot be undone."}
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
      </CardContent>
    </Card>
  );
}
