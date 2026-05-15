"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { groupsApi } from "@/lib/api/groups";
import { ApiError } from "@/lib/api/client";
import type { ScheduleSlot } from "@/lib/api/types";

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
    return errResult(err, "Failed to create group");
  }
  revalidatePath("/groups");
  redirect(`/groups/${id}`);
}

export async function updateGroup(id: string, formData: FormData): Promise<ActionResult> {
  try {
    await groupsApi.update(id, buildPayload(formData));
  } catch (err) {
    return errResult(err, "Failed to update group");
  }
  revalidatePath("/groups");
  revalidatePath(`/groups/${id}`);
  redirect(`/groups/${id}`);
}

export async function deleteGroup(id: string): Promise<ActionResult> {
  try {
    await groupsApi.remove(id);
  } catch (err) {
    return errResult(err, "Failed to delete group");
  }
  revalidatePath("/groups");
  redirect("/groups");
}

function errResult(err: unknown, fallback: string): ActionResult {
  return { success: false, error: err instanceof ApiError ? err.message : fallback };
}
