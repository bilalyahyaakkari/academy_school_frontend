"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cancelSession, uncancelSession } from "@/lib/actions/attendance";
import { cn, formatDateOnly, whatsappShareUrl } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/client";
import { translate, type TranslationKey } from "@/lib/i18n";
import { toast } from "sonner";
import { CalendarX, Loader2, MessageCircle, RotateCcw } from "lucide-react";

const REASONS = ["rain", "holiday", "field", "other"] as const;
type ReasonKey = (typeof REASONS)[number];

const REASON_LABEL: Record<ReasonKey, TranslationKey> = {
  rain: "attendance.cancel.reason.rain",
  holiday: "attendance.cancel.reason.holiday",
  field: "attendance.cancel.reason.field",
  other: "attendance.cancel.reason.other",
};

/**
 * The parents' message is always Arabic. A reason picked from the chips is
 * stored in whatever language the admin was using, so map it back to Arabic.
 */
function arabicReason(reason: string): string {
  const trimmed = reason.trim();
  for (const key of ["rain", "holiday", "field"] as const) {
    const k = REASON_LABEL[key];
    if (trimmed === translate("en", k) || trimmed === translate("ar", k)) {
      return translate("ar", k);
    }
  }
  return trimmed;
}

function shareMessage({
  groupName,
  date,
  reason,
  isToday,
}: {
  groupName: string;
  date: string;
  reason: string | null;
  isToday: boolean;
}): string {
  const vars = {
    group: groupName.trim(),
    date: formatDateOnly(date, "ar"),
    reason: reason ? arabicReason(reason) : "",
  };
  const key: TranslationKey = isToday
    ? reason
      ? "attendance.cancel.share.today"
      : "attendance.cancel.share.todayNoReason"
    : reason
      ? "attendance.cancel.share.day"
      : "attendance.cancel.share.dayNoReason";
  return translate("ar", key, vars);
}

/** "Cancel session" in the panel header: reason chips, then cancelDay. */
export function CancelSessionButton({
  groupId,
  groupName,
  date,
}: {
  groupId: string;
  groupName: string;
  /** YYYY-MM-DD */
  date: string;
}) {
  const t = useT();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReasonKey | null>(null);
  const [other, setOther] = useState("");
  const [pending, startTransition] = useTransition();

  const reset = () => {
    setReason(null);
    setOther("");
  };

  const onConfirm = () => {
    const text =
      reason === "other" ? other.trim() : reason ? t(REASON_LABEL[reason]) : "";
    startTransition(async () => {
      const res = await cancelSession(groupId, date, text || undefined);
      if (res.success === false) {
        toast.error(res.error);
        return;
      }
      toast.success(t("attendance.cancel.toast"));
      setOpen(false);
      reset();
    });
  };

  return (
    <>
      <Button variant="outline" size="sm" className="shrink-0" onClick={() => setOpen(true)}>
        <CalendarX />
        {t("attendance.cancel.action")}
      </Button>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (pending) return;
          setOpen(o);
          if (!o) reset();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("attendance.cancel.title", { group: groupName })}</DialogTitle>
            <DialogDescription>
              {t("attendance.cancel.desc", { date: formatDateOnly(date, locale) })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <p id="cancel-reason-label" className="text-sm font-medium">
              {t("attendance.cancel.reason")}
            </p>
            <div role="group" aria-labelledby="cancel-reason-label" className="flex flex-wrap gap-2">
              {REASONS.map((key) => {
                const active = reason === key;
                return (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setReason(active ? null : key)}
                    disabled={pending}
                    className={cn(
                      "inline-flex h-10 items-center rounded-full border px-4 text-sm font-medium transition-colors sm:h-9",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    {t(REASON_LABEL[key])}
                  </button>
                );
              })}
            </div>
            {reason === "other" && (
              <div className="space-y-2">
                <Label htmlFor="cancel-other">{t("attendance.cancel.otherLabel")}</Label>
                <Input
                  id="cancel-other"
                  autoFocus
                  maxLength={200}
                  value={other}
                  placeholder={t("attendance.cancel.otherPlaceholder")}
                  onChange={(e) => setOther(e.target.value)}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
              {t("attendance.cancel.keep")}
            </Button>
            <Button onClick={onConfirm} disabled={pending}>
              {pending ? <Loader2 className="animate-spin" /> : <CalendarX />}
              {t("attendance.cancel.action")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Shown instead of the register on a cancelled day. */
export function CancelledBanner({
  groupId,
  groupName,
  date,
  reason,
  isToday,
  trialsCount = 0,
}: {
  groupId: string;
  groupName: string;
  /** YYYY-MM-DD */
  date: string;
  reason: string | null;
  isToday: boolean;
  /** Children who were coming to try this group that day. */
  trialsCount?: number;
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const shareUrl = whatsappShareUrl(shareMessage({ groupName, date, reason, isToday }));

  const onUndo = () => {
    startTransition(async () => {
      const res = await uncancelSession(groupId, date);
      if (res.success === false) {
        toast.error(res.error);
        return;
      }
      toast.success(t("attendance.uncancel.toast"));
    });
  };

  return (
    <div className="rounded-lg border border-sea-300/70 bg-sea-100/60 p-4 sm:p-5 dark:bg-sea-900/40">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-full bg-card text-sea-800"
        >
          <CalendarX className="size-5" />
        </span>
        <div className="min-w-0 flex-1" role="status">
          <p className="font-semibold text-sea-900 dark:text-sea-100">
            {reason
              ? t("attendance.cancelled.banner", { reason })
              : t("attendance.cancelled.bannerNoReason")}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{t("attendance.cancelled.sub")}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">
        <Button asChild>
          <a href={shareUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle />
            {t("attendance.cancelled.share")}
          </a>
        </Button>
        <Button variant="ghost" onClick={onUndo} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <RotateCcw />}
          {t("attendance.cancelled.undo")}
        </Button>
      </div>

      {trialsCount > 0 && (
        <p className="mt-4 border-t border-sea-300/60 pt-3 text-xs text-muted-foreground">
          {trialsCount === 1
            ? t("attendance.trials.cancelledHint.one")
            : t("attendance.trials.cancelledHint", { count: trialsCount })}{" "}
          <Link href="/trials" className="font-medium text-sea-700 hover:underline">
            {t("attendance.trials.manage")}
          </Link>
        </p>
      )}
    </div>
  );
}
