"use server";

import { revalidatePath } from "next/cache";
import { uniformsApi } from "@/lib/api/uniforms";
import { ApiError } from "@/lib/api/client";

type ActionResult = { success: true } | { success: false; error: string };

function buildPayload(formData: FormData) {
  const paidAmountRaw = formData.get("paidAmount");
  const paidAmount =
    paidAmountRaw == null || String(paidAmountRaw).trim() === ""
      ? undefined
      : Number(paidAmountRaw);

  return {
    studentId: String(formData.get("studentId") ?? ""),
    size: String(formData.get("size") ?? "M").trim(),
    price: Number(formData.get("price") ?? 0),
    isPaid: formData.get("isPaid") === "on" || formData.get("isPaid") === "true",
    paidAmount,
    isReceived:
      formData.get("isReceived") === "on" ||
      formData.get("isReceived") === "true",
    notes: formData.get("notes") ? String(formData.get("notes")) : undefined,
  };
}

function errMsg(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export async function createUniform(formData: FormData): Promise<ActionResult> {
  try {
    await uniformsApi.create(buildPayload(formData));
  } catch (err) {
    return { success: false, error: errMsg(err, "Failed to create uniform order") };
  }
  revalidatePath("/uniforms");
  return { success: true };
}

export async function updateUniform(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  try {
    await uniformsApi.update(id, buildPayload(formData));
  } catch (err) {
    return { success: false, error: errMsg(err, "Failed to update uniform order") };
  }
  revalidatePath("/uniforms");
  return { success: true };
}

export async function toggleUniformPaid(id: string): Promise<ActionResult> {
  try {
    await uniformsApi.togglePaid(id);
  } catch (err) {
    return { success: false, error: errMsg(err, "Failed to toggle paid status") };
  }
  revalidatePath("/uniforms");
  return { success: true };
}

export async function addUniformPayment(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const amount = Number(formData.get("amount") ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, error: "Enter a positive amount" };
  }
  try {
    await uniformsApi.addPayment(id, { amount });
  } catch (err) {
    return { success: false, error: errMsg(err, "Failed to record payment") };
  }
  revalidatePath("/uniforms");
  return { success: true };
}

export async function toggleUniformReceived(id: string): Promise<ActionResult> {
  try {
    await uniformsApi.toggleReceived(id);
  } catch (err) {
    return {
      success: false,
      error: errMsg(err, "Failed to toggle received status"),
    };
  }
  revalidatePath("/uniforms");
  return { success: true };
}

export async function deleteUniform(id: string): Promise<ActionResult> {
  try {
    await uniformsApi.remove(id);
  } catch (err) {
    return { success: false, error: errMsg(err, "Failed to delete uniform order") };
  }
  revalidatePath("/uniforms");
  return { success: true };
}

export async function bulkDeleteUniforms(
  ids: string[],
): Promise<{ success: true; deleted: number } | { success: false; error: string }> {
  if (ids.length === 0) return { success: false, error: "No uniforms selected" };
  try {
    const res = await uniformsApi.bulkDelete(ids);
    revalidatePath("/uniforms");
    return { success: true, deleted: res.deleted };
  } catch (err) {
    return { success: false, error: errMsg(err, "Failed to delete uniforms") };
  }
}
