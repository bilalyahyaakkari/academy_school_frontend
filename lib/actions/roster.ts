"use server";

import { revalidatePath } from "next/cache";
import { rosterApi } from "@/lib/api/roster";
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
): Promise<ActionResult<{ created: number; alreadyFilled: boolean }>> {
  try {
    const { created } = await rosterApi.seed(year, month);
    // Nothing created means one of two very different things: the month
    // already had its students, or there was nobody to carry over. Look.
    let alreadyFilled = false;
    if (created === 0) {
      const roster = await rosterApi.month(year, month);
      alreadyFilled = roster.students.length > 0;
    }
    revalidateMonthScopedPages();
    return { success: true, data: { created, alreadyFilled } };
  } catch (err) {
    return { success: false, error: await errMsg(err, "payments.error.roster.fill") };
  }
}

export async function addStudentsToMonth(
  year: number,
  month: number,
  studentIds: string[],
): Promise<ActionResult<{ added: number; restored: number }>> {
  if (studentIds.length === 0) {
    const t = await getT();
    return { success: false, error: t("payments.error.roster.noneSelected") };
  }
  try {
    const data = await rosterApi.add(year, month, studentIds);
    revalidateMonthScopedPages();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: await errMsg(err, "payments.error.roster.add") };
  }
}

export async function removeStudentFromMonth(
  year: number,
  month: number,
  studentId: string,
): Promise<ActionResult<{ deletedInvoices: number; keptInvoices: unknown[] }>> {
  try {
    const data = await rosterApi.remove(year, month, studentId);
    revalidateMonthScopedPages();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: await errMsg(err, "payments.error.roster.remove") };
  }
}

export async function markStudentLeft(
  year: number,
  month: number,
  studentId: string,
): Promise<ActionResult<{ removedMonths: number; deletedInvoices: number; keptInvoices: unknown[] }>> {
  try {
    const data = await rosterApi.removeFrom(year, month, studentId);
    revalidateMonthScopedPages();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: await errMsg(err, "payments.error.roster.update") };
  }
}
