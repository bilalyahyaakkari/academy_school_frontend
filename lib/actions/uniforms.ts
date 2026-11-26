"use server";

import { revalidatePath } from "next/cache";
import { uniformsApi } from "@/lib/api/uniforms";
import { ApiError } from "@/lib/api/client";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n";

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

/** The backend's message when it gave one, else a translated fallback. */
async function errMsg(err: unknown, fallback: TranslationKey): Promise<string> {
  if (err instanceof ApiError) return err.message;
  const t = await getT();
  return t(fallback);
}

export async function createUniform(formData: FormData): Promise<ActionResult> {
  try {
    await uniformsApi.create(buildPayload(formData));
  } catch (err) {
    return { success: false, error: await errMsg(err, "uniforms.err.create") };
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
    return { success: false, error: await errMsg(err, "uniforms.err.update") };
  }
  revalidatePath("/uniforms");
  return { success: true };
}

export async function toggleUniformPaid(id: string): Promise<ActionResult> {
  try {
    await uniformsApi.togglePaid(id);
  } catch (err) {
    return { success: false, error: await errMsg(err, "uniforms.err.togglePaid") };
  }
  revalidatePath("/uniforms");
  revalidatePath("/payments/daily");
  return { success: true };
}

export async function addUniformPayment(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const amount = Number(formData.get("amount") ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    const t = await getT();
    return { success: false, error: t("uniforms.err.positiveAmount") };
  }
  const rawMethod = formData.get("paymentMethod");
  const paymentMethod =
    rawMethod === "CASH" || rawMethod === "BANK_TRANSFER" || rawMethod === "OTHER"
      ? rawMethod
      : undefined;
  try {
    await uniformsApi.addPayment(id, { amount, paymentMethod });
  } catch (err) {
    return { success: false, error: await errMsg(err, "uniforms.err.payment") };
  }
  revalidatePath("/uniforms");
  revalidatePath("/payments/daily");
  return { success: true };
}

export async function toggleUniformReceived(id: string): Promise<ActionResult> {
  try {
    await uniformsApi.toggleReceived(id);
  } catch (err) {
    return {
      success: false,
      error: await errMsg(err, "uniforms.err.toggleReceived"),
    };
  }
  revalidatePath("/uniforms");
  return { success: true };
}

export async function deleteUniform(id: string): Promise<ActionResult> {
  try {
    await uniformsApi.remove(id);
  } catch (err) {
    return { success: false, error: await errMsg(err, "uniforms.err.delete") };
  }
  revalidatePath("/uniforms");
  return { success: true };
}

export async function bulkDeleteUniforms(
  ids: string[],
): Promise<{ success: true; deleted: number } | { success: false; error: string }> {
  if (ids.length === 0) {
    const t = await getT();
    return { success: false, error: t("uniforms.err.noneSelected") };
  }
  try {
    const res = await uniformsApi.bulkDelete(ids);
    revalidatePath("/uniforms");
    return { success: true, deleted: res.deleted };
  } catch (err) {
    return { success: false, error: await errMsg(err, "uniforms.err.bulkDelete") };
  }
}
