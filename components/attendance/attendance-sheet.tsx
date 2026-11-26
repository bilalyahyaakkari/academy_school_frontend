"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PresenceRadio, type Mark } from "./presence-radio";
import { useUnsavedChanges } from "./unsaved-guard";
import { AddGuestButton } from "./guest-picker";
import { isoDay } from "./session-dates";
import {
  deleteChecklist,
  removeGuest,
  saveChecklist,
  saveDayAttendance,
} from "@/lib/actions/attendance";
import type { AttendanceChecklist } from "@/lib/api/types";
import { cn, formatDateOnly } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/client";
import { toast } from "sonner";
import { CheckCheck, Info, Loader2, Save, Trash2, UserRoundPlus, UsersRound, X } from "lucide-react";

/** A checklist as the Today screen gets it: `id` is null until the first save. */
export type SheetChecklist = Omit<AttendanceChecklist, "id"> & { id: string | null };

type Marks = Record<string, Mark | undefined>;
type SheetStudent = SheetChecklist["students"][number];

/**
 * A row's starting mark. A never-saved checklist starts unmarked — except
 * guests, who are stored (present) the moment they're added.
 */
function initialMark(s: SheetStudent, isNew: boolean): Mark | undefined {
  if (isNew && !s.isGuest) return undefined;
  return s.present ? "present" : "absent";
}

/**
 * The Present / Absent register for one group on one day — used by the Today
 * screen and by the past-checklist editor.
 *
 * - `mode="day"` saves through PUT /attendance/day, which creates the session
 *   on the first save (the Today screen never creates empty checklists).
 * - `mode="session"` edits an existing checklist and can delete it.
 *
 * A checklist that has never been saved starts with every row unmarked;
 * whatever is still unmarked on save is recorded as absent.
 *
 * Guests (players from other groups, this session only) are listed after the
 * group's own players, saved with the same records, and can be removed.
 */
