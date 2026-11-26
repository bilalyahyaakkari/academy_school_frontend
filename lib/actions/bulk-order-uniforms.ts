"use server";

import { revalidatePath } from "next/cache";
import { uniformsApi } from "@/lib/api/uniforms";
import { ApiError } from "@/lib/api/client";
import { getT } from "@/lib/i18n/server";

export type BulkOrderResult =
  | {
      success: true;
      created: number;
      failed: number;
      errors: { studentId: string; error: string }[];
    }
  | { success: false; error: string };

/**
 * Create one uniform order per student id. Shared size, price, and isPaid
 * are applied to every row. Backend processes each row independently so
 * partial failures are surfaced.
 */
export async function bulkOrderUniforms(input: {
  studentIds: string[];
  size: string;
  /** Required: `null` (an empty price field) is rejected, never treated as 0. */
  price: number | null;
  isPaid: boolean;
}): Promise<BulkOrderResult> {
  const t = await getT();
  if (input.studentIds.length === 0) {
    return { success: false, error: t("uniforms.bulk.toast.pickStudents") };
  }
  const size = input.size.trim();
  if (!size) {
    return { success: false, error: t("uniformDialog.validation.emptySize") };
  }
  if (size.length > 20) {
    return { success: false, error: t("uniformDialog.validation.sizeTooLong") };
  }
  const price = input.price;
  if (price === null || typeof price !== "number" || !Number.isFinite(price) || price < 0) {
    return { success: false, error: t("uniforms.bulk.toast.invalidPrice") };
  }

  const payload = input.studentIds.map((studentId) => ({
    studentId,
    size,
    price,
    isPaid: input.isPaid,
    // Explicit, so the backend never has to guess what "paid" means.
    paidAmount: input.isPaid ? price : 0,
  }));

  try {
    const res = await uniformsApi.importMany(payload);
    revalidatePath("/uniforms");
    return {
      success: true,
      created: res.created,
      failed: res.failed,
      errors: res.errors.map((e) => ({ studentId: e.studentId, error: e.error })),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof ApiError ? err.message : t("uniforms.err.bulkCreate"),
    };
  }
}
