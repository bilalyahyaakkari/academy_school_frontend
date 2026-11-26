"use server";

import { revalidatePath } from "next/cache";
import { paymentsApi } from "@/lib/api/payments";
import { uniformsApi } from "@/lib/api/uniforms";
import { settingsApi } from "@/lib/api/settings";
import { ApiError } from "@/lib/api/client";
import { getT } from "@/lib/i18n/server";
import { formatCurrency, whatsappReceiptUrl } from "@/lib/utils";
import type { TranslationKey } from "@/lib/i18n";

type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

async function errMsg(err: unknown, fallback: TranslationKey): Promise<string> {
  if (err instanceof ApiError) return err.message;
  const t = await getT();
  return t(fallback);
}

function revalidatePaymentPages() {
  revalidatePath("/payments");
  revalidatePath("/payments/outstanding");
  revalidatePath("/payments/history");
  revalidatePath("/payments/daily");
  revalidatePath("/roster");
  revalidatePath("/dashboard");
  revalidatePath("/settings");
}

export async function generateMonthlyInvoices(
  year: number,
  month: number,
): Promise<ActionResult<{ created: number; skipped: number }>> {
  try {
    const data = await paymentsApi.generateInvoices(year, month);
    revalidatePaymentPages();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: await errMsg(err, "payments.error.generate") };
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
  // Sent as typed: the dialog is prefilled with the existing note, so an empty
  // value means the user cleared it.
  const rawNotes = formData.get("notes");
  const notes = rawNotes == null ? undefined : String(rawNotes);

  if (!Number.isFinite(amount) || amount <= 0) {
    const t = await getT();
    return { success: false, error: t("payments.error.positiveAmount") };
  }

  try {
    await paymentsApi.addPayment(paymentId, {
      amount,
      paymentMethod: method ?? undefined,
      notes,
    });
  } catch (err) {
    return { success: false, error: await errMsg(err, "payments.error.record") };
  }
  revalidatePaymentPages();
  return { success: true };
}

export async function markPaymentPaid(
  paymentId: string,
  method: "CASH" | "BANK_TRANSFER" | "OTHER" = "CASH",
): Promise<ActionResult> {
  try {
    await paymentsApi.markPaid(paymentId, method);
  } catch (err) {
    return { success: false, error: await errMsg(err, "payments.error.generic") };
  }
  revalidatePaymentPages();
  return { success: true };
}

export async function markPaymentUnpaid(paymentId: string): Promise<ActionResult> {
  try {
    await paymentsApi.markUnpaid(paymentId);
  } catch (err) {
    return { success: false, error: await errMsg(err, "payments.error.generic") };
  }
  revalidatePaymentPages();
  return { success: true };
}

export async function updatePayment(formData: FormData): Promise<ActionResult> {
  const id = String(formData.get("paymentId") ?? "");
  const status = String(formData.get("status") ?? "UNPAID") as "PAID" | "UNPAID" | "PARTIAL";
  const paidAmountRaw = formData.get("paidAmount");
  const totalRaw = formData.get("total");
  const paymentMethod = formData.get("paymentMethod") as
    | "CASH"
    | "BANK_TRANSFER"
    | "OTHER"
    | null;
  const notes = formData.get("notes") ? String(formData.get("notes")) : undefined;

  const body: Record<string, unknown> = { status, notes };
  if (status === "PARTIAL") {
    // A partial payment is strictly between nothing and everything — 0 is
    // "unpaid" and the full amount is "paid". The backend would silently flip
    // the status; refuse instead so what's saved is what the admin chose.
    const paid = paidAmountRaw == null || paidAmountRaw === "" ? NaN : Number(paidAmountRaw);
    const total = totalRaw == null || totalRaw === "" ? NaN : Number(totalRaw);
    const tooHigh = Number.isFinite(total) && paid >= total;
    if (!Number.isFinite(paid) || paid <= 0 || tooHigh) {
      const t = await getT();
      return {
        success: false,
        error: t("payments.validation.partialRange", {
          total: Number.isFinite(total) ? formatCurrency(total) : "—",
        }),
      };
    }
    body.paidAmount = paid;
  }
  if (status !== "UNPAID" && paymentMethod) {
    body.paymentMethod = paymentMethod;
  }

  try {
    await paymentsApi.update(id, body);
  } catch (err) {
    return { success: false, error: await errMsg(err, "payments.error.update") };
  }
  revalidatePaymentPages();
  return { success: true };
}

/** What the "Send receipt" dialog shows. */
export type ReceiptMessage = {
  studentName: string;
  phoneNumber: string | null;
  /** wa.me link — null when the student has no usable phone number. */
  url: string | null;
  /** The message text (also used for the preview). Null when nothing was paid. */
  message: string | null;
  /** The latest amount received. */
  amount: number;
  remaining: number;
};

/**
 * Builds a WhatsApp receipt for a monthly invoice ("FEE") or a uniform order
 * ("UNIFORM") from the backend's receipt data and the academy's settings
 * (template + country code). The link is returned, not opened: wa.me opened
 * after an await is popup-blocked, so the user clicks it in a dialog.
 */
export async function getReceipt(
  kind: "FEE" | "UNIFORM",
  id: string,
): Promise<ActionResult<ReceiptMessage>> {
  try {
    const [receipt, settings] = await Promise.all([
      kind === "FEE" ? paymentsApi.receipt(id) : uniformsApi.receipt(id),
      settingsApi.get(),
    ]);
    const base = {
      studentName: receipt.student.fullName,
      phoneNumber: receipt.student.phoneNumber,
      remaining: receipt.remaining,
    };
    const last = receipt.last;
    if (!last || last.amount <= 0 || receipt.paid <= 0) {
      return { success: true, data: { ...base, url: null, message: null, amount: 0 } };
    }

    const build = (phoneNumber: string) =>
      whatsappReceiptUrl({
        phoneNumber,
        countryCode: settings.whatsappCountry,
        studentName: receipt.student.fullName,
        academyName: settings.academyName,
        amount: last.amount,
        remaining: receipt.remaining,
        date: last.date,
        item:
          receipt.kind === "FEE"
            ? { kind: "FEE", month: receipt.month ?? 1, year: receipt.year ?? 0 }
            : { kind: "UNIFORM", size: receipt.size ?? null },
        template: settings.whatsappReceiptTemplate,
      });

    const url = receipt.student.phoneNumber ? build(receipt.student.phoneNumber) : null;
    // The text for the preview — built with a stand-in number when there is
    // no phone, so the admin still sees (and can copy) what would be sent.
    const textUrl = url ?? build("+0");
    const message = textUrl ? new URL(textUrl).searchParams.get("text") : null;

    return { success: true, data: { ...base, url, message, amount: last.amount } };
  } catch (err) {
    return { success: false, error: await errMsg(err, "payments.receipt.error") };
  }
}
