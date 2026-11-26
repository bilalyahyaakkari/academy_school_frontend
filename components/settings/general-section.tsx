"use client";

import { useTransition } from "react";
import { updateSettings } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/lib/i18n/client";
import { toast } from "sonner";
import { Loader2, Settings as SettingsIcon } from "lucide-react";

export function GeneralSection({
  defaults,
}: {
  defaults: { academyName: string; defaultFee: number; whatsappCountry: string };
}) {
  const [pending, startTransition] = useTransition();
  const t = useT();

  // onSubmit rather than <form action>: React 19 resets an action form's
  // uncontrolled fields after every submit, so a failed save would wipe the
  // edits back to the old values.
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateSettings(formData);
      if (res.success) toast.success(t("settings.general.toast.saved"));
      else toast.error(res.error);
    });
  };

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 bg-sea-800"
      />
      <CardContent className="relative pt-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-sea-100 text-sea-800">
            <SettingsIcon className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-sea-900">
              {t("settings.general.title")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("settings.general.desc")}
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="academyName">
              {t("settings.general.academyName")}
            </Label>
            <Input
              id="academyName"
              name="academyName"
              required
              defaultValue={defaults.academyName}
            />
            <p className="text-xs text-muted-foreground">
              {t("settings.general.academyName.help")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="defaultFee">
              {t("settings.general.defaultFee")}
            </Label>
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
              {t("settings.general.defaultFee.help")}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsappCountry">
              {t("settings.general.country")}
            </Label>
            <div className="relative">
              <span className="absolute start-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                +
              </span>
              <Input
                id="whatsappCountry"
                name="whatsappCountry"
                required
                defaultValue={defaults.whatsappCountry}
                placeholder="963"
                className="ps-7"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("settings.general.country.help", {
                code1: "963",
                code2: "961",
                code3: "20",
              })}
            </p>
          </div>

          <div className="md:col-span-2 flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {t("settings.general.submit")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
