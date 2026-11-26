"use client";

import { useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ScheduleEditor } from "./schedule-editor";
import { toast } from "sonner";
import { CalendarDays, Loader2 } from "lucide-react";
import type { ScheduleSlot } from "@/lib/api/types";
import { useT } from "@/lib/i18n/client";

export type GroupFormDefaults = {
  name?: string;
  minAge?: number | null;
  maxAge?: number | null;
  schedule?: ScheduleSlot[];
  monthlyFee?: number;
  maxCapacity?: number | null;
  coachName?: string | null;
};

export function GroupForm({
  defaults,
  action,
  submitLabel,
}: {
  defaults?: GroupFormDefaults;
  action: (formData: FormData) => Promise<{ success: true } | { success: false; error: string } | undefined>;
  submitLabel?: string;
}) {
  const router = useRouter();
  const t = useT();
  const [pending, startTransition] = useTransition();

  // onSubmit (not <form action>): React 19 resets an uncontrolled form after a
  // form action runs — even when it returns an error — wiping the input.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await action(formData);
      if (res && res.success === false) toast.error(res.error);
    });
  };

  return (
    <form onSubmit={onSubmit} className="max-w-3xl space-y-6">
      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">{t("groups.form.name")} *</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder={t("groups.form.name.placeholder")}
              defaultValue={defaults?.name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minAge">{t("groups.form.minAge")}</Label>
            <Input
              id="minAge"
              name="minAge"
              type="number"
              min={0}
              defaultValue={defaults?.minAge ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxAge">{t("groups.form.maxAge")}</Label>
            <Input
              id="maxAge"
              name="maxAge"
              type="number"
              min={0}
              defaultValue={defaults?.maxAge ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="monthlyFee">{t("groups.form.fee")} *</Label>
            <Input
              id="monthlyFee"
              name="monthlyFee"
              type="number"
              step="0.01"
              min={0}
              required
              defaultValue={defaults?.monthlyFee ?? 0}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxCapacity">{t("groups.form.capacity")}</Label>
            <Input
              id="maxCapacity"
              name="maxCapacity"
              type="number"
              min={1}
              defaultValue={defaults?.maxCapacity ?? ""}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="coachName">{t("groups.form.coach")}</Label>
            <Input
              id="coachName"
              name="coachName"
              defaultValue={defaults?.coachName ?? ""}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 pt-6">
          <h3 className="flex items-center gap-2 font-semibold">
            <span
              aria-hidden
              className="grid size-7 place-items-center rounded-md bg-sea-100 text-sea-900"
            >
              <CalendarDays className="size-4" />
            </span>
            {t("groups.form.schedule")}
          </h3>
          <ScheduleEditor defaultValue={defaults?.schedule} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
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
