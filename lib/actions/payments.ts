"use server";

import { revalidatePath } from "next/cache";
import { paymentsApi } from "@/lib/api/payments";
import { ApiError } from "@/lib/api/client";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

function errMsg(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

export async function generateMonthlyInvoices(
  year: number,
  month: number,
): Promise<ActionResult<{ created: number; skipped: number }>> {
  try {
    const data = await paymentsApi.generateInvoices(year, month);
    revalidatePath("/payments");
    revalidatePath("/dashboard");
    return { success: true, data };
  } catch (err) {
    return { success: false, error: errMsg(err, "Failed to generate invoices") };
  }
}

export async function addPayment(
  paymentId: string,
  formData: FormData,
): Promise<ActionResult> {
  const amount = Number(formData.get("amount") ?? 0);
  const method = formData.get("paymentMethod") as
    | "CASH"
    | "BANK_TRANSFER"
    | "OTHER"
    | null;
  const notes = formData.get("notes") ? String(formData.get("notes")) : undefined;

  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, error: "Enter a positive amount" };
  }

  try {
    await paymentsApi.addPayment(paymentId, {
      amount,
      paymentMethod: method ?? undefined,
      notes,
    });
  } catch (err) {
    return { success: false, error: errMsg(err, "Failed to record payment") };
  }
  revalidatePath("/payments");
  revalidatePath("/payments/outstanding");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function markPaymentPaid(
  paymentId: string,
  method: "CASH" | "BANK_TRANSFER" | "OTHER" = "CASH",
): Promise<ActionResult> {
  try {
    await paymentsApi.markPaid(paymentId, method);
  } catch (err) {
    return { success: false, error: errMsg(err, "Failed") };
  }
  revalidatePath("/payments");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function markPaymentUnpaid(paymentId: string): Promise<ActionResult> {
  try {
    await paymentsApi.markUnpaid(paymentId);
  } catch (err) {
    return { success: false, error: errMsg(err, "Failed") };
  }
  revalidatePath("/payments");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updatePayment(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("paymentId") ?? "");
  const status = String(formData.get("status") ?? "UNPAID") as "PAID" | "UNPAID" | "PARTIAL";
  const paidAmountRaw = formData.get("paidAmount");
  const paymentMethod = formData.get("paymentMethod") as
    | "CASH"
    | "BANK_TRANSFER"
    | "OTHER"
    | null;
  const notes = formData.get("notes") ? String(formData.get("notes")) : undefined;

  const body: Record<string, unknown> = { status, notes };
  if (status === "PARTIAL" && paidAmountRaw != null) {
    body.paidAmount = Number(paidAmountRaw);
  }
  if (status !== "UNPAID" && paymentMethod) {
    body.paymentMethod = paymentMethod;
  }

  try {
    await paymentsApi.update(id, body);
  } catch (err) {
    return { success: false, error: errMsg(err, "Failed to update payment") };
  }
  revalidatePath("/payments");
  revalidatePath("/dashboard");
  return { success: true };
}
