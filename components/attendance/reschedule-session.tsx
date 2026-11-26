"use client";

import Link from "next/link";
import { useId, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { previewReschedule, rescheduleSession, undoReschedule } from "@/lib/actions/attendance";
import type { ReschedulePreview } from "@/lib/api/types";
import { whatsappShareUrl } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/client";
import { dayLabel, isoDay, rescheduleShareText, timeRange } from "./session-dates";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CircleCheck,
  Info,
  Loader2,
  MessageCircle,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";

type When = { date: string; startTime: string | null; endTime: string | null };

/** Placeholder for a node inside a translated sentence. */
const SLOT = "\u0000";

/** Puts `node` where SLOT sits in a translated string (times stay in a bdi). */
function withNode(text: string, node: ReactNode): ReactNode {
  const [before, after = ""] = text.split(SLOT);
  return (
    <>
      {before}
      {node}
      {after}
    </>
  );
}

/** "Thursday 26 Nov · 16:00–17:30", times kept left-to-right. */
function WhenText({ when, className }: { when: When; className?: string }) {
  const locale = useLocale();
  const time = timeRange(when.startTime, when.endTime);
  return (
    <span className={className}>
      {dayLabel(when.date, locale)}
      {time && (
        <>
          {" · "}
          <bdi dir="ltr" className="tabular-nums">
            {time}
          </bdi>
        </>
      )}
    </span>
  );
}

type Step = "edit" | "review" | "done";

/**
 * «Reschedule this session»: pick a new day / times → review the clashes and
 * what moves along → confirm → share the new time on WhatsApp. Only this one
 * session moves; the group's weekly schedule is untouched.
 */
export function RescheduleSessionButton({
  groupId,
  groupName,
  originalDate,
  current,
  afterMoveHref,
}: {
  groupId: string;
  groupName: string;
  /** The session's original day (YYYY-MM-DD) — its identity. */
  originalDate: string;
  /** Where / when it happens now. */
  current: When;
  /**
   * Where to keep the panel after the move. The Today list re-sorts once the
   * session leaves the day, so the URL is pinned to this group.
   */
  afterMoveHref?: string;
}) {
  const t = useT();
  const router = useRouter();
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("edit");
  const [newDate, setNewDate] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [preview, setPreview] = useState<ReschedulePreview | null>(null);
  const [ack, setAck] = useState(false);
  const [done, setDone] = useState<{ from: When; to: When } | null>(null);
  const [checking, startCheck] = useTransition();
  const [saving, startSave] = useTransition();
  const busy = checking || saving;

  const onOpenChange = (o: boolean) => {
    if (busy) return;
    if (o) {
      // Prefill with where the session is now.
      setNewDate(isoDay(current.date));
      setStart(current.startTime ?? "");
      setEnd(current.endTime ?? "");
      setStep("edit");
      setFormError(null);
      setPreview(null);
      setAck(false);
      setDone(null);
    }
    setOpen(o);
  };

  const body = () => ({ groupId, date: originalDate, newDate, startTime: start, endTime: end });

  const onReview = () => {
    if (!newDate || !start || !end) {
      setFormError(t("attendance.reschedule.required"));
      return;
    }
    if (end <= start) {
      setFormError(t("attendance.reschedule.endAfterStart"));
      return;
    }
    setFormError(null);
    startCheck(async () => {
      const res = await previewReschedule(body());
      if (res.success === false) {
        setFormError(res.error);
        return;
      }
      setPreview(res.data ?? null);
      setAck(false);
      setStep("review");
    });
  };

  const onConfirm = () => {
    startSave(async () => {
      const res = await rescheduleSession(body());
      if (res.success === false || !res.data) {
        toast.error(res.success === false ? res.error : t("attendance.error.reschedule"));
        return;
      }
      const { session, previous } = res.data;
      setDone({
        from: { date: previous.date, startTime: previous.startTime, endTime: previous.endTime },
        to: { date: session.actualDate, startTime: session.startTime, endTime: session.endTime },
      });
      setStep("done");
      toast.success(t("attendance.reschedule.done"));
      if (afterMoveHref) router.replace(afterMoveHref, { scroll: false });
    });
  };

  const conflicts = preview?.conflicts ?? [];
  const hasConflicts = conflicts.length > 0;
  const canConfirm = !!preview && !preview.unchanged && (!hasConflicts || ack);

  return (
    <>
      <Button variant="outline" size="sm" className="shrink-0" onClick={() => onOpenChange(true)}>
        <CalendarClock />
        {t("attendance.reschedule.action")}
      </Button>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle>
              {step === "done" ? t("attendance.reschedule.done") : t("attendance.reschedule.title")}
            </DialogTitle>
            <DialogDescription>
              {step === "done" && done
                ? withNode(
                    t("attendance.reschedule.doneDesc", { group: groupName, when: SLOT }),
                    <WhenText when={done.to} className="font-medium text-foreground" />,
                  )
                : t("attendance.reschedule.desc", { group: groupName })}
            </DialogDescription>
          </DialogHeader>

          {step === "edit" && (
            <form
              id={formId}
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                onReview();
              }}
            >
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("attendance.reschedule.current")}
                </p>
                <p className="mt-0.5 flex items-center gap-2 font-medium">
                  <CalendarDays aria-hidden className="size-4 shrink-0 text-sea-700" />
                  <WhenText when={current} />
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${formId}-date`}>{t("attendance.reschedule.newDate")}</Label>
                <Input
                  id={`${formId}-date`}
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="min-w-0 space-y-2">
                  <Label htmlFor={`${formId}-start`}>{t("attendance.reschedule.start")}</Label>
                  <Input
                    id={`${formId}-start`}
                    type="time"
                    dir="ltr"
                    required
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
                  />
                </div>
                <div className="min-w-0 space-y-2">
                  <Label htmlFor={`${formId}-end`}>{t("attendance.reschedule.end")}</Label>
                  <Input
                    id={`${formId}-end`}
                    type="time"
                    dir="ltr"
                    required
                    value={end}
                    onChange={(e) => setEnd(e.target.value)}
                  />
                </div>
              </div>
              {formError && (
                <p role="alert" className="flex items-start gap-2 text-sm text-destructive">
                  <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
                  {formError}
                </p>
              )}
            </form>
          )}

          {step === "review" && preview && (
            <div aria-live="polite" className="space-y-4">
              <h3 className="sr-only">{t("attendance.reschedule.reviewTitle")}</h3>
              {/* Old → new */}
              <div className="rounded-lg border border-border p-3 text-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("attendance.reschedule.from")}
                    </p>
                    <WhenText
                      when={preview.current}
                      className="text-muted-foreground line-through decoration-sea-300"
                    />
                  </div>
                  <ArrowDown aria-hidden className="size-4 shrink-0 text-sea-700 sm:hidden" />
                  <ArrowRight
                    aria-hidden
                    className="hidden size-4 shrink-0 text-sea-700 sm:block rtl:rotate-180"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("attendance.reschedule.to")}
                    </p>
                    <WhenText when={preview.proposed} className="font-semibold" />
                  </div>
                </div>
              </div>

              {preview.unchanged ? (
                <p className="flex items-start gap-2 rounded-lg bg-sea-100/70 p-3 text-sm text-sea-900 dark:bg-sea-900/40 dark:text-sea-100">
                  <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
                  {t("attendance.reschedule.unchanged")}
                </p>
              ) : hasConflicts ? (
                <div className="rounded-lg border border-alert/40 bg-alert/5 p-3 text-sm">
                  <p className="flex items-center gap-2 font-semibold text-alert">
                    <TriangleAlert aria-hidden className="size-4 shrink-0" />
                    {t("attendance.reschedule.conflictsTitle")}
                  </p>
                  <ul className="mt-2 space-y-1.5 ps-6">
                    {conflicts.map((c, i) => {
                      const time = (
                        <bdi dir="ltr" className="tabular-nums">
                          {timeRange(c.startTime, c.endTime)}
                        </bdi>
                      );
                      const key =
                        c.type === "group"
                          ? "attendance.reschedule.conflict.group"
                          : "attendance.reschedule.conflict.coach";
                      return (
                        <li key={`${c.type}-${c.groupId}-${i}`} className="list-disc text-foreground">
                          {withNode(
                            t(key, { group: c.groupName, coach: c.coachName ?? "", time: SLOT }),
                            time,
                          )}
                        </li>
                      );
                    })}
                  </ul>
                  <label className="mt-3 flex cursor-pointer items-start gap-2.5 border-t border-alert/20 pt-3">
                    <Checkbox
                      checked={ack}
                      onCheckedChange={(v) => setAck(v === true)}
                      disabled={saving}
                      className="mt-0.5"
                    />
                    <span className="text-sm font-medium">
                      {t("attendance.reschedule.ackConflicts")}
                    </span>
                  </label>
                </div>
              ) : (
                <p className="flex items-start gap-2 text-sm text-muted-foreground">
                  <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-sea-700" />
                  {t("attendance.reschedule.noConflicts")}
                </p>
              )}

              {!preview.unchanged &&
                (preview.hasRecords || preview.guestCount > 0 || preview.trialsCount > 0) && (
                  <ul className="space-y-1.5 rounded-lg bg-sea-100/70 p-3 text-sm text-sea-900 dark:bg-sea-900/40 dark:text-sea-100">
                    {preview.hasRecords && (
                      <li className="flex items-start gap-2 font-medium">
                        <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
                        {t("attendance.reschedule.records", { count: preview.recordCount })}
                      </li>
                    )}
                    {preview.guestCount > 0 && (
                      <li className="flex items-start gap-2">
                        <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
                        {preview.guestCount === 1
                          ? t("attendance.reschedule.guests.one")
                          : t("attendance.reschedule.guests", { count: preview.guestCount })}
                      </li>
                    )}
                    {preview.trialsCount > 0 && (
                      <li className="flex items-start gap-2">
                        <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
                        {preview.trialsCount === 1
                          ? t("attendance.reschedule.trials.one")
                          : t("attendance.reschedule.trials", { count: preview.trialsCount })}
                      </li>
                    )}
                  </ul>
                )}
            </div>
          )}

          {step === "done" && done && (
            <div className="space-y-3" role="status">
              <div className="rounded-lg border border-border p-3 text-sm">
                <WhenText when={done.from} className="block text-muted-foreground line-through decoration-sea-300" />
                <WhenText when={done.to} className="mt-1 block font-semibold" />
              </div>
            </div>
          )}

          <DialogFooter>
            {step === "edit" && (
              <>
                <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
                  {t("common.cancel")}
                </Button>
                <Button type="submit" form={formId} disabled={busy}>
                  {checking && <Loader2 className="animate-spin" />}
                  {checking ? t("attendance.reschedule.checking") : t("attendance.reschedule.review")}
                </Button>
              </>
            )}
            {step === "review" && (
              <>
                <Button variant="ghost" onClick={() => setStep("edit")} disabled={busy}>
                  {t("common.back")}
                </Button>
                <Button
                  variant={hasConflicts ? "destructive" : "default"}
                  onClick={onConfirm}
                  disabled={busy || !canConfirm}
                >
                  {saving ? <Loader2 className="animate-spin" /> : <CalendarClock />}
                  {hasConflicts
                    ? t("attendance.reschedule.confirmAnyway")
                    : t("attendance.reschedule.confirm")}
                </Button>
              </>
            )}
            {step === "done" && done && (
              <>
                <Button variant="ghost" onClick={() => onOpenChange(false)}>
                  {t("ui.close")}
                </Button>
                <Button asChild>
                  <a
                    href={whatsappShareUrl(
                      rescheduleShareText({ groupName, from: done.from, to: done.to }),
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle />
                    {t("attendance.reschedule.share")}
                  </a>
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Shown on the original day of a session that was moved to another day, in
 * place of a register: nobody is absent here, the checklist lives on the new day.
 */
export function PostponedBanner({
  groupId,
  originalDate,
  movedTo,
  openHref,
}: {
  groupId: string;
  /** YYYY-MM-DD */
  originalDate: string;
  movedTo: When;
  /** The day it moved to, on the Today tab. */
  openHref: string;
}) {
  const t = useT();
  const locale = useLocale();
  const [pending, startTransition] = useTransition();
  const time = timeRange(movedTo.startTime, movedTo.endTime);

  const onUndo = () => {
    startTransition(async () => {
      const res = await undoReschedule(groupId, originalDate);
      if (res.success === false) {
        toast.error(res.error);
        return;
      }
      toast.success(t("attendance.postponed.undone"));
    });
  };

  return (
    <div className="rounded-lg border border-sea-300/70 bg-sea-100/60 p-4 sm:p-5 dark:bg-sea-900/40">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-full bg-card text-sea-800"
        >
          <CalendarClock className="size-5" />
        </span>
        <div className="min-w-0 flex-1" role="status">
          <p className="font-semibold text-sea-900 dark:text-sea-100">
            {withNode(
              t("attendance.postponed.banner", { when: SLOT }),
              <>
                {dayLabel(movedTo.date, locale)}
                {time && (
                  <>
                    {" · "}
                    <bdi dir="ltr" className="tabular-nums">
                      {time}
                    </bdi>
                  </>
                )}
              </>,
            )}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{t("attendance.postponed.sub")}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">
        <Button asChild>
          <Link href={openHref}>
            <CalendarDays />
            {t("attendance.postponed.open")}
          </Link>
        </Button>
        <Button variant="ghost" onClick={onUndo} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <RotateCcw />}
          {t("attendance.postponed.undo")}
        </Button>
      </div>
    </div>
  );
}
