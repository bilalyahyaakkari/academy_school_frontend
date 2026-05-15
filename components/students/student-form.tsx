"use client";

import { useState, useTransition } from "react";
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
import { formatCurrency } from "@/lib/utils";

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
  phoneNumber?: string;
  groupId?: string | null;
  isActive?: boolean;
  monthlyFee?: number | null;
  notes?: string;
};

type Props = {
  groups: StudentFormGroup[];
  defaults?: StudentFormDefaults;
  action: (formData: FormData) => Promise<{ success: true } | { success: false; error: string } | undefined>;
  submitLabel?: string;
};

export function StudentForm({ groups, defaults, action, submitLabel = "Save" }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [year, setYear] = useState(defaults?.birthYear ?? "");
  const [groupId, setGroupId] = useState<string>(defaults?.groupId ?? "__none__");
  const currentYear = new Date().getFullYear();

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

  const onSubmit = (formData: FormData) => {
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
    <form action={onSubmit} className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="fullName">Full name *</Label>
            <Input id="fullName" name="fullName" required defaultValue={defaults?.fullName} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthYear">Year of birth *</Label>
            <Input
              id="birthYear"
              name="birthYear"
              type="number"
              inputMode="numeric"
              required
              min={1900}
              max={currentYear}
              step={1}
              placeholder={`e.g. ${currentYear - 10}`}
              defaultValue={defaults?.birthYear}
              onChange={(e) => setYear(e.target.value)}
            />
            {ageYears !== null && (
              <p className="text-xs text-muted-foreground">Age: {ageYears} years</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Parent phone</Label>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              placeholder="+963..."
              defaultValue={defaults?.phoneNumber}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Group</Label>
            <Select value={groupId} onValueChange={setGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="No group assigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— No group —</SelectItem>
                {groups.map((g) => {
                  const isSuggested = suggested.some((s) => s.id === g.id);
                  return (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                      {isSuggested ? "  ✓ suggested" : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {suggested.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Suggested for this age: {suggested.map((s) => s.name).join(", ")}
              </p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="monthlyFee">Monthly fee (override)</Label>
            <Input
              id="monthlyFee"
              name="monthlyFee"
              type="number"
              step="0.01"
              min={0}
              placeholder={
                inheritedFee !== undefined
                  ? `Leave blank to use group fee (${formatCurrency(inheritedFee)})`
                  : "Leave blank to use the default fee"
              }
              defaultValue={defaults?.monthlyFee ?? ""}
            />
            <p className="text-xs text-muted-foreground">
              Optional. Set this to charge this student a different amount than
              the rest of the group.
            </p>
          </div>

          <div className="flex items-center gap-2 md:col-span-2">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              defaultChecked={defaults?.isActive ?? true}
              className="size-4 rounded border-border"
            />
            <Label htmlFor="isActive" className="cursor-pointer">
              Active student
            </Label>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" name="notes" rows={4} defaultValue={defaults?.notes} />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
