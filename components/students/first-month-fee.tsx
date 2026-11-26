"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getFirstMonthQuote } from "@/lib/actions/students";
import type { FirstMonthQuote } from "@/lib/api/types";
import { useLocale, useT } from "@/lib/i18n/client";
import { monthLabelI18n } from "@/lib/i18n";
import { cn, currentYearMonth, dayOfMonth, formatCurrency, todayIso } from "@/lib/utils";
import { Info, Loader2, Lock } from "lucide-react";

type Mode = "FULL" | "PRORATED" | "MANUAL";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DEBOUNCE_MS = 350;

/** "" → null (inherit), "30" → 30, junk → null. */
function parseFee(raw: string | null | undefined): number | null {
  const s = (raw ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/**
 * "Training start date" + how to bill the first month when the child starts
 * mid-month. Shared by the new-student form and the trial "Join as student"
 * dialog. Posts (inside the parent <form>):
 *   - `trainingStartDate`  YYYY-MM-DD
 *   - `firstMonthMode`     FULL | PRORATED | MANUAL (only when the options show)
 *   - `firstMonthAmount`   the approved amount (PRORATED / MANUAL)
 * The server actions turn these into `trainingStartDate` + `firstMonth`.
 */
export function FirstMonthFee({
  groupId,
  feeOverride,
  defaultStartDate,
}: {
  /** The selected group (null = none). */
  groupId: string | null;
  /** The form's "monthly fee (override)" field as typed ("" = inherit). */
  feeOverride?: string;
  defaultStartDate?: string;
}) {
  const t = useT();
  const locale = useLocale();
  const uid = useId();
  const [startDate, setStartDate] = useState(defaultStartDate ?? todayIso());
  const [mode, setMode] = useState<Mode>("FULL");
  const [proratedAmount, setProratedAmount] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [result, setResult] = useState<
    { key: string; quote: FirstMonthQuote | null; error: string | null } | null
  >(null);

  const fee = parseFee(feeOverride);
  const validDate = ISO_DATE.test(startDate);
  const key = `${startDate}|${groupId ?? ""}|${fee ?? ""}`;

  // Debounced quote: date, group or fee override changed → ask the backend.
  useEffect(() => {
    if (!validDate) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const res = await getFirstMonthQuote({ startDate, groupId, monthlyFee: fee });
      if (cancelled) return;
      if (res.success) {
        setResult({ key, quote: res.quote, error: null });
        // Prefill the prorated amount with the fresh suggestion.
        setProratedAmount(res.quote.suggested != null ? String(res.quote.suggested) : "");
        if (res.quote.suggested == null) setMode((m) => (m === "PRORATED" ? "FULL" : m));
      } else {
        setResult({ key, quote: null, error: res.error });
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key, startDate, groupId, fee, validDate]);

  const fresh = validDate && result?.key === key ? result : null;
  const quote = fresh?.quote ?? null;
  const loading = validDate && !fresh;

  const cur = currentYearMonth();
  const pastMonth =
    quote != null && quote.year * 12 + quote.month < cur.year * 12 + cur.month;
  // Mid-month per the backend — or a group with no sessions that month and a
  // start after the 1st (then only "Custom amount" makes sense).
  const showOptions =
    quote != null &&
    !pastMonth &&
    (quote.midMonth || (quote.total === 0 && !!groupId && dayOfMonth(startDate) > 1));
  const effectiveMode: Mode = showOptions ? mode : "FULL";
  const amount =
    effectiveMode === "PRORATED" ? proratedAmount : effectiveMode === "MANUAL" ? manualAmount : "";

  const monthName = quote ? monthLabelI18n(locale, quote.month, quote.year) : "";
  const remainingDays = quote
    ? quote.sessions.filter((d) => d.slice(0, 10) >= startDate).map((d) => dayOfMonth(d))
    : [];

  let note: ReactNode = null;
  if (loading) {
    note = (
      <span className="inline-flex items-center gap-1.5">
        <Loader2 aria-hidden className="size-3.5 animate-spin" />
        {t("firstMonth.loading")}
      </span>
    );
  } else if (fresh?.error) {
    note = <span className="text-alert">{fresh.error}</span>;
  } else if (quote && !showOptions) {
    note = pastMonth
      ? t("firstMonth.note.pastMonth")
      : !groupId
        ? t("firstMonth.note.noGroup")
        : quote.total === 0
          ? t("firstMonth.note.noSessions", { month: monthName })
          : t("firstMonth.note.full", { month: monthName });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor={`${uid}-start`}>{t("firstMonth.startDate")}</Label>
        <Input
          id={`${uid}-start`}
          name="trainingStartDate"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-full sm:max-w-56"
        />
        {note && (
          <p aria-live="polite" className="flex items-start gap-1.5 text-xs text-muted-foreground">
            {!loading && !fresh?.error && <Info aria-hidden className="mt-px size-3.5 shrink-0" />}
            <span>{note}</span>
          </p>
        )}
      </div>

      {showOptions && quote && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t("firstMonth.title")}</legend>
          {quote.midMonth && (
            <p className="text-xs text-muted-foreground">
              {t("firstMonth.midMonth", {
                remaining: quote.remaining,
                total: quote.total,
                month: monthName,
              })}
            </p>
          )}
          {effectiveMode !== "FULL" && <input type="hidden" name="firstMonthAmount" value={amount} />}

          <div className="grid gap-2">
            <OptionCard
              name={`${uid}-mode`}
              value="FULL"
              checked={effectiveMode === "FULL"}
              onSelect={setMode}
              title={t("firstMonth.option.full")}
              sub={t("firstMonth.option.full.sub", { fee: formatCurrency(quote.monthlyFee) })}
            />

            <OptionCard
              name={`${uid}-mode`}
              value="PRORATED"
              checked={effectiveMode === "PRORATED"}
              disabled={quote.suggested == null}
              onSelect={setMode}
              title={t("firstMonth.option.prorated")}
              sub={
                quote.suggested == null ? (
                  t("firstMonth.option.prorated.none")
                ) : (
                  <>
                    <span className="block font-medium text-foreground">
                      {t("firstMonth.option.prorated.calc", {
                        fee: formatCurrency(quote.monthlyFee),
                        remaining: quote.remaining,
                        total: quote.total,
                        amount: formatCurrency(quote.suggested),
                      })}
                    </span>
                    {remainingDays.length > 0 && (
                      <span className="mt-0.5 block tabular-nums">
                        {t("firstMonth.sessionsLeft", {
                          days: remainingDays.join(locale === "ar" ? "، " : ", "),
                        })}
                      </span>
                    )}
                  </>
                )
              }
            >
              <AmountInput
                id={`${uid}-prorated`}
                label={t("firstMonth.amount", { month: monthName })}
                value={proratedAmount}
                onChange={setProratedAmount}
              />
            </OptionCard>

            <OptionCard
              name={`${uid}-mode`}
              value="MANUAL"
              checked={effectiveMode === "MANUAL"}
              onSelect={setMode}
              title={t("firstMonth.option.manual")}
              sub={t("firstMonth.option.manual.sub")}
            >
              <AmountInput
                id={`${uid}-manual`}
                label={t("firstMonth.amount", { month: monthName })}
                value={manualAmount}
                onChange={setManualAmount}
                autoFocus
              />
            </OptionCard>
          </div>

          {/* The chosen mode, posted under one stable name. */}
          <input type="hidden" name="firstMonthMode" value={effectiveMode} />

          {effectiveMode !== "FULL" && (
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <Lock aria-hidden className="mt-px size-3.5 shrink-0" />
              <span>{t("firstMonth.lockedNote", { month: monthName })}</span>
            </p>
          )}
        </fieldset>
      )}
    </div>
  );
}

/** One radio card. `children` (the amount field) shows only while selected. */
function OptionCard({
  name,
  value,
  checked,
  disabled,
  onSelect,
  title,
  sub,
  children,
}: {
  name: string;
  value: Mode;
  checked: boolean;
  disabled?: boolean;
  onSelect: (mode: Mode) => void;
  title: string;
  sub: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-card p-3 transition-colors",
        checked ? "border-primary bg-accent ring-1 ring-primary" : "border-border",
        !checked && !disabled && "hover:border-sea-300",
        disabled && "opacity-60",
      )}
    >
      <label
        className={cn("flex items-start gap-3", disabled ? "cursor-not-allowed" : "cursor-pointer")}
      >
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={() => onSelect(value)}
          className="mt-0.5 size-4 shrink-0 accent-primary"
        />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{title}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{sub}</span>
        </span>
      </label>
      {checked && children && <div className="mt-3 ps-7">{children}</div>}
    </div>
  );
}

function AmountInput({
  id,
  label,
  value,
  onChange,
  autoFocus,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <div className="relative w-full sm:max-w-40" dir="ltr">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 start-3 flex items-center text-sm text-muted-foreground"
        >
          $
        </span>
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          step="0.01"
          min={0}
          max={1000000}
          required
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="ps-7 tabular-nums"
        />
      </div>
    </div>
  );
}
