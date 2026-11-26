"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setTrialStatus } from "@/lib/actions/trials";
import { TrialStatusChip } from "@/components/trials/trial-parts";
import { useT } from "@/lib/i18n/client";
import type { AttendanceChecklist } from "@/lib/api/types";
import { toast } from "sonner";
import { ArrowUpRight, Check, Loader2, Sparkles, X } from "lucide-react";

type ChecklistTrial = AttendanceChecklist["trials"][number];

/**
 * "Trying today": children coming to try this group on this day. They're not
 * students, so they're kept apart from the register and never saved with it —
 * each answer goes straight to the trial.
 */
export function TrialsToday({ trials }: { trials: ChecklistTrial[] }) {
  const t = useT();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (trials.length === 0) return null;

  const mark = (tr: ChecklistTrial, status: "ATTENDED" | "NO_SHOW") => {
    setPendingId(tr.id);
    startTransition(async () => {
      const res = await setTrialStatus(tr.id, status);
      setPendingId(null);
      if (res.success === false) toast.error(res.error);
    });
  };

  return (
    <section
      aria-labelledby="trials-today-title"
      className="mt-6 rounded-lg border border-dashed border-sea-300 p-3 sm:p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 id="trials-today-title" className="flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles aria-hidden className="size-4 text-sea-700" />
            {t("attendance.trials.title")}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{t("attendance.trials.desc")}</p>
        </div>
        <Button asChild variant="link" size="sm" className="h-auto px-0">
          <Link href="/trials">
            {t("attendance.trials.manage")}
            <ArrowUpRight className="rtl:-scale-x-100" />
          </Link>
        </Button>
      </div>

      <ul className="mt-3 divide-y divide-border">
        {trials.map((tr) => {
          const pending = pendingId === tr.id;
          const joined = tr.status === "JOINED";
          return (
            <li key={tr.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{tr.fullName}</p>
                {tr.phoneNumber && (
                  <p className="text-xs text-muted-foreground">
                    <span dir="ltr">{tr.phoneNumber}</span>
                  </p>
                )}
              </div>
              {(joined || tr.status === "DECLINED") && <TrialStatusChip status={tr.status} />}
              {!joined && (
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant={tr.status === "ATTENDED" ? "success" : "outline"}
                    className="h-10 sm:h-8"
                    aria-pressed={tr.status === "ATTENDED"}
                    aria-label={t("trials.action.cameName", { name: tr.fullName })}
                    onClick={() => mark(tr, "ATTENDED")}
                    disabled={pending || tr.status === "ATTENDED"}
                  >
                    {pending ? <Loader2 className="animate-spin" /> : <Check />}
                    {t("trials.action.came")}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className={
                      tr.status === "NO_SHOW"
                        ? "h-10 bg-alert/10 text-alert hover:bg-alert/15 hover:text-alert sm:h-8"
                        : "h-10 text-alert hover:bg-alert/10 hover:text-alert sm:h-8"
                    }
                    aria-pressed={tr.status === "NO_SHOW"}
                    aria-label={t("trials.action.noShowName", { name: tr.fullName })}
                    onClick={() => mark(tr, "NO_SHOW")}
                    disabled={pending || tr.status === "NO_SHOW"}
                  >
                    <X />
                    {t("trials.action.noShow")}
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