export function AttendanceSheet({
  checklist,
  mode,
}: {
  checklist: SheetChecklist;
  mode: "day" | "session";
}) {
  const t = useT();
  const locale = useLocale();
  const router = useRouter();
  const originalDate = isoDay(checklist.originalDate ?? checklist.date);
  // Local copy: adding / removing a guest updates the rows without a reload,
  // so unsaved marks on the other rows are kept.
  const [students, setStudents] = useState<SheetStudent[]>(checklist.students);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [, startRemove] = useTransition();

  const [baseline, setBaseline] = useState<Marks>(() =>
    Object.fromEntries(
      checklist.students.map((s) => [s.studentId, initialMark(s, checklist.isNew)]),
    ),
  );
  const [marks, setMarks] = useState<Marks>(baseline);
  const [savedNotes, setSavedNotes] = useState(checklist.notes ?? "");
  const [notes, setNotes] = useState(savedNotes);
  const [isNew, setIsNew] = useState(checklist.isNew);
  const [sessionId, setSessionId] = useState(checklist.id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();

  const guestCount = students.filter((s) => s.isGuest).length;
  const firstGuestIdx = students.findIndex((s) => s.isGuest);
  const presentCount = students.filter((s) => marks[s.studentId] === "present").length;
  const absentCount = students.filter((s) => marks[s.studentId] === "absent").length;
  const unmarkedCount = students.length - presentCount - absentCount;

  const dirty =
    students.some((s) => marks[s.studentId] !== baseline[s.studentId]) ||
    notes !== savedNotes;
  // A never-saved checklist can be saved as is ("nobody came" is a real answer).
  const canSave = dirty || isNew;

  useUnsavedChanges(dirty);

  const setAll = (value: Mark | undefined) =>
    setMarks(Object.fromEntries(students.map((s) => [s.studentId, value])));

  const onSave = () => {
    startSave(async () => {
      const records = students.map((s) => ({
        studentId: s.studentId,
        present: marks[s.studentId] === "present",
      }));
      const trimmed = notes.trim();
      let savedId = sessionId;
      if (mode === "day" || !sessionId) {
        const res = await saveDayAttendance(
          checklist.groupId,
          checklist.date.slice(0, 10),
          records,
          trimmed || undefined,
        );
        if (res.success === false) {
          toast.error(res.error);
          return;
        }
        savedId = res.data?.id ?? savedId;
      } else {
        const res = await saveChecklist(
          sessionId,
          checklist.groupId,
          records,
          trimmed || undefined,
        );
        if (res.success === false) {
          toast.error(res.error);
          return;
        }
      }
      // What was saved is now the baseline: unmarked rows went in as absent.
      const saved: Marks = Object.fromEntries(
        records.map((r) => [r.studentId, r.present ? "present" : "absent"]),
      );
      setMarks(saved);
      setBaseline(saved);
      setNotes(trimmed);
      setSavedNotes(trimmed);
      setIsNew(false);
      setSessionId(savedId);
      const present = records.filter((r) => r.present).length;
      toast.success(
        t("attendance.sheet.saved", { present, absent: records.length - present }),
      );
      router.refresh();
    });
  };

  /** A guest was added: take the new rows, keep the marks already made. */
  const onGuestAdded = (updated: SheetChecklist) => {
    const known = new Set(students.map((s) => s.studentId));
    const fresh = updated.students.filter((s) => !known.has(s.studentId));
    const freshMarks: Marks = Object.fromEntries(
      fresh.map((s) => [s.studentId, s.present ? "present" : "absent"]),
    );
    // Server order: the group's own players, then guests.
    const byId = new Map(students.map((s) => [s.studentId, s]));
    setStudents(updated.students.map((s) => byId.get(s.studentId) ?? s));
    setMarks((prev) => ({ ...prev, ...freshMarks }));
    setBaseline((prev) => ({ ...prev, ...freshMarks }));
    if (updated.id) setSessionId(updated.id);
    // The server action already refreshed the page (counts in the session list).
  };

  const onRemoveGuest = (s: SheetStudent) => {
    if (!sessionId) return;
    setRemovingId(s.studentId);
    startRemove(async () => {
      const res = await removeGuest(sessionId, checklist.groupId, s.studentId);
      setRemovingId(null);
      if (res.success === false) {
        toast.error(res.error);
        return;
      }
      const drop = <T,>(m: Record<string, T>) => {
        const next = { ...m };
        delete next[s.studentId];
        return next;
      };
      setStudents((prev) => prev.filter((x) => x.studentId !== s.studentId));
      setMarks(drop);
      setBaseline(drop);
      toast.success(t("attendance.guest.removed", { name: s.fullName }));
    });
  };

  const addGuestButton = (
    <AddGuestButton
      groupId={checklist.groupId}
      originalDate={originalDate}
      disabled={saving}
      onAdded={onGuestAdded}
    />
  );

  const onDelete = () => {
    if (!sessionId) return;
    startDelete(async () => {
      // On success this redirects to the group's month.
      const res = await deleteChecklist(sessionId, checklist.groupId);
      if (res && res.success === false) toast.error(res.error);
      else toast.success(t("attendance.toast.deleted"));
    });
  };

  if (students.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-6 py-12 text-center">
        <div className="mb-1 rounded-full bg-sea-100 p-3 text-sea-900">
          <UsersRound className="size-6" />
        </div>
        <p className="font-medium">{t("attendance.checklist.empty")}</p>
        <p className="text-sm text-muted-foreground">{t("attendance.checklist.emptySub")}</p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/roster?year=${checklist.year}&month=${checklist.month}`}>
              {t("nav.roster")}
            </Link>
          </Button>
          {addGuestButton}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Counter + quick actions */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="flex flex-wrap items-center gap-1.5" aria-live="polite">
            <Badge variant="success">
              {t("attendance.sheet.count.present", { count: presentCount })}
            </Badge>
            <Badge variant="soft">
              {t("attendance.sheet.count.absent", { count: absentCount })}
            </Badge>
            <Badge variant={unmarkedCount > 0 ? "warning" : "outline"}>
              {t("attendance.sheet.count.unmarked", { count: unmarkedCount })}
            </Badge>
            {guestCount > 0 && (
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <UserRoundPlus aria-hidden className="size-3" />
                {guestCount === 1
                  ? t("attendance.guest.count.one")
                  : t("attendance.guest.count", { count: guestCount })}
              </Badge>
            )}
            {isNew ? (
              <Badge variant="outline" className="text-muted-foreground">
                {t("attendance.checklist.unsaved")}
              </Badge>
            ) : dirty ? (
              <Badge variant="outline" className="text-muted-foreground">
                {t("attendance.sheet.dirty")}
              </Badge>
            ) : null}
          </p>
          {unmarkedCount > 0 && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info aria-hidden className="size-3.5 shrink-0" />
              {t("attendance.sheet.unmarkedHint")}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAll("present")}
            disabled={saving || presentCount === students.length}
          >
            <CheckCheck />
            {t("attendance.sheet.markAllPresent")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAll(undefined)}
            disabled={saving || unmarkedCount === students.length}
          >
            <X />
            {t("attendance.checklist.clearAll")}
          </Button>
        </div>
      </div>

      {/* The register */}
      <div className="overflow-hidden rounded-lg border border-border">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-transparent [&>th]:text-secondary-foreground">
              <TableHead className="w-10 ps-3 text-center sm:w-14 sm:ps-4">
                {t("attendance.sheet.no")}
              </TableHead>
              <TableHead>{t("attendance.sheet.player")}</TableHead>
              <TableHead className="w-px whitespace-nowrap pe-3 sm:pe-4">
                {t("attendance.sheet.attendance")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((s, i) => {
              const nameId = `att-name-${s.studentId}`;
              return (
                <Fragment key={s.studentId}>
                  {i === firstGuestIdx && (
                    // Guests are existing players from other groups — kept
                    // apart from the group's own list (and from trials).
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableCell colSpan={3} className="px-3 py-2 sm:px-4">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-secondary-foreground">
                          <UserRoundPlus aria-hidden className="size-3.5" />
                          {t("attendance.guest.section")}
                        </span>
                        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                          {t("attendance.guest.sectionHint")}
                        </span>
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow className={cn(s.isGuest && "bg-sea-100/30 dark:bg-sea-900/20")}>
                    <TableCell className="ps-3 text-center tabular-nums text-muted-foreground sm:ps-4">
                      {i + 1}
                    </TableCell>
                    <TableCell className="py-2.5">
                      <span id={nameId} className="block font-medium leading-snug">
                        {s.fullName}
                      </span>
                      {s.isGuest && (
                        <span className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                          <Badge variant="soft" className="px-1.5 py-0">
                            {t("attendance.guest.badge")}
                          </Badge>
                          {s.homeGroup && (
                            <span className="text-xs text-muted-foreground">
                              {t("attendance.guest.from", { group: s.homeGroup.name })}
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="-my-1.5 size-9 text-destructive hover:bg-destructive/10 hover:text-destructive sm:size-8"
                            aria-label={t("attendance.guest.remove", { name: s.fullName })}
                            title={t("attendance.guest.remove", { name: s.fullName })}
                            onClick={() => onRemoveGuest(s)}
                            disabled={saving || removingId === s.studentId || !sessionId}
                          >
                            {removingId === s.studentId ? <Loader2 className="animate-spin" /> : <X />}
                          </Button>
                        </span>
                      )}
                      {s.phoneNumber && (
                        <span className="block text-xs text-muted-foreground">
                          <span dir="ltr">{s.phoneNumber}</span>
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap py-2 pe-3 sm:pe-4">
                      <PresenceRadio
                        name={`att-${s.studentId}`}
                        labelledBy={nameId}
                        value={marks[s.studentId]}
                        disabled={saving || removingId === s.studentId}
                        onChange={(value) =>
                          setMarks((prev) => ({ ...prev, [s.studentId]: value }))
                        }
                      />
                    </TableCell>
                  </TableRow>
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center gap-2">{addGuestButton}</div>

      <div className="space-y-2">
        <Label htmlFor={`att-notes-${checklist.groupId}`}>
          {t("attendance.checklist.notes")}
        </Label>
        <Textarea
          id={`att-notes-${checklist.groupId}`}
          value={notes}
          rows={2}
          placeholder={t("attendance.sheet.notesPlaceholder")}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {/* Sticky on phones so Save is always one tap away; inline on larger screens. */}
      <div
        className={cn(
          "sticky bottom-0 z-10 -mx-3 border-t border-border bg-card/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur",
          "sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none",
        )}
      >
        <div className="flex items-center justify-between gap-3">
          {mode === "session" && sessionId ? (
            <Button
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setConfirmDelete(true)}
              disabled={deleting || saving}
            >
              <Trash2 />
              <span className="max-sm:sr-only">{t("attendance.checklist.delete")}</span>
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground sm:hidden">
              {t("attendance.checklist.present", {
                present: presentCount,
                total: students.length,
              })}
            </p>
          )}
          <Button
            size="lg"
            className="flex-1 sm:ms-auto sm:flex-none"
            onClick={onSave}
            disabled={saving || !canSave}
          >
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {t("attendance.checklist.save")}
          </Button>
        </div>
      </div>

      {mode === "session" && (
        <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("attendance.delete.title")}</DialogTitle>
              <DialogDescription>
                {t("attendance.delete.desc", {
                  date: formatDateOnly(checklist.date, locale),
                })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
              >
                {t("common.cancel")}
              </Button>
              <Button variant="destructive" onClick={onDelete} disabled={deleting}>
                {deleting && <Loader2 className="animate-spin" />}
                {t("common.delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
