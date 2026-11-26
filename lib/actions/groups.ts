"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { groupsApi } from "@/lib/api/groups";
import { studentsApi } from "@/lib/api/students";
import { ApiError } from "@/lib/api/client";
import type { ScheduleSlot } from "@/lib/api/types";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n";

type ActionResult = { success: true } | { success: false; error: string };

function buildPayload(formData: FormData) {
  const get = (key: string) => formData.get(key);
  const num = (key: string) => {
    const v = get(key);
    if (v == null || v === "") return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  let schedule: ScheduleSlot[] = [];
  const raw = get("schedule");
  if (typeof raw === "string" && raw.length > 0) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) schedule = parsed;
    } catch {
      // leave as []
    }
  }

  return {
    name: String(get("name") ?? ""),
    minAge: num("minAge"),
    maxAge: num("maxAge"),
    schedule,
    monthlyFee: Number(get("monthlyFee") ?? 0),
    maxCapacity: num("maxCapacity"),
    coachName: get("coachName") ? String(get("coachName")) : undefined,
  };
}

export async function createGroup(formData: FormData): Promise<ActionResult> {
  let id: string | undefined;
  try {
    const g = await groupsApi.create(buildPayload(formData));
    id = g.id;
  } catch (err) {
    return errResult(err, "groups.error.create");
  }
  revalidatePath("/groups");
  redirect(`/groups/${id}`);
}

export async function updateGroup(id: string, formData: FormData): Promise<ActionResult> {
  try {
    await groupsApi.update(id, buildPayload(formData));
  } catch (err) {
    return errResult(err, "groups.error.update");
  }
  revalidatePath("/groups");
  revalidatePath(`/groups/${id}`);
  // Group fee may have changed → unpaid invoices for members were updated server-side.
  revalidatePath("/payments");
  revalidatePath("/payments/outstanding");
  revalidatePath("/dashboard");
  redirect(`/groups/${id}`);
}

export async function deleteGroup(id: string): Promise<ActionResult> {
  try {
    await groupsApi.remove(id);
  } catch (err) {
    return errResult(err, "groups.error.delete");
  }
  revalidatePath("/groups");
  redirect("/groups");
}

/**
 * Moves a student to another group (null = no group). The backend also moves
 * their unpaid invoices to the new fee and updates this month's roster group,
 * so every page that shows groups, students, rosters, attendance or invoices
 * is refreshed.
 */
export async function changeStudentGroup(
  studentId: string,
  groupId: string | null,
): Promise<ActionResult> {
  try {
    await studentsApi.changeGroup(studentId, groupId);
  } catch (err) {
    return errResult(err, "groups.error.changeGroup");
  }
  // "layout" also refreshes the nested pages (/groups/[id], /students/[id], …).
  revalidatePath("/groups", "layout");
  revalidatePath("/students", "layout");
  revalidatePath("/roster", "layout");
  revalidatePath("/attendance", "layout");
  revalidatePath("/payments", "layout");
  revalidatePath("/dashboard");
  return { success: true };
}

/** API errors carry the backend's message (e.g. the 409 explaining why a group can't be deleted). */
async function errResult(err: unknown, fallback: TranslationKey): Promise<ActionResult> {
  if (err instanceof ApiError) return { success: false, error: err.message };
  const t = await getT();
  return { success: false, error: t(fallback) };
}
