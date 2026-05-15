"use server";

import { revalidatePath } from "next/cache";
import { uniformsApi } from "@/lib/api/uniforms";
import { ApiError } from "@/lib/api/client";

type ActionResult = { success: true } | { success: false; error: string };

function buildPayload(formData: FormData) {
  return {
    studentId: String(formData.get("studentId") ?? ""),
    size: String(formData.get("size") ?? "M").trim(),
    price: Number(formData.get("price") ?? 0),
    isPaid: formData.get("isPaid") === "on" || formData.get("isPaid") === "true",
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

export async function deleteUniform(id: string): Promise<ActionResult> {
  try {
    await uniformsApi.remove(id);
  } catch (err) {
    return { success: false, error: errMsg(err, "Failed to delete uniform order") };
  }
  revalidatePath("/uniforms");
  return { success: true };
}
