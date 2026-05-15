"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function SettingsForm({
  defaults,
  action,
}: {
  defaults: { academyName: string; defaultFee: number; whatsappCountry: string };
  action: (formData: FormData) => Promise<{ success: true } | { success: false; error: string }>;
}) {
  const [pending, startTransition] = useTransition();

  const onSubmit = (formData: FormData) => {
    startTransition(async () => {
      const res = await action(formData);
      if (res.success) toast.success("Settings saved");
      else toast.error(res.error);
    });
  };

  return (
    <form action={onSubmit} className="space-y-6">
      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="academyName">Academy name</Label>
            <Input
              id="academyName"
              name="academyName"
              required
              defaultValue={defaults.academyName}
            />
            <p className="text-xs text-muted-foreground">
              Shown in the sidebar and on WhatsApp reminder messages.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="defaultFee">Default monthly fee</Label>
            <Input
              id="defaultFee"
              name="defaultFee"
              type="number"
              min={0}
              step="0.01"
              required
              defaultValue={defaults.defaultFee}
            />
            <p className="text-xs text-muted-foreground">
              Applied when generating invoices for students with no group.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsappCountry">WhatsApp country code</Label>
            <Input
              id="whatsappCountry"
              name="whatsappCountry"
              required
              defaultValue={defaults.whatsappCountry}
              placeholder="963"
            />
            <p className="text-xs text-muted-foreground">
              Digits only. Prepended to local phone numbers (drops a leading 0).
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          Save settings
        </Button>
      </div>
    </form>
  );
}
