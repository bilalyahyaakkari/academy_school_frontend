"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { studentsApi } from "@/lib/api/students";
import { ApiError } from "@/lib/api/client";

type ActionResult = { success: true } | { success: false; error: string };

/** Converts a 4-digit year string (e.g. "2015") to an ISO date "2015-01-01". */
function yearToIso(year: string): string {
  const trimmed = year.trim();
  if (/^\d{4}$/.test(trimmed)) return `${trimmed}-01-01`;
  // Already a full ISO date? Pass through.
  return trimmed;
}

function buildPayload(formData: FormData) {
  const get = (key: string) => formData.get(key);
  const groupId = get("groupId");
  const feeRaw = get("monthlyFee");
  const feeStr = feeRaw == null ? "" : String(feeRaw).trim();
  const monthlyFee = feeStr === "" ? null : Number(feeStr);

  return {
    fullName: String(get("fullName") ?? ""),
    dateOfBirth: yearToIso(String(get("birthYear") ?? "")),
    phoneNumber: get("phoneNumber") ? String(get("phoneNumber")) : undefined,
    groupId: groupId ? String(groupId) : null,
    isActive: get("isActive") === "on" || get("isActive") === "true",
    monthlyFee,
    notes: get("notes") ? String(get("notes")) : undefined,
  };
}

export async function createStudent(formData: FormData): Promise<ActionResult> {
  let createdId: string | undefined;
  try {
    const created = await studentsApi.create(buildPayload(formData));
    createdId = created.id;
  } catch (err) {
    return { success: false, error: errorMessage(err, "Failed to create student") };
  }
  revalidatePath("/students");
  revalidatePath("/dashboard");
  redirect(`/students/${createdId}`);
}

export async function updateStudent(id: string, formData: FormData): Promise<ActionResult> {
  try {
    await studentsApi.update(id, buildPayload(formData));
  } catch (err) {
    return { success: false, error: errorMessage(err, "Failed to update student") };
  }
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  revalidatePath("/dashboard");
  // Effective fee may have changed → unpaid invoices were updated server-side.
  revalidatePath("/payments");
  revalidatePath("/payments/outstanding");
  redirect(`/students/${id}`);
}

export async function deleteStudent(id: string): Promise<ActionResult> {
  try {
    await studentsApi.remove(id);
  } catch (err) {
    return { success: false, error: errorMessage(err, "Failed to delete student") };
  }
  revalidatePath("/students");
  revalidatePath("/dashboard");
  redirect("/students");
}

export async function toggleStudentActive(id: string): Promise<ActionResult> {
  try {
    await studentsApi.toggleActive(id);
  } catch (err) {
    return { success: false, error: errorMessage(err, "Failed to toggle status") };
  }
  revalidatePath("/students");
  revalidatePath(`/students/${id}`);
  return { success: true };
}

export async function archiveStudent(id: string): Promise<ActionResult> {
  try {
    await studentsApi.archive(id);
  } catch (err) {
    return { success: false, error: errorMessage(err, "Failed to archive student") };
  }
  revalidatePath("/students");
  revalidatePath("/payments");
  revalidatePath("/uniforms");
  revalidatePath(`/students/${id}`);
  return { success: true };
}

export async function unarchiveStudent(id: string): Promise<ActionResult> {
  try {
    await studentsApi.unarchive(id);
  } catch (err) {
    return { success: false, error: errorMessage(err, "Failed to restore student") };
  }
  revalidatePath("/students");
  revalidatePath("/payments");
  revalidatePath("/uniforms");
  revalidatePath(`/students/${id}`);
  return { success: true };
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message;
  return fallback;
}

export async function bulkDeleteStudents(
  ids: string[],
): Promise<{ success: true; deleted: number } | { success: false; error: string }> {
  if (ids.length === 0) return { success: false, error: "No students selected" };
  let deleted = 0;
  try {
    const res = await studentsApi.bulkDelete(ids);
    deleted = res.deleted;
  } catch (err) {
    return { success: false, error: errorMessage(err, "Failed to delete") };
  }
  revalidatePath("/students");
  revalidatePath("/dashboard");
  return { success: true, deleted };
}
