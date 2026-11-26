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
import { useT } from "@/lib/i18n/client";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

export function GroupDangerZone({
  groupId,
  groupName,
  studentCount,
}: {
  groupId: string;
  groupName: string;
  /** Current (non-archived) students in the group. */
  studentCount: number;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const blocked = studentCount > 0;

  const onDelete = () => {
    startTransition(async () => {
      const res = await deleteGroup(groupId);
      // The backend explains a refusal (409) — e.g. the group still has
      // attendance history — so show its message as is.
      if (res && res.success === false) {
        toast.error(res.error);
        setOpen(false);
      }
      // On success the action redirects to /groups.
    });
  };

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-base text-destructive">{t("groups.danger.title")}</CardTitle>
        <CardDescription id="group-delete-help">
          {blocked
            ? studentCount === 1
              ? t("groups.danger.blocked.one")
              : t("groups.danger.blocked", { count: studentCount })
            : t("groups.danger.safe")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={blocked}
              aria-describedby="group-delete-help"
            >
              <Trash2 className="size-4" />
              {t("groups.danger.delete")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("groups.delete.title", { name: groupName })}</DialogTitle>
              <DialogDescription>{t("groups.delete.desc")}</DialogDescription>
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
      </CardContent>
    </Card>
  );
}
