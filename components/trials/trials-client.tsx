"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteTrial, setTrialStatus } from "@/lib/actions/trials";
import { cn, formatAge } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/client";
import type { TranslationKey } from "@/lib/i18n";
import type { Trial, TrialStatus } from "@/lib/api/types";
import { toast } from "sonner";
import {
  ArrowUpRight,
  Ban,
  Check,
  Loader2,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { STATUS_LABEL, TrialDate, TrialPhone, TrialStatusChip } from "./trial-parts";
import { TrialDialog, type TrialGroupOption } from "./trial-dialog";
import { ConvertTrialDialog } from "./convert-trial-dialog";
import { TRIAL_TABS, type TrialTab } from "./trial-tabs";


const TAB_LABEL: Record<TrialTab, TranslationKey> = {
  upcoming: "trials.tab.upcoming",
  came: "trials.tab.came",
  joined: "trials.tab.joined",
  all: "trials.tab.all",
};

const day = (tr: Trial) => tr.trialDate.slice(0, 10);

/**
 * Upcoming = still waiting for an answer (oldest first, so a past trial nobody
 * marked sits on top); Came = came but hasn't joined yet (the follow-up list);
 * Joined; All. Newest first except Upcoming.
 */
function inTab(tab: TrialTab, tr: Trial): boolean {
  switch (tab) {
    case "upcoming":
      return tr.status === "SCHEDULED";
    case "came":
      return tr.status === "ATTENDED";
    case "joined":
      return tr.status === "JOINED";
    default:
      return true;
  }
}

type Handlers = {
  pendingId: string | null;
  today: string;
  countryCode: string | null;
  onStatus: (tr: Trial, status: Exclude<TrialStatus, "JOINED">) => void;
  onEdit: (tr: Trial) => void;
  onConvert: (tr: Trial) => void;
  onDelete: (tr: Trial) => void;
};

export function TrialsClient({
  trials,
  groups,
  today,
  countryCode,
  initialTab,
}: {
  trials: Trial[];
  groups: TrialGroupOption[];
  today: string;
  countryCode: string | null;
  initialTab: TrialTab;
}) {
  const t = useT();
  const [tab, setTab] = useState<TrialTab>(initialTab);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Trial | null>(null);
  const [converting, setConverting] = useState<Trial | null>(null);
  const [deleting, setDeleting] = useState<Trial | null>(null);
  const [, startTransition] = useTransition();
  const [deletePending, startDelete] = useTransition();

  const counts = useMemo(
    () =>
      Object.fromEntries(
        TRIAL_TABS.map((k) => [k, trials.filter((tr) => inTab(k, tr)).length]),
      ) as Record<TrialTab, number>,
    [trials],
  );

  const rows = useMemo(() => {
    const list = trials.filter((tr) => inTab(tab, tr));
    return tab === "upcoming"
      ? list.sort((a, b) => day(a).localeCompare(day(b)) || a.fullName.localeCompare(b.fullName))
      : list.sort((a, b) => day(b).localeCompare(day(a)) || a.fullName.localeCompare(b.fullName));
  }, [trials, tab]);

  const onTab = (next: TrialTab) => {
    setTab(next);
    // Keep the tab on refresh / back without a server round trip.
    const url = new URL(window.location.href);
    if (next === "upcoming") url.searchParams.delete("tab");
    else url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url);
  };

  const handlers: Handlers = {
    pendingId,
    today,
    countryCode,
    onStatus: (tr, status) => {
      setPendingId(tr.id);
      startTransition(async () => {
        const res = await setTrialStatus(tr.id, status);
        setPendingId(null);
        if (res.success === false) {
          toast.error(res.error);
          return;
        }
        // The row leaves the tab you're on, so say where it went and offer the
        // next step (join) and an undo — otherwise it just "disappears".
        const undo = {
          label: t("trials.toast.undo"),
          onClick: () => {
            startTransition(async () => {
              const r = await setTrialStatus(tr.id, "SCHEDULED");
              if (r.success === false) toast.error(r.error);
            });
          },
        };
        if (status === "ATTENDED") {
          toast.success(t("trials.toast.movedCame", { name: tr.fullName }), {
            description: t("trials.toast.movedCame.next"),
            action: { label: t("trials.action.join"), onClick: () => setConverting(tr) },
            cancel: undo,
            duration: 10000,
          });
        } else if (status === "SCHEDULED") {
          toast.success(
            t("trials.toast.status", { name: tr.fullName, status: t(STATUS_LABEL[status]) }),
          );
        } else {
          toast.success(
            t("trials.toast.movedAll", { name: tr.fullName, status: t(STATUS_LABEL[status]) }),
            { action: undo, duration: 8000 },
          );
        }
      });
    },
    onEdit: setEditing,
    onConvert: setConverting,
    onDelete: setDeleting,
  };

  const onConfirmDelete = () => {
    const target = deleting;
    if (!target) return;
    startDelete(async () => {
      const res = await deleteTrial(target.id);
      if (res.success === false) {
        toast.error(res.error);
        return;
      }
      toast.success(t("trials.toast.deleted"));
      setDeleting(null);
    });
  };

  return (
    <div className="space-y-4">
      <div
        role="group"
        aria-label={t("trials.tabs.label")}
        className="flex max-w-full gap-0.5 self-start overflow-x-auto rounded-md border border-border bg-muted/40 p-0.5 text-sm sm:inline-flex"
      >
        {TRIAL_TABS.map((k) => {
          const active = tab === k;
          return (
            <button
              key={k}
              type="button"
              aria-pressed={active}
              onClick={() => onTab(k)}
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-1.5 rounded px-3 whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-8",
                active
                  ? "bg-card font-medium text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t(TAB_LABEL[k])}
              <span className="text-xs tabular-nums text-muted-foreground">{counts[k]}</span>
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <div className="rounded-full bg-sea-100 p-4 text-sea-900">
            <UserPlus className="size-8" />
          </div>
          {trials.length === 0 ? (
            <>
              <h3 className="font-semibold">{t("trials.empty.title")}</h3>
              <p className="text-sm text-muted-foreground">{t("trials.empty.sub")}</p>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">{t("trials.empty.filtered")}</p>
              {/* Children who came are waiting on the next step — point there. */}
              {tab !== "came" && counts.came > 0 && (
                <Button variant="outline" size="sm" onClick={() => onTab("came")}>
                  {t("trials.empty.seeCame", { count: counts.came })}
                </Button>
              )}
            </>
          )}
        </Card>
      ) : (
        <>
          <TrialsTable rows={rows} h={handlers} />
          <TrialsCards rows={rows} h={handlers} />
        </>
      )}

      {editing && (
        <TrialDialog
          trial={editing}
          groups={groups}
          today={today}
          onClose={() => setEditing(null)}
        />
      )}
      {converting && (
        <ConvertTrialDialog
          trial={converting}
          groups={groups}
          onClose={() => setConverting(null)}
        />
      )}

      <Dialog open={!!deleting} onOpenChange={(o) => !o && !deletePending && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("trials.delete.title", { name: deleting?.fullName ?? "" })}
            </DialogTitle>
            <DialogDescription>{t("trials.delete.desc")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)} disabled={deletePending}>
              {t("common.cancel")}
            </Button>
            <Button variant="destructive" onClick={onConfirmDelete} disabled={deletePending}>
              {deletePending && <Loader2 className="size-4 animate-spin" />}
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChildName({ tr, h }: { tr: Trial; h: Handlers }) {
  const t = useT();
  const locale = useLocale();
  const unmarked = tr.status === "SCHEDULED" && day(tr) < h.today;
  return (
    <div className="min-w-0">
      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        {tr.student ? (
          <Link href={`/students/${tr.student.id}`} className="truncate font-medium hover:underline">
            {tr.fullName}
          </Link>
        ) : (
          <span className="truncate font-medium">{tr.fullName}</span>
        )}
        {tr.dateOfBirth && (
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatAge(tr.dateOfBirth, locale)}
          </span>
        )}
        {unmarked && (
          <Badge variant="soft" className="shrink-0 rounded-full px-2 text-[10px]">
            {t("trials.notMarked")}
          </Badge>
        )}
      </div>
      {tr.notes && (
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground" title={tr.notes}>
          {tr.notes}
        </p>
      )}
    </div>
  );
}

function TrialsTable({ rows, h }: { rows: Trial[]; h: Handlers }) {
  const t = useT();
  return (
    <Card className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("trials.table.child")}</TableHead>
            <TableHead>{t("table.group")}</TableHead>
            <TableHead>{t("trials.table.trialDate")}</TableHead>
            <TableHead>{t("table.parentPhone")}</TableHead>
            <TableHead>{t("table.status")}</TableHead>
            <TableHead className="text-end">
              <span className="sr-only">{t("table.actions")}</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((tr) => (
            <TableRow key={tr.id}>
              <TableCell className="max-w-64">
                <ChildName tr={tr} h={h} />
              </TableCell>
              <TableCell className="text-sm">
                {tr.group?.name ?? <span className="text-muted-foreground">—</span>}
              </TableCell>
              <TableCell className="text-sm">
                <TrialDate date={tr.trialDate} today={h.today} />
              </TableCell>
              <TableCell className="text-sm">
                <TrialPhone phone={tr.phoneNumber} countryCode={h.countryCode} />
              </TableCell>
              <TableCell>
                <TrialStatusChip status={tr.status} />
              </TableCell>
              <TableCell>
                <RowActions tr={tr} h={h} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function TrialsCards({ rows, h }: { rows: Trial[]; h: Handlers }) {
  return (
    <ul className="space-y-2 md:hidden">
      {rows.map((tr) => (
        <li key={tr.id} className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-start justify-between gap-2">
            <ChildName tr={tr} h={h} />
            <TrialStatusChip status={tr.status} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <TrialDate date={tr.trialDate} today={h.today} />
            {tr.group && <span className="text-muted-foreground">{tr.group.name}</span>}
            <TrialPhone phone={tr.phoneNumber} countryCode={h.countryCode} />
          </div>
          <RowActions tr={tr} h={h} className="mt-3 justify-start" />
        </li>
      ))}
    </ul>
  );
}

/** The quick, status-specific buttons + the ⋯ menu with everything else. */
function RowActions({ tr, h, className }: { tr: Trial; h: Handlers; className?: string }) {
  const t = useT();
  const pending = h.pendingId === tr.id;
  const itemClass = "min-h-10 cursor-pointer sm:min-h-0";
  const scheduled = tr.status === "SCHEDULED";
  const joined = tr.status === "JOINED";

  return (
    <div className={cn("flex flex-wrap items-center justify-end gap-1", className)}>
      {scheduled && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="h-10 sm:h-8"
            aria-label={t("trials.action.cameName", { name: tr.fullName })}
            onClick={() => h.onStatus(tr, "ATTENDED")}
            disabled={pending}
          >
            <Check className="size-4" />
            {t("trials.action.came")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-10 text-alert hover:bg-alert/10 hover:text-alert sm:h-8"
            aria-label={t("trials.action.noShowName", { name: tr.fullName })}
            onClick={() => h.onStatus(tr, "NO_SHOW")}
            disabled={pending}
          >
            <X className="size-4" />
            {t("trials.action.noShow")}
          </Button>
        </>
      )}
      {!scheduled && !joined && (
        <Button
          size="sm"
          variant="outline"
          className="h-10 sm:h-8"
          onClick={() => h.onConvert(tr)}
          disabled={pending}
        >
          <UserPlus className="size-4" />
          {t("trials.action.join")}
        </Button>
      )}
      {joined && tr.student && (
        <Button asChild size="sm" variant="outline" className="h-10 sm:h-8">
          <Link href={`/students/${tr.student.id}`}>
            <ArrowUpRight className="size-4 rtl:-scale-x-100" />
            {t("trials.action.openStudent")}
          </Link>
        </Button>
      )}

      {/* Non-modal so dialogs opened from an item don't fight its focus lock. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            size="icon"
            variant="ghost"
            className="sm:size-8"
            aria-label={t("trials.action.menu", { name: tr.fullName })}
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <MoreHorizontal className="size-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem className={itemClass} onSelect={() => h.onEdit(tr)}>
            <Pencil className="me-2 size-4" />
            {t("common.edit")}
          </DropdownMenuItem>
          {scheduled && (
            <DropdownMenuItem className={itemClass} onSelect={() => h.onConvert(tr)}>
              <UserPlus className="me-2 size-4" />
              {t("trials.action.join")}
            </DropdownMenuItem>
          )}
          {!joined && tr.status !== "DECLINED" && (
            <DropdownMenuItem className={itemClass} onSelect={() => h.onStatus(tr, "DECLINED")}>
              <Ban className="me-2 size-4" />
              {t("trials.action.declined")}
            </DropdownMenuItem>
          )}
          {!scheduled && !joined && (
            <DropdownMenuItem className={itemClass} onSelect={() => h.onStatus(tr, "SCHEDULED")}>
              <RotateCcw className="me-2 size-4" />
              {t("trials.action.reset")}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className={cn(
              itemClass,
              "text-destructive focus:bg-destructive/10 focus:text-destructive",
            )}
            onSelect={() => h.onDelete(tr)}
          >
            <Trash2 className="me-2 size-4" />
            {t("common.delete")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
