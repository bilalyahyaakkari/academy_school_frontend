"use client";

import { useState, useTransition, type FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTrial, updateTrial } from "@/lib/actions/trials";
import { birthYear, currentYearMonth } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import type { Trial } from "@/lib/api/types";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export type TrialGroupOption = { id: string; name: string; monthlyFee: number };

const NO_GROUP = "__none__";

/** New / edit trial: name, parent phone, group, trial date, birth year, notes. */
export function TrialDialog({
  trial,
  groups,
  today,
  onClose,
}: {
  /** Absent = create. */
  trial?: Trial;
  groups: TrialGroupOption[];
  today: string;
  onClose: () => void;
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [groupId, setGroupId] = useState(trial?.groupId ?? NO_GROUP);
  const currentYear = currentYearMonth().year;

  // onSubmit (not <form action>) so a rejected save keeps what was typed.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (String(formData.get("fullName") ?? "").trim().length === 0) {
      toast.error(t("trials.error.name"));
      return;
    }
    if (!formData.get("trialDate")) {
      toast.error(t("trials.error.date"));
      return;
    }
    const year = String(formData.get("birthYear") ?? "").trim();
    if (year && !/^\d{4}$/.test(year)) {
      toast.error(t("trials.error.birthYear"));
      return;
    }
    if (groupId !== NO_GROUP) formData.set("groupId", groupId);
    else formData.delete("groupId");

    startTransition(async () => {
      const res = trial ? await updateTrial(trial.id, formData) : await createTrial(formData);
      if (res.success === false) {
        toast.error(res.error);
        return;
      }
      toast.success(trial ? t("trials.toast.updated") : t("trials.toast.created"));
      onClose();
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !pending && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{trial ? t("trials.dialog.edit") : t("trials.dialog.create")}</DialogTitle>
          <DialogDescription>{t("trials.dialog.desc")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {trial?.dateOfBirth && (
            <input type="hidden" name="originalDateOfBirth" value={trial.dateOfBirth} />
          )}
          <div className="space-y-2">
            <Label htmlFor="trial-name">{t("studentForm.fullName")} *</Label>
            <Input
              id="trial-name"
              name="fullName"
              required
              minLength={2}
              maxLength={120}
              autoFocus={!trial}
              defaultValue={trial?.fullName}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="trial-phone">{t("studentForm.phone")}</Label>
              <Input
                id="trial-phone"
                name="phoneNumber"
                type="tel"
                dir="ltr"
                placeholder="+961..."
                defaultValue={trial?.phoneNumber ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trial-group">{t("studentForm.group")}</Label>
              <Select value={groupId} onValueChange={setGroupId}>
                <SelectTrigger id="trial-group">
                  <SelectValue placeholder={t("studentForm.group.placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_GROUP}>{t("studentForm.group.none")}</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="trial-date">{t("trials.field.date")} *</Label>
              <Input
                id="trial-date"
                name="trialDate"
                type="date"
                required
                defaultValue={trial?.trialDate.slice(0, 10) ?? today}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trial-birth-year">{t("trials.field.birthYear.optional")}</Label>
              <Input
                id="trial-birth-year"
                name="birthYear"
                type="number"
                inputMode="numeric"
                min={1900}
                max={currentYear}
                step={1}
                placeholder={t("studentForm.birthYear.placeholder", { year: currentYear - 10 })}
                defaultValue={birthYear(trial?.dateOfBirth)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trial-notes">{t("studentForm.notes")}</Label>
            <Textarea id="trial-notes" name="notes" rows={3} defaultValue={trial?.notes ?? ""} />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {trial ? t("common.save") : t("trials.submit.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
