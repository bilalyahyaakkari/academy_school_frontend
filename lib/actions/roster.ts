"use server";

import { revalidatePath } from "next/cache";
import { rosterApi } from "@/lib/api/roster";
import { ApiError } from "@/lib/api/client";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

function errMsg(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

/** Roster changes move headcounts and invoices, so refresh both areas. */
function revalidateMonthScopedPages() {
  revalidatePath("/roster");
  revalidatePath("/payments");
  revalidatePath("/payments/outstanding");
  revalidatePath("/attendance");
  revalidatePath("/dashboard");
  revalidatePath("/students");
}

export async function seedRosterMonth(
  year: number,
  month: number,
): Promise<ActionResult<{ created: number }>> {
  try {
    const data = await rosterApi.seed(year, month);
    revalidateMonthScopedPages();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: errMsg(err, "Failed to fill this month") };
  }
}

export async function addStudentsToMonth(
  year: number,
  month: number,
  studentIds: string[],
): Promise<ActionResult<{ added: number; restored: number }>> {
  if (studentIds.length === 0) {
    return { success: false, error: "No students selected" };
  }
  try {
    const data = await rosterApi.add(year, month, studentIds);
    revalidateMonthScopedPages();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: errMsg(err, "Failed to add students") };
  }
}

export async function removeStudentFromMonth(
  year: number,
  month: number,
  studentId: string,
): Promise<ActionResult<{ keptPayment: { id: string; paidAmount: number } | null }>> {
  try {
    const data = await rosterApi.remove(year, month, studentId);
    revalidateMonthScopedPages();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: errMsg(err, "Failed to remove student") };
  }
}

export async function markStudentLeft(
  year: number,
  month: number,
  studentId: string,
): Promise<ActionResult<{ removedMonths: number }>> {
  try {
    const data = await rosterApi.removeFrom(year, month, studentId);
    revalidateMonthScopedPages();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: errMsg(err, "Failed to update student") };
  }
}
