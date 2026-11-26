"use client";

import { useState, useTransition } from "react";
import { updateSettings } from "@/lib/actions/settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Receipt, RotateCcw } from "lucide-react";
import {
  currentYearMonth,
  DEFAULT_RECEIPT_TEMPLATE,
  formatCurrency,
  todayIso,
  whatsappReceiptUrl,
} from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/client";
import { monthLabelI18n, type TranslationKey } from "@/lib/i18n";
import { useClientTime, WhatsAppBubble } from "@/components/payments/whatsapp-preview";

const SAMPLE_AMOUNT = 30;
const SAMPLE_STUDENT = "علي حسن";

const PLACEHOLDERS: { token: string; desc: TranslationKey }[] = [
  { token: "{student}", desc: "payments.whatsapp.ph.student" },
  { token: "{amount}", desc: "payments.receipt.ph.amount" },
  { token: "{item}", desc: "payments.receipt.ph.item" },
  { token: "{remaining}", desc: "payments.receipt.ph.remaining" },
  { token: "{date}", desc: "payments.receipt.ph.date" },
  { token: "{academy}", desc: "payments.whatsapp.ph.academy" },
];

/** WhatsApp receipt template editor — mirrors the reminder template editor. */
export function ReceiptTemplateSection({
  defaults,
}: {
  defaults: {
    academyName: string;
    defaultFee: number;
    whatsappCountry: string;
    whatsappReceiptTemplate: string | null;
  };
}) {
  const t = useT();
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const [template, setTemplate] = useState(
    defaults.whatsappReceiptTemplate ?? DEFAULT_RECEIPT_TEMPLATE,
  );

  const sample = currentYearMonth();
  const time = useClientTime();

  // Built by the same function that sends real receipts, with a stand-in
  // phone number, so the preview can never drift from the actual message.
  const sampleUrl = whatsappReceiptUrl({
    phoneNumber: "+0",
    countryCode: defaults.whatsappCountry,
    studentName: SAMPLE_STUDENT,
    academyName: defaults.academyName,
    amount: SAMPLE_AMOUNT,
    remaining: 0,
    date: todayIso(),
    item: { kind: "FEE", month: sample.month, year: sample.year },
    template,
  });
  const previewMessage = sampleUrl ? (new URL(sampleUrl).searchParams.get("text") ?? "") : "";

  const isCustom = template.trim() !== DEFAULT_RECEIPT_TEMPLATE.trim();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData();
    // PUT /settings requires these — send the current values along.
    formData.set("academyName", defaults.academyName);
    formData.set("defaultFee", String(defaults.defaultFee));
    formData.set("whatsappCountry", defaults.whatsappCountry);
    // Same text as the built-in default → send empty, stored as null.
    formData.set("whatsappReceiptTemplate", isCustom ? template : "");
    startTransition(async () => {
      const res = await updateSettings(formData);
      if (res.success) toast.success(t("payments.settings.receipt.toast.saved"));
      else toast.error(res.error);
    });
  };

  const resetToDefault = () => {
    setTemplate(DEFAULT_RECEIPT_TEMPLATE);
    toast.info(t("settings.whatsapp.toast.reset"));
  };

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <span aria-hidden className="absolute inset-x-0 top-0 h-1 bg-sea-500" />
      <CardContent className="relative pt-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-sea-100 text-sea-800">
            <Receipt className="size-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold tracking-tight text-sea-900">
              {t("payments.settings.receipt.title")}
            </h2>
            <p className="text-xs text-muted-foreground">{t("payments.settings.receipt.desc")}</p>
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
                <Label htmlFor="whatsappReceiptTemplate">{t("settings.whatsapp.template")}</Label>
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
                id="whatsappReceiptTemplate"
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
                      onClick={() => setTemplate((prev) => prev + p.token)}
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
                footer={t("payments.settings.receipt.sampleNote", {
                  item: monthLabelI18n(locale, sample.month, sample.year),
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
