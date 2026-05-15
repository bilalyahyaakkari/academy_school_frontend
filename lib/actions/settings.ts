"use server";

import { revalidatePath } from "next/cache";
import { settingsApi } from "@/lib/api/settings";
import { authApi } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

type ActionResult = { success: true } | { success: false; error: string };

export async function updateSettings(formData: FormData): Promise<ActionResult> {
  const tplRaw = formData.get("whatsappTemplate");

  const body: {
    academyName: string;
    defaultFee: number;
    whatsappCountry: string;
    whatsappTemplate?: string | null;
  } = {
    academyName: String(formData.get("academyName") ?? "").trim(),
    defaultFee: Number(formData.get("defaultFee") ?? 0),
    whatsappCountry: String(formData.get("whatsappCountry") ?? "").trim(),
  };

  // Only include whatsappTemplate if the form actually carried it (the General
  // form doesn't, the WhatsApp form does). Backend treats `undefined` as
  // "leave alone" and `null` as "reset to default".
  if (tplRaw !== null) {
    const t = String(tplRaw);
    body.whatsappTemplate = t.trim().length > 0 ? t : null;
  }

  try {
    await settingsApi.update(body);
  } catch (err) {
    return { success: false, error: err instanceof ApiError ? err.message : "Failed" };
  }
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function changePasswordAction(
  formData: FormData,
): Promise<ActionResult> {
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (newPassword.length < 6) {
    return { success: false, error: "New password must be at least 6 characters" };
  }
  if (newPassword !== confirmPassword) {
    return { success: false, error: "Passwords don't match" };
  }

  try {
    await authApi.changePassword({ currentPassword, newPassword });
  } catch (err) {
    return {
      success: false,
      error: err instanceof ApiError ? err.message : "Failed to change password",
    };
  }
  return { success: true };
}
