"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { saveChecklist, deleteChecklist } from "@/lib/actions/attendance";
import type { AttendanceChecklist } from "@/lib/api/types";
import { cn, formatDateOnly } from "@/lib/utils";
import { toast } from "sonner";
import { useT } from "@/lib/i18n/client";
import { Check, Loader2, Save, Trash2, X } from "lucide-react";

/**
 * The checklist. Everyone starts unchecked — tick whoever showed up.
 * Saving is explicit so a mis-tap never silently records attendance.
 */
export function ChecklistForm({ checklist }: { checklist: AttendanceChecklist }) {
  const t = useT();
  const router = useRouter();

  const [present, setPresent] = useState<Set<string>>(
    () => new Set(checklist.students.filter((s) => s.present).map((s) => s.studentId)),
  );
  const [notes, setNotes] = useState(checklist.notes ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();

  const initial = useMemo(
    () => new Set(checklist.students.filter((s) => s.present).map((s) => s.studentId)),
    [checklist.students],
  );

  const dirty =
    present.size !== initial.size ||
    [...present].some((id) => !initial.has(id)) ||
    notes !== (checklist.notes ?? "");

  const toggle = (id: string) => {
    setPresent((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const onSave = () => {
    startSave(async () => {
      const records = checklist.students.map((s) => ({
        studentId: s.studentId,
        present: present.has(s.studentId),
      }));
      const res = await saveChecklist(
        checklist.id,
        checklist.groupId,
        records,
        notes.trim() || undefined,
      );
      if (res.success === false) {
        toast.error(res.error);
        return;
      }
      toast.success(
        t("attendance.checklist.saved", { count: res.data?.presentCount ?? present.size }),
      );
      router.refresh();
    });
  };

  const onDelete = () => {
    startDelete(async () => {
      const res = await deleteChecklist(checklist.id, checklist.groupId);
      if (res && res.success === false) toast.error(res.error);
    });
  };

  if (checklist.students.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-2 p-12 text-center">
        <p className="font-medium">{t("attendance.checklist.empty")}</p>
        <p className="text-sm text-muted-foreground">
          {t("attendance.checklist.emptySub")}
        </p>
        <Button asChild variant="outline" className="mt-2">
          <Link href={`/roster?year=${checklist.year}&month=${checklist.month}`}>
            {t("nav.roster")}
          </Link>
        </Button>
      </Card>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400">
            {t("attendance.checklist.present", {
              present: present.size,
              total: checklist.students.length,
            })}
          </Badge>
          {checklist.isNew && (
            <Badge variant="outline">{t("attendance.checklist.unsaved")}</Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setPresent(new Set(checklist.students.map((s) => s.studentId)))
            }
          >
            <Check className="size-4" />
            {t("attendance.checklist.checkAll")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setPresent(new Set())}>
            <X className="size-4" />
            {t("attendance.checklist.clearAll")}
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {checklist.students.map((s) => {
              const isPresent = present.has(s.studentId);
              return (
                <li key={s.studentId}>
                  {/*
                    The whole row is the control: a big tap target for taking
                    attendance on a phone at the side of the pitch. It's a div
                    rather than a <button> because the tick box it contains would
                    otherwise be a button nested inside a button (invalid HTML).
                    The box is drawn here instead of using <Checkbox>, so a tap
                    can only ever register once.
                  */}
                  <div
                    role="checkbox"
                    aria-checked={isPresent}
                    tabIndex={0}
                    onClick={() => toggle(s.studentId)}
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter") {
                        e.preventDefault();
                        toggle(s.studentId);
                      }
                    }}
                    className={cnRow(isPresent)}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "grid size-5 shrink-0 place-items-center rounded-sm border shadow transition-colors",
                        isPresent
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background",
                      )}
                    >
                      {isPresent && <Check className="size-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{s.fullName}</span>
                      {s.phoneNumber && (
                        <span className="block text-xs text-muted-foreground">
                          {s.phoneNumber}
                        </span>
                      )}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="checklist-notes">{t("attendance.checklist.notes")}</Label>
        <Input
          id="checklist-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="ghost"
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => setConfirmDelete(true)}
          disabled={deleting}
        >
          <Trash2 className="size-4" />
          {t("attendance.checklist.delete")}
        </Button>
        <Button size="lg" onClick={onSave} disabled={saving || !dirty}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {t("attendance.checklist.save")}
        </Button>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("attendance.delete.title")}</DialogTitle>
            <DialogDescription>
              {t("attendance.delete.desc", { date: formatDateOnly(checklist.date) })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
            >
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={deleting}>
              {deleting && <Loader2 className="size-4 animate-spin" />}
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function cnRow(isPresent: boolean) {
  return cn(
    "flex w-full cursor-pointer select-none items-center gap-4 px-4 py-3.5 text-start transition-colors",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
    isPresent ? "bg-emerald-500/5" : "hover:bg-muted/50",
  );
}
