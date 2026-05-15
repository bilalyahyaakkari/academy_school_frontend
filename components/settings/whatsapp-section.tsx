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
  DEFAULT_WHATSAPP_TEMPLATE,
} from "@/lib/utils";
import { useT } from "@/lib/i18n/client";

const SAMPLE_MONTH = new Date().getMonth() + 1;
const SAMPLE_AMOUNT = 25;
const SAMPLE_STUDENT = "علي حسن";

const PLACEHOLDERS = [
  { token: "{month}", desc: "Arabic month name" },
  { token: "{year}", desc: "4-digit year" },
  { token: "{amount}", desc: "fee amount" },
  { token: "{student}", desc: "student name" },
  { token: "{academy}", desc: "academy name" },
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

  const previewMessage = applyTemplate(template, {
    month: ARABIC_MONTH_NAMES[SAMPLE_MONTH - 1],
    year: String(new Date().getFullYear()),
    amount: SAMPLE_AMOUNT.toFixed(2),
    student: SAMPLE_STUDENT,
    academy: defaults.academyName,
  });

  const onSubmit = (formData: FormData) => {
    formData.set("academyName", defaults.academyName);
    formData.set("defaultFee", String(defaults.defaultFee));
    formData.set("whatsappCountry", defaults.whatsappCountry);
    formData.set("whatsappTemplate", template);
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

  const isCustom = template.trim() !== DEFAULT_WHATSAPP_TEMPLATE.trim();

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-lg">
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-500 to-teal-400"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-44 animate-drift-2 rounded-full bg-emerald-400/20 blur-3xl"
      />
      <CardContent className="relative pt-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
            <MessageCircle className="size-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold tracking-tight">
              {t("settings.whatsapp.title")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("settings.whatsapp.desc")}
            </p>
          </div>
          {isCustom && (
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              {t("settings.whatsapp.customBadge")}
            </span>
          )}
        </div>

        <form action={onSubmit} className="space-y-4">
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
                      title={p.desc}
                      className="rounded-md border border-border bg-card px-2 py-1 font-mono text-xs transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
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
              <div className="relative rounded-2xl bg-[#e7ddd2] p-4 shadow-inner dark:bg-slate-800">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.06]"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 4px 4px, currentColor 1px, transparent 0)",
                    backgroundSize: "12px 12px",
                  }}
                />
                <div className="relative ml-auto max-w-[90%] rounded-2xl rounded-tr-sm bg-[#dcf8c6] p-3 text-sm text-slate-900 shadow dark:bg-emerald-700 dark:text-white">
                  <p className="whitespace-pre-wrap text-right" dir="rtl">
                    {renderWhatsAppFormatting(previewMessage)}
                  </p>
                  <p className="mt-1 text-right text-[10px] text-slate-600 dark:text-emerald-200">
                    ✓✓{" "}
                    {new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <p className="relative mt-3 text-center text-[10px] text-slate-600 dark:text-slate-400">
                  {t("settings.whatsapp.sampleNote", {
                    month: ARABIC_MONTH_NAMES[SAMPLE_MONTH - 1],
                    amount: `$${SAMPLE_AMOUNT}.00`,
                    student: SAMPLE_STUDENT,
                  })}
                </p>
              </div>
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

/**
 * Lightweight WhatsApp formatting renderer for the preview only — turns
 * `*bold*` into actual bold text inside the chat bubble.
 */
function renderWhatsAppFormatting(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re = /\*([^*\n]+?)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <strong key={`b-${i++}`} className="font-bold">
        {match[1]}
      </strong>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
