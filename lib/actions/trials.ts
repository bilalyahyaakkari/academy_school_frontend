"use server";

import { revalidatePath } from "next/cache";
import { trialsApi, type TrialInput } from "@/lib/api/trials";
import { ApiError } from "@/lib/api/client";
import type { FirstMonthChoice, TrialStatus } from "@/lib/api/types";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n";

type ActionResult = { success: true } | { success: false; error: string };

async function errorMessage(err: unknown, fallback: TranslationKey): Promise<string> {
  if (err instanceof ApiError) return err.message;
  const t = await getT();
  return t(fallback);
}

/** Trials show on /trials and on the attendance checklist of their day. */
function revalidateTrials() {
  revalidatePath("/trials");
  revalidatePath("/attendance");
  revalidatePath("/attendance/session/[id]", "page");
}

const str = (formData: FormData, key: string) => {
  const v = formData.get(key);
  return v == null ? "" : String(v).trim();
};

/**
 * The form asks for a birth year only. An unchanged year sends the stored date
 * back untouched; a new or changed year becomes "YYYY-01-01" (like the student
 * form).
 */
function resolveDateOfBirth(yearRaw: string, originalDob: string): string {
  const year = yearRaw.trim();
  const original = originalDob.trim();
  if (original && /^\d{4}-\d{2}-\d{2}/.test(original) && original.slice(0, 4) === year) {
    return original.slice(0, 10);
  }
  if (/^\d{4}$/.test(year)) return `${year}-01-01`;
  return year;
}

function buildPayload(formData: FormData): TrialInput {
  const year = str(formData, "birthYear");
  return {
    fullName: str(formData, "fullName"),
    phoneNumber: str(formData, "phoneNumber") || undefined,
    // Always sent: an emptied field clears it.
    dateOfBirth: year ? resolveDateOfBirth(year, str(formData, "originalDateOfBirth")) : null,
    groupId: str(formData, "groupId") || null,
    trialDate: str(formData, "trialDate"),
    notes: str(formData, "notes") || undefined,
  };
}

export async function createTrial(formData: FormData): Promise<ActionResult> {
  try {
    await trialsApi.create(buildPayload(formData));
  } catch (err) {
    return { success: false, error: await errorMessage(err, "trials.error.save") };
  }
  revalidateTrials();
  return { success: true };
}

export async function updateTrial(id: string, formData: FormData): Promise<ActionResult> {
  try {
    await trialsApi.update(id, buildPayload(formData));
  } catch (err) {
    return { success: false, error: await errorMessage(err, "trials.error.save") };
  }
  revalidateTrials();
  return { success: true };
}

export async function setTrialStatus(
  id: string,
  status: Exclude<TrialStatus, "JOINED">,
): Promise<ActionResult> {
  try {
    await trialsApi.setStatus(id, status);
  } catch (err) {
    return { success: false, error: await errorMessage(err, "trials.error.status") };
  }
  revalidateTrials();
  return { success: true };
}

export async function deleteTrial(id: string): Promise<ActionResult> {
  try {
    await trialsApi.remove(id);
  } catch (err) {
    return { success: false, error: await errorMessage(err, "trials.error.delete") };
  }
  revalidateTrials();
  return { success: true };
}

/**
 * The first-month choice posted by <FirstMonthFee> (same rules as the student
 * form): FULL / nothing → undefined (billed normally), bad amount → "invalid".
 */
function readFirstMonth(formData: FormData): FirstMonthChoice | undefined | "invalid" {
  const mode = str(formData, "firstMonthMode");
  if (mode !== "PRORATED" && mode !== "MANUAL") return undefined;
  const raw = str(formData, "firstMonthAmount");
  const amount = Number(raw);
  if (raw === "" || !Number.isFinite(amount) || amount < 0 || amount > 1_000_000) return "invalid";
  return { mode, amount: Math.round(amount * 100) / 100 };
}

/** Turns the trial into a real student, enrolled in their start month. */
export async function convertTrial(
  id: string,
  formData: FormData,
): Promise<{ success: true; studentId: string } | { success: false; error: string }> {
  const year = str(formData, "birthYear");
  if (!/^\d{4}$/.test(year)) {
    const t = await getT();
    return { success: false, error: t("trials.error.birthYear") };
  }
  const firstMonth = readFirstMonth(formData);
  if (firstMonth === "invalid") {
    const t = await getT();
    return { success: false, error: t("firstMonth.error.amount") };
  }
  const startDate = str(formData, "trainingStartDate");
  const feeStr = str(formData, "monthlyFee");
  let studentId: string;
  try {
    const res = await trialsApi.convert(id, {
      fullName: str(formData, "fullName") || undefined,
      dateOfBirth: resolveDateOfBirth(year, str(formData, "originalDateOfBirth")),
      groupId: str(formData, "groupId") || null,
      phoneNumber: str(formData, "phoneNumber") || undefined,
      monthlyFee: feeStr === "" ? null : Number(feeStr),
      trainingStartDate: /^\d{4}-\d{2}-\d{2}$/.test(startDate) ? startDate : undefined,
      firstMonth,
    });
    studentId = res.studentId;
  } catch (err) {
    return { success: false, error: await errorMessage(err, "trials.error.convert") };
  }
  revalidateTrials();
  revalidatePath("/students");
  revalidatePath("/roster");
  revalidatePath("/payments");
  revalidatePath("/dashboard");
  return { success: true, studentId };
}
