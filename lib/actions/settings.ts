"use server";

import { revalidatePath } from "next/cache";
import { settingsApi } from "@/lib/api/settings";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { getT } from "@/lib/i18n/server";
import { DEFAULT_RECEIPT_TEMPLATE, DEFAULT_WHATSAPP_TEMPLATE } from "@/lib/utils";
import type { Settings } from "@/lib/api/types";

type ActionResult = { success: true } | { success: false; error: string };

export async function updateSettings(formData: FormData): Promise<ActionResult> {
  const tplRaw = formData.get("whatsappTemplate");

  const body: {
    academyName: string;
    defaultFee: number;
    whatsappCountry: string;
    whatsappTemplate?: string | null;
    whatsappReceiptTemplate?: string | null;
    siblingDiscountType?: Settings["siblingDiscountType"];
    siblingDiscountValue?: number;
  } = {
    academyName: String(formData.get("academyName") ?? "").trim(),
    defaultFee: Number(formData.get("defaultFee") ?? 0),
    whatsappCountry: String(formData.get("whatsappCountry") ?? "").trim(),
  };

  // Only include whatsappTemplate if the form actually carried it (the General
  // form doesn't, the WhatsApp form does). Backend treats `undefined` as
  // "leave alone" and `null` as "reset to default".
  if (tplRaw !== null) {
    const tpl = String(tplRaw);
    // Empty, or identical to the built-in default → store null, so the
    // reminder keeps following the default if it ever changes.
    body.whatsappTemplate =
      tpl.trim().length > 0 && tpl.trim() !== DEFAULT_WHATSAPP_TEMPLATE.trim() ? tpl : null;
  }

  // Same rule for the receipt template (sent only by the receipt form).
  const receiptRaw = formData.get("whatsappReceiptTemplate");
  if (receiptRaw !== null) {
    const tpl = String(receiptRaw);
    body.whatsappReceiptTemplate =
      tpl.trim().length > 0 && tpl.trim() !== DEFAULT_RECEIPT_TEMPLATE.trim() ? tpl : null;
  }

  // Sibling discount (sent only by the discount form).
  const typeRaw = formData.get("siblingDiscountType");
  if (typeRaw !== null) {
    const type = String(typeRaw);
    if (type !== "NONE" && type !== "PERCENT" && type !== "FIXED") {
      const t = await getT();
      return { success: false, error: t("payments.error.generic") };
    }
    const valueRaw = formData.get("siblingDiscountValue");
    const value = type === "NONE" ? 0 : Number(valueRaw ?? 0);
    if (!Number.isFinite(value) || value < 0) {
      const t = await getT();
      return { success: false, error: t("payments.settings.discount.err.value") };
    }
    if (type === "PERCENT" && value > 100) {
      const t = await getT();
      return { success: false, error: t("payments.settings.discount.err.percent") };
    }
    body.siblingDiscountType = type;
    body.siblingDiscountValue = value;
  }

  try {
    await settingsApi.update(body);
  } catch (err) {
    const t = await getT();
    return {
      success: false,
      error: err instanceof ApiError ? err.message : t("payments.error.generic"),
    };
  }
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  // defaultFee or the sibling discount may have changed → unpaid invoices
  // were re-priced server-side.
  revalidatePath("/payments");
  revalidatePath("/payments/outstanding");
  return { success: true };
}

export async function changePasswordAction(
  formData: FormData,
): Promise<ActionResult> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const t = await getT();
  if (newPassword.length < 6) {
    return { success: false, error: t("payments.error.settings.passwordLength") };
  }
  if (newPassword !== confirmPassword) {
    return { success: false, error: t("payments.error.settings.passwordMismatch") };
  }

  try {
    await authApi.changePassword({ currentPassword, newPassword });
  } catch (err) {
    return {
      success: false,
      error: err instanceof ApiError ? err.message : t("payments.error.settings.password"),
    };
  }
  return { success: true };
}
