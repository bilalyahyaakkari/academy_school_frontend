"use client";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { changeStudentGroup } from "@/lib/actions/groups";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeftRight, Loader2 } from "lucide-react";

/** Radix Select can't use "" as a value, so "no group" gets a sentinel. */
const NONE = "none";

export type GroupOption = { id: string; name: string };

export function ChangeGroupDialog({
  studentId,
  studentName,
  currentGroupId,
  groups,
  className,
}: {
  studentId: string;
  studentName: string;
  currentGroupId: string | null;
  groups: GroupOption[];
  /** Extra classes for the trigger button (e.g. full width on mobile). */
  className?: string;
}) {
  const t = useT();
  const current = currentGroupId ?? NONE;
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(current);
  const [pending, startTransition] = useTransition();
  const selectId = `change-group-${studentId}`;

  const onOpenChange = (next: boolean) => {
    if (pending) return;
    if (next) setValue(current); // start from the current group every time
    setOpen(next);
  };

  const onSave = () => {
    const groupId = value === NONE ? null : value;
    const groupName = groups.find((g) => g.id === groupId)?.name ?? "";
    startTransition(async () => {
      const res = await changeStudentGroup(studentId, groupId);
      if (res.success) {
        toast.success(
          groupId
            ? t("groups.toast.moved", { name: studentName, group: groupName })
            : t("groups.toast.removedFromGroup", { name: studentName }),
        );
        setOpen(false);
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          className={cn(className)}
          aria-label={t("groups.change.actionName", { name: studentName })}
        >
          <ArrowLeftRight aria-hidden />
          {t("groups.change.action")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("groups.change.title", { name: studentName })}</DialogTitle>
          <DialogDescription>{t("groups.change.desc")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor={selectId}>{t("groups.change.label")}</Label>
          <Select value={value} onValueChange={setValue} disabled={pending}>
            <SelectTrigger id={selectId}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                  {g.id === currentGroupId && (
                    <span className="ms-1.5 text-xs">
                      {t("groups.change.current")}
                    </span>
                  )}
                </SelectItem>
              ))}
              <SelectItem value={NONE}>
                {t("groups.noGroup")}
                {currentGroupId == null && (
                  <span className="ms-1.5 text-xs">
                    {t("groups.change.current")}
                  </span>
                )}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button onClick={onSave} disabled={pending || value === current}>
            {pending && <Loader2 className="animate-spin" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
