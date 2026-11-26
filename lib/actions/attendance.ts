"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { attendanceApi } from "@/lib/api/attendance";
import { ApiError } from "@/lib/api/client";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n";
import type {
  AttendanceChecklist,
  GuestCandidate,
  ReschedulePreview,
} from "@/lib/api/types";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function errMsg(err: unknown, fallback: TranslationKey): Promise<string> {
  if (err instanceof ApiError) return err.message;
  const t = await getT();
  return t(fallback);
}

/**
 * Opens today's (or the chosen day's) checklist for a group and navigates to it.
 * Asking twice for the same day reuses the existing one instead of duplicating.
 */
export async function openChecklist(
  groupId: string,
  date: string,
): Promise<ActionResult> {
  let id: string;
  try {
    const res = await attendanceApi.createSession(groupId, date);
    id = res.id;
  } catch (err) {
    return { success: false, error: await errMsg(err, "payments.error.attendance.open") };
  }
  revalidatePath("/attendance");
  revalidatePath(`/attendance/${groupId}`);
  redirect(`/attendance/session/${id}`);
}

/**
 * Saves a group's checklist for a day (the "Today" screen). The backend creates
 * the session on the first save, so merely opening the screen never leaves an
 * empty checklist behind.
 */
export async function saveDayAttendance(
  groupId: string,
  date: string,
  records: { studentId: string; present: boolean }[],
  notes?: string,
): Promise<ActionResult<{ id: string; presentCount: number }>> {
  try {
    const data = await attendanceApi.saveDay(groupId, date, records, notes);
    revalidatePath("/attendance");
    revalidatePath(`/attendance/${groupId}`);
    revalidatePath(`/attendance/session/${data.id}`);
    return { success: true, data: { id: data.id, presentCount: data.presentCount } };
  } catch (err) {
    return { success: false, error: await errMsg(err, "payments.error.attendance.save") };
  }
}

export async function saveChecklist(
  sessionId: string,
  groupId: string,
  records: { studentId: string; present: boolean }[],
  notes?: string,
): Promise<ActionResult<{ presentCount: number }>> {
  try {
    const data = await attendanceApi.saveSession(sessionId, records, notes);
    revalidatePath("/attendance");
    revalidatePath(`/attendance/${groupId}`);
    revalidatePath(`/attendance/session/${sessionId}`);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: await errMsg(err, "payments.error.attendance.save") };
  }
}

export async function deleteChecklist(
  sessionId: string,
  groupId: string,
): Promise<ActionResult> {
  try {
    await attendanceApi.deleteSession(sessionId);
  } catch (err) {
    return { success: false, error: await errMsg(err, "payments.error.attendance.delete") };
  }
  revalidatePath("/attendance");
  revalidatePath(`/attendance/${groupId}`);
  redirect(`/attendance/${groupId}`);
}

/** Refreshes every screen that shows this group's day. */
function revalidateDay(groupId: string) {
  revalidatePath("/attendance");
  revalidatePath(`/attendance/${groupId}`);
  revalidatePath("/attendance/session/[id]", "page");
}

/** Cancels a group's session on a day (rain, holiday…). Never an absence. */
export async function cancelSession(
  groupId: string,
  date: string,
  reason?: string,
): Promise<ActionResult> {
  try {
    await attendanceApi.cancelDay(groupId, date, reason?.trim() || undefined);
  } catch (err) {
    return { success: false, error: await errMsg(err, "attendance.error.cancel") };
  }
  revalidateDay(groupId);
  return { success: true };
}

export async function uncancelSession(groupId: string, date: string): Promise<ActionResult> {
  try {
    await attendanceApi.uncancelDay(groupId, date);
  } catch (err) {
    return { success: false, error: await errMsg(err, "attendance.error.uncancel") };
  }
  revalidateDay(groupId);
  return { success: true };
}

// ---------- Rescheduling one session ----------

type RescheduleBody = {
  groupId: string;
  /** The session's ORIGINAL day (its identity). */
  date: string;
  newDate: string;
  startTime: string;
  endTime: string;
};

/** Checks a reschedule (clashes, what moves along) without saving anything. */
export async function previewReschedule(
  body: RescheduleBody,
): Promise<ActionResult<ReschedulePreview>> {
  try {
    const data = await attendanceApi.reschedulePreview(body);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: await errMsg(err, "attendance.error.reschedulePreview") };
  }
}

/** Moves this one session (the weekly schedule is untouched). */
export async function rescheduleSession(
  body: RescheduleBody,
): Promise<
  ActionResult<{
    session: AttendanceChecklist;
    previous: ReschedulePreview["current"];
  }>
> {
  try {
    const data = await attendanceApi.reschedule(body);
    revalidateDay(body.groupId);
    return { success: true, data: { session: data.session, previous: data.previous } };
  } catch (err) {
    return { success: false, error: await errMsg(err, "attendance.error.reschedule") };
  }
}

/** Puts a moved session back on its regular day and times. */
export async function undoReschedule(
  groupId: string,
  originalDate: string,
): Promise<ActionResult> {
  try {
    await attendanceApi.clearReschedule(groupId, originalDate);
  } catch (err) {
    return { success: false, error: await errMsg(err, "attendance.error.unreschedule") };
  }
  revalidateDay(groupId);
  return { success: true };
}

// ---------- Guest players ----------

/** Players from other groups who could join this session as guests. */
export async function loadGuestCandidates(
  groupId: string,
  originalDate: string,
): Promise<ActionResult<GuestCandidate[]>> {
  try {
    const data = await attendanceApi.guestCandidates(groupId, originalDate);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: await errMsg(err, "attendance.error.guests") };
  }
}

/**
 * Adds a guest (created present) to a session, creating the session if it was
 * never saved. A duplicate / a player already on the list comes back as the
 * backend's 409 message.
 */
export async function addGuest(
  groupId: string,
  originalDate: string,
  studentId: string,
): Promise<ActionResult<AttendanceChecklist>> {
  try {
    const data = await attendanceApi.addGuest(groupId, originalDate, studentId);
    revalidateDay(groupId);
    // The guest's own month view lists the visit.
    revalidatePath(`/students/${studentId}`);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: await errMsg(err, "attendance.error.addGuest") };
  }
}

export async function removeGuest(
  sessionId: string,
  groupId: string,
  studentId: string,
): Promise<ActionResult<AttendanceChecklist>> {
  try {
    const data = await attendanceApi.removeGuest(sessionId, studentId);
    revalidateDay(groupId);
    revalidatePath(`/students/${studentId}`);
    return { success: true, data };
  } catch (err) {
    return { success: false, error: await errMsg(err, "attendance.error.removeGuest") };
  }
}
