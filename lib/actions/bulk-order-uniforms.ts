"use server";

import { revalidatePath } from "next/cache";
import { uniformsApi } from "@/lib/api/uniforms";
import { ApiError } from "@/lib/api/client";

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
  price: number;
  isPaid: boolean;
}): Promise<BulkOrderResult> {
  if (input.studentIds.length === 0) {
    return { success: false, error: "Pick at least one student" };
  }
  if (!input.size.trim()) {
    return { success: false, error: "Size is required" };
  }
  if (!Number.isFinite(input.price) || input.price < 0) {
    return { success: false, error: "Price must be a non-negative number" };
  }

  const payload = input.studentIds.map((studentId) => ({
    studentId,
    size: input.size.trim(),
    price: input.price,
    isPaid: input.isPaid,
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
      error: err instanceof ApiError ? err.message : "Failed to create orders",
    };
  }
}
