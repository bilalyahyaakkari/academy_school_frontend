"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { attendanceApi } from "@/lib/api/attendance";
import { ApiError } from "@/lib/api/client";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n";

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
