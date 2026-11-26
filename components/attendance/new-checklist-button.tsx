"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { openChecklist } from "@/lib/actions/attendance";
import { todayIso } from "@/lib/utils";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/client";
import { ClipboardCheck, Loader2 } from "lucide-react";

/**
 * Opens the checklist for a group on a chosen day, defaulting to today.
 * The server reuses an existing checklist for that day rather than duplicating,
 * so this is safe to hit twice.
 */
export function NewChecklistButton({
  groupId,
  label,
  className,
  variant = "default",
}: {
  groupId: string;
  label: string;
  className?: string;
  variant?: "default" | "outline";
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(() => todayIso());
  const [pending, start] = useTransition();
  const router = useRouter();

  const submit = () => {
    // Today has its own screen, which doesn't create a checklist until saved.
    if (date === todayIso()) {
      setOpen(false);
      router.push(`/attendance?tab=today&group=${encodeURIComponent(groupId)}`);
      return;
    }
    start(async () => {
      // On success this redirects, so anything returned here is an error.
      const res = await openChecklist(groupId, date);
      if (res && res.success === false) toast.error(res.error);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        // Re-read "today" on every open: a tab left open overnight would
        // otherwise default to yesterday.
        if (o) setDate(todayIso());
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        <Button variant={variant} className={className}>
          <ClipboardCheck />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("attendance.new.title")}</DialogTitle>
          <DialogDescription>{t("attendance.new.desc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="checklist-date">{t("attendance.new.date")}</Label>
          <Input
            id="checklist-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            {t("common.cancel")}
          </Button>
          <Button onClick={submit} disabled={pending || !date}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            {t("attendance.new.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
