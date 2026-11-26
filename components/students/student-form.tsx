"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
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
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { formatCurrency, currentYearMonth } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/client";
import { FirstMonthFee } from "./first-month-fee";

export type StudentFormGroup = {
  id: string;
  name: string;
  minAge?: number | null;
  maxAge?: number | null;
  monthlyFee?: number;
};

export type StudentFormDefaults = {
  id?: string;
  fullName?: string;
  /** Birth year, 4 digits (e.g. "2015"). */
  birthYear?: string;
  /**
   * The full stored date of birth (ISO). Sent back unchanged when the year
   * isn't edited, so saving the form never resets the day/month to Jan 1st.
   */
  dateOfBirth?: string;
  phoneNumber?: string;
  address?: string;
  school?: string;
  groupId?: string | null;
  monthlyFee?: number | null;
  notes?: string;
  /** YYYY-MM-DD the student started training (edit mode). */
  trainingStartDate?: string;
};

type Props = {
  groups: StudentFormGroup[];
  defaults?: StudentFormDefaults;
  action: (formData: FormData) => Promise<{ success: true } | { success: false; error: string } | undefined>;
  submitLabel?: string;
};

export function StudentForm({ groups, defaults, action, submitLabel }: Props) {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [year, setYear] = useState(defaults?.birthYear ?? "");
  const [groupId, setGroupId] = useState<string>(defaults?.groupId ?? "__none__");
  const [feeOverride, setFeeOverride] = useState(
    defaults?.monthlyFee != null ? String(defaults.monthlyFee) : "",
  );
  // Editing an existing student: the start date is a plain field and the
  // first-month options don't apply (that invoice already exists).
  const isEdit = Boolean(defaults?.id);
  const currentYear = currentYearMonth().year;

  // The fee that will apply if the override is left blank.
  const inheritedFee =
    groupId !== "__none__"
      ? groups.find((g) => g.id === groupId)?.monthlyFee
      : undefined;

  // Age = current year minus birth year (approximate; we only ask for the year).
  const ageYears =
    year && /^\d{4}$/.test(year) && Number(year) >= 1900 && Number(year) <= currentYear
      ? currentYear - Number(year)
      : null;
  const suggested = ageYears !== null
    ? groups.filter(
        (g) =>
          (g.minAge == null || ageYears >= g.minAge) &&
          (g.maxAge == null || ageYears <= g.maxAge),
      )
    : [];

  // onSubmit (not <form action>): React 19 resets an uncontrolled form after a
  // form action runs — even when it returns an error — which would wipe what
  // the user typed. Handling submit ourselves keeps the input on error.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    if (groupId && groupId !== "__none__") formData.set("groupId", groupId);
    else formData.delete("groupId");

    startTransition(async () => {
      const res = await action(formData);
      if (res && res.success === false) {
        toast.error(res.error);
        return;
      }
      // On success the action redirects; nothing else to do.
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {defaults?.dateOfBirth && (
        <input type="hidden" name="originalDateOfBirth" value={defaults.dateOfBirth} />
      )}
      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="fullName">{t("studentForm.fullName")} *</Label>
            <Input
              id="fullName"
              name="fullName"
              required
              minLength={2}
              maxLength={120}
              defaultValue={defaults?.fullName}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthYear">{t("studentForm.birthYear")} *</Label>
            <Input
              id="birthYear"
              name="birthYear"
              type="number"
              inputMode="numeric"
              required
              min={1900}
              max={currentYear}
              step={1}
              placeholder={t("studentForm.birthYear.placeholder", { year: currentYear - 10 })}
              defaultValue={defaults?.birthYear}
              onChange={(e) => setYear(e.target.value)}
            />
            {ageYears !== null && (
              <p className="text-xs text-muted-foreground">
                {t("studentForm.age", { years: ageYears })}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">{t("studentForm.phone")}</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              dir="ltr"
              placeholder="+961..."
              defaultValue={defaults?.phoneNumber}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="school">{t("studentForm.school")}</Label>
            <Input
              id="school"
              name="school"
              maxLength={120}
              defaultValue={defaults?.school}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{t("studentForm.address")}</Label>
            <Input
              id="address"
              name="address"
              maxLength={300}
              defaultValue={defaults?.address}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>{t("studentForm.group")}</Label>
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger>
                <SelectValue placeholder={t("studentForm.group.placeholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t("studentForm.group.none")}</SelectItem>
                {groups.map((g) => {
                  const isSuggested = suggested.some((s) => s.id === g.id);
                  return (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                      {isSuggested ? `  ${t("studentForm.group.suggestedTag")}` : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {suggested.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {t("studentForm.group.suggested", {
                  groups: suggested.map((s) => s.name).join(locale === "ar" ? "، " : ", "),
                })}
              </p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="monthlyFee">{t("studentForm.fee")}</Label>
            <Input
              id="monthlyFee"
              name="monthlyFee"
              type="number"
              step="0.01"
              min={0}
              max={1000000}
              placeholder={
                inheritedFee !== undefined
                  ? t("studentForm.fee.placeholderGroup", { fee: formatCurrency(inheritedFee) })
                  : t("studentForm.fee.placeholderDefault")
              }
              value={feeOverride}
              onChange={(e) => setFeeOverride(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">{t("studentForm.fee.help")}</p>
          </div>

          <div className="md:col-span-2">
            {isEdit ? (
              <div className="space-y-2">
                <Label htmlFor="trainingStartDate">{t("firstMonth.startDate")}</Label>
                <Input
                  id="trainingStartDate"
                  name="trainingStartDate"
                  type="date"
                  defaultValue={defaults?.trainingStartDate ?? ""}
                  className="w-full sm:max-w-56"
                />
                <p className="text-xs text-muted-foreground">{t("firstMonth.edit.help")}</p>
              </div>
            ) : (
              <FirstMonthFee
                groupId={groupId !== "__none__" ? groupId : null}
                feeOverride={feeOverride}
              />
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">{t("studentForm.notes")}</Label>
            <Textarea id="notes" name="notes" rows={4} defaultValue={defaults?.notes} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          {t("common.cancel")}
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {submitLabel ?? t("common.save")}
        </Button>
      </div>
    </form>
  );
}
