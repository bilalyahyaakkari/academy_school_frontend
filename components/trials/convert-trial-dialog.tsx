"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { convertTrial } from "@/lib/actions/trials";
import { birthYear, currentYearMonth, formatCurrency } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import type { Trial } from "@/lib/api/types";
import type { TrialGroupOption } from "./trial-dialog";
import { FirstMonthFee } from "@/components/students/first-month-fee";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";

const NO_GROUP = "__none__";

/**
 * "Join as student": creates a real student (enrolled in their start month)
 * from the trial. The year of birth is required (stored as YYYY-01-01, like
 * the student form); group, phone and name come prefilled. Starting mid-month
 * offers the same first-month fee options as the new-student form.
 */
export function ConvertTrialDialog({
  trial,
  groups,
  onClose,
}: {
  trial: Trial;
  groups: TrialGroupOption[];
  onClose: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [groupId, setGroupId] = useState(
    trial.groupId && groups.some((g) => g.id === trial.groupId) ? trial.groupId : NO_GROUP,
  );
  const [feeOverride, setFeeOverride] = useState("");
  const currentYear = currentYearMonth().year;
  const groupFee = groups.find((g) => g.id === groupId)?.monthlyFee;

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const year = String(formData.get("birthYear") ?? "").trim();
    if (!/^\d{4}$/.test(year) || Number(year) < 1900 || Number(year) > currentYear) {
      toast.error(t("trials.error.birthYear"));
      return;
    }
    if (String(formData.get("fullName") ?? "").trim().length < 2) {
      toast.error(t("trials.error.name"));
      return;
    }
    if (groupId !== NO_GROUP) formData.set("groupId", groupId);
    else formData.delete("groupId");

    startTransition(async () => {
      const res = await convertTrial(trial.id, formData);
      if (res.success === false) {
        toast.error(res.error);
        return;
      }
      const name = String(formData.get("fullName") ?? trial.fullName).trim();
      toast.success(t("trials.convert.toast", { name }));
      router.push(`/students/${res.studentId}`);
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && !pending && onClose()}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("trials.convert.title", { name: trial.fullName })}</DialogTitle>
          <DialogDescription>{t("trials.convert.desc")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {trial.dateOfBirth && (
            <input type="hidden" name="originalDateOfBirth" value={trial.dateOfBirth} />
          )}
          <div className="space-y-2">
            <Label htmlFor="convert-name">{t("studentForm.fullName")} *</Label>
            <Input
              id="convert-name"
              name="fullName"
              required
              minLength={2}
              maxLength={120}
              defaultValue={trial.fullName}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="convert-birth-year">{t("studentForm.birthYear")} *</Label>
              <Input
                id="convert-birth-year"
                name="birthYear"
                type="number"
                inputMode="numeric"
                required
                min={1900}
                max={currentYear}
                step={1}
                autoFocus={!trial.dateOfBirth}
                placeholder={t("studentForm.birthYear.placeholder", { year: currentYear - 10 })}
                defaultValue={birthYear(trial.dateOfBirth)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="convert-phone">{t("studentForm.phone")}</Label>
              <Input
                id="convert-phone"
                name="phoneNumber"
                type="tel"
                dir="ltr"
                placeholder="+961..."
                defaultValue={trial.phoneNumber ?? ""}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="convert-group">{t("studentForm.group")}</Label>
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger id="convert-group">
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

          <div className="space-y-2">
            <Label htmlFor="convert-fee">{t("studentForm.fee")}</Label>
            <Input
              id="convert-fee"
              name="monthlyFee"
              type="number"
              step="0.01"
              min={0}
              max={1000000}
              placeholder={
                groupFee !== undefined
                  ? t("studentForm.fee.placeholderGroup", { fee: formatCurrency(groupFee) })
                  : t("studentForm.fee.placeholderDefault")
              }
              value={feeOverride}
              onChange={(e) => setFeeOverride(e.target.value)}
            />
          </div>

          <FirstMonthFee
            groupId={groupId !== NO_GROUP ? groupId : null}
            feeOverride={feeOverride}
          />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
              {t("studentForm.submit.create")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
