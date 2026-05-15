"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ScheduleEditor } from "./schedule-editor";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { ScheduleSlot } from "@/lib/api/types";

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
  submitLabel = "Save",
}: {
  defaults?: GroupFormDefaults;
  action: (formData: FormData) => Promise<{ success: true } | { success: false; error: string } | undefined>;
  submitLabel?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      const res = await action(formData);
      if (res && res.success === false) toast.error(res.error);
    });
  };

  return (
    <form action={onSubmit} className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="e.g. Group A — 6–8 years"
              defaultValue={defaults?.name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minAge">Min age</Label>
            <Input
              id="minAge"
              name="minAge"
              type="number"
              min={0}
              defaultValue={defaults?.minAge ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxAge">Max age</Label>
            <Input
              id="maxAge"
              name="maxAge"
              type="number"
              min={0}
              defaultValue={defaults?.maxAge ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="monthlyFee">Monthly fee *</Label>
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
            <Label htmlFor="maxCapacity">Max capacity</Label>
            <Input
              id="maxCapacity"
              name="maxCapacity"
              type="number"
              min={1}
              defaultValue={defaults?.maxCapacity ?? ""}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="coachName">Coach</Label>
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
          <h3 className="font-medium">Schedule</h3>
          <ScheduleEditor defaultValue={defaults?.schedule} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
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
