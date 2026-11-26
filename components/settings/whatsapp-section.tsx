"use client";

import { useState, useTransition } from "react";
import { updateSettings } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, MessageCircle, RotateCcw } from "lucide-react";
import {
  applyTemplate,
  ARABIC_MONTH_NAMES,
  currentYearMonth,
  DEFAULT_WHATSAPP_TEMPLATE,
  formatCurrency,
} from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import type { TranslationKey } from "@/lib/i18n";
import { useClientTime, WhatsAppBubble } from "@/components/payments/whatsapp-preview";

const SAMPLE_AMOUNT = 25;
const SAMPLE_STUDENT = "علي حسن";

const PLACEHOLDERS: { token: string; desc: TranslationKey }[] = [
  { token: "{month}", desc: "payments.whatsapp.ph.month" },
  { token: "{year}", desc: "payments.whatsapp.ph.year" },
  { token: "{amount}", desc: "payments.whatsapp.ph.amount" },
  { token: "{student}", desc: "payments.whatsapp.ph.student" },
  { token: "{academy}", desc: "payments.whatsapp.ph.academy" },
];

export function WhatsAppSection({
  defaults,
}: {
  defaults: {
    academyName: string;
    defaultFee: number;
    whatsappCountry: string;
    whatsappTemplate: string | null;
  };
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [template, setTemplate] = useState(
    defaults.whatsappTemplate ?? DEFAULT_WHATSAPP_TEMPLATE,
  );

  const sample = currentYearMonth();
  const time = useClientTime();

  const previewMessage = applyTemplate(template, {
    month: ARABIC_MONTH_NAMES[sample.month - 1],
    year: String(sample.year),
    amount: SAMPLE_AMOUNT.toFixed(2),
    student: SAMPLE_STUDENT,
    academy: defaults.academyName,
  });

  const isCustom = template.trim() !== DEFAULT_WHATSAPP_TEMPLATE.trim();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set("academyName", defaults.academyName);
    formData.set("defaultFee", String(defaults.defaultFee));
    formData.set("whatsappCountry", defaults.whatsappCountry);
    // Same text as the built-in default (e.g. after "Reset") → send empty,
    // which is stored as null: "use the default", not a frozen copy of it.
    formData.set("whatsappTemplate", isCustom ? template : "");
    startTransition(async () => {
      const res = await updateSettings(formData);
      if (res.success) toast.success(t("settings.whatsapp.toast.saved"));
      else toast.error(res.error);
    });
  };

  const insertPlaceholder = (token: string) => {
    setTemplate((prev) => prev + token);
  };

  const resetToDefault = () => {
    setTemplate(DEFAULT_WHATSAPP_TEMPLATE);
    toast.info(t("settings.whatsapp.toast.reset"));
  };

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 bg-sea-700"
      />
      <CardContent className="relative pt-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-sea-100 text-sea-800">
            <MessageCircle className="size-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold tracking-tight text-sea-900">
              {t("settings.whatsapp.title")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("settings.whatsapp.desc")}
            </p>
          </div>
          {isCustom && (
            <span className="rounded-full bg-sea-100 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-sea-900">
              {t("settings.whatsapp.customBadge")}
            </span>
          )}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,1fr)]">
            {/* Editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="whatsappTemplate">
                  {t("settings.whatsapp.template")}
                </Label>
                <button
                  type="button"
                  onClick={resetToDefault}
                  className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <RotateCcw className="size-3" />
                  {t("settings.whatsapp.reset")}
                </button>
              </div>
              <Textarea
                id="whatsappTemplate"
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                rows={9}
                dir="rtl"
                className="font-mono text-sm leading-relaxed"
              />

              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {t("settings.whatsapp.placeholdersTitle")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PLACEHOLDERS.map((p) => (
                    <button
                      key={p.token}
                      type="button"
                      onClick={() => insertPlaceholder(p.token)}
                      title={t(p.desc)}
                      aria-label={`${p.token} — ${t(p.desc)}`}
                      className="rounded-md border border-border bg-card px-2 py-1 font-mono text-xs transition-colors hover:border-sea-300 hover:bg-sea-100 hover:text-sea-900"
                    >
                      {p.token}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live preview */}
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {t("settings.whatsapp.preview")}
              </p>
              <WhatsAppBubble
                text={previewMessage}
                time={time}
                footer={t("settings.whatsapp.sampleNote", {
                  month: ARABIC_MONTH_NAMES[sample.month - 1],
                  amount: formatCurrency(SAMPLE_AMOUNT),
                  student: SAMPLE_STUDENT,
                })}
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {t("settings.whatsapp.submit")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
