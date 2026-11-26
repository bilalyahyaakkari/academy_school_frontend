"use client";

import { useState, useTransition } from "react";
import { updateSettings } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import type { Settings } from "@/lib/api/types";

type DiscountType = Settings["siblingDiscountType"];

const TYPES: DiscountType[] = ["NONE", "PERCENT", "FIXED"];

/** Sibling discount on monthly fees: none, a percentage, or a fixed amount. */
export function SiblingDiscountSection({
  defaults,
}: {
  defaults: {
    academyName: string;
    defaultFee: number;
    whatsappCountry: string;
    siblingDiscountType: DiscountType;
    siblingDiscountValue: number;
  };
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<DiscountType>(defaults.siblingDiscountType ?? "NONE");
  const [value, setValue] = useState<string>(
    defaults.siblingDiscountType === "NONE" ? "" : String(defaults.siblingDiscountValue ?? ""),
  );

  const numeric = Number(value);
  const valueError =
    type === "NONE" || value === ""
      ? null
      : !Number.isFinite(numeric) || numeric < 0
        ? t("payments.settings.discount.err.value")
        : type === "PERCENT" && numeric > 100
          ? t("payments.settings.discount.err.percent")
          : null;

  // A worked example on the default fee, so "10" reads unambiguously.
  const exampleFee = defaults.defaultFee > 0 ? defaults.defaultFee : 50;
  const exampleAmount =
    type === "PERCENT"
      ? exampleFee * (1 - Math.min(100, Math.max(0, numeric)) / 100)
      : Math.max(0, exampleFee - Math.max(0, numeric));
  const showExample = type !== "NONE" && value !== "" && !valueError && numeric > 0;

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (valueError) return;
    const formData = new FormData();
    // PUT /settings requires these — send the current values along.
    formData.set("academyName", defaults.academyName);
    formData.set("defaultFee", String(defaults.defaultFee));
    formData.set("whatsappCountry", defaults.whatsappCountry);
    formData.set("siblingDiscountType", type);
    formData.set("siblingDiscountValue", type === "NONE" ? "0" : value || "0");
    startTransition(async () => {
      const res = await updateSettings(formData);
      if (res.success) toast.success(t("payments.settings.discount.toast.saved"));
      else toast.error(res.error);
    });
  };

  const unit = type === "PERCENT" ? "%" : "$";

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-sea-900" />
      <CardContent className="relative pt-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-sea-100 text-sea-800">
            <Users className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-sea-900">
              {t("payments.settings.discount.title")}
            </h2>
            <p className="text-xs text-muted-foreground">{t("payments.settings.discount.desc")}</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="siblingDiscountType">{t("payments.settings.discount.type")}</Label>
            <Select value={type} onValueChange={(v) => setType(v as DiscountType)}>
              <SelectTrigger id="siblingDiscountType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPES.map((ty) => (
                  <SelectItem key={ty} value={ty}>
                    {t(`payments.settings.discount.${ty}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="siblingDiscountValue">{t("payments.settings.discount.value")}</Label>
            <div className="relative" dir="ltr">
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute top-1/2 -translate-y-1/2 text-sm text-muted-foreground",
                  // "10 %" / "$ 10": the unit sits where it's read.
                  type === "PERCENT" ? "end-3" : "start-3",
                )}
              >
                {unit}
              </span>
              <Input
                id="siblingDiscountValue"
                type="number"
                inputMode="decimal"
                min={0}
                max={type === "PERCENT" ? 100 : undefined}
                step="0.01"
                required={type !== "NONE"}
                disabled={type === "NONE"}
                value={type === "NONE" ? "" : value}
                onChange={(e) => setValue(e.target.value)}
                aria-invalid={valueError ? true : undefined}
                aria-describedby="siblingDiscountHelp"
                className={type === "PERCENT" ? "pe-7" : "ps-7"}
              />
            </div>
            {valueError && <p className="text-xs text-destructive">{valueError}</p>}
          </div>

          <div id="siblingDiscountHelp" className="space-y-1 md:col-span-2">
            <p className="text-xs text-muted-foreground">{t("payments.settings.discount.help")}</p>
            {showExample && (
              <p className="text-xs text-sea-700">
                {t("payments.settings.discount.example", {
                  fee: formatCurrency(exampleFee),
                  amount: formatCurrency(exampleAmount),
                })}
              </p>
            )}
          </div>

          <div className="flex justify-end md:col-span-2">
            <Button type="submit" disabled={pending || valueError !== null}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {t("payments.settings.discount.submit")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
