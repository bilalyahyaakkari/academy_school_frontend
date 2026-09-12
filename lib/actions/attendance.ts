"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { attendanceApi } from "@/lib/api/attendance";
import { ApiError } from "@/lib/api/client";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

function errMsg(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
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
    return { success: false, error: errMsg(err, "Failed to open the checklist") };
  }
  revalidatePath("/attendance");
  revalidatePath(`/attendance/${groupId}`);
  redirect(`/attendance/session/${id}`);
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
    return { success: false, error: errMsg(err, "Failed to save attendance") };
  }
}

export async function deleteChecklist(
  sessionId: string,
  groupId: string,
): Promise<ActionResult> {
  try {
    await attendanceApi.deleteSession(sessionId);
  } catch (err) {
    return { success: false, error: errMsg(err, "Failed to delete the checklist") };
  }
  revalidatePath("/attendance");
  revalidatePath(`/attendance/${groupId}`);
  redirect(`/attendance/${groupId}`);
}
