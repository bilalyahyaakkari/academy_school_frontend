"use server";

import { revalidatePath } from "next/cache";
import { supplierOrdersApi } from "@/lib/api/supplier-orders";
import { ApiError } from "@/lib/api/client";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n";
import type { SupplierOrderPreview } from "@/lib/api/types";

type Fail = { success: false; error: string };
type ActionResult = { success: true } | Fail;
type AlreadyOrdered = SupplierOrderPreview["alreadyOrdered"];

/** The backend's message when it gave one, else a translated fallback. */
async function errMsg(err: unknown, fallback: TranslationKey): Promise<string> {
  if (err instanceof ApiError) return err.message;
  const t = await getT();
  return t(fallback);
}

/**
 * The Uniforms list, the orders list and every order page all show supplier
 * order data (the "#12" chips, states, totals) — refresh the whole subtree.
 */
function revalidateUniforms() {
  revalidatePath("/uniforms", "layout");
}

/** Quantities per size for the chosen requests + who is already ordered. */
export async function previewSupplierOrder(
  uniformIds: string[],
): Promise<{ success: true; preview: SupplierOrderPreview } | Fail> {
  if (uniformIds.length === 0) {
    const t = await getT();
    return { success: false, error: t("uniforms.err.noneSelected") };
  }
  try {
    const preview = await supplierOrdersApi.preview(uniformIds);
    return { success: true, preview };
  } catch (err) {
    return { success: false, error: await errMsg(err, "uniforms.supplier.err.preview") };
  }
}

/**
 * Creates a DRAFT order. When some requests turned out to be in an open order
 * meanwhile (409), returns them so the dialog can ask again.
 */
export async function createSupplierOrder(input: {
  uniformIds: string[];
  notes?: string;
  allowReorder?: boolean;
}): Promise<
  | { success: true; id: string; number: number }
  | (Fail & { alreadyOrdered?: AlreadyOrdered })
> {
  const t = await getT();
  if (input.uniformIds.length === 0) {
    return { success: false, error: t("uniforms.supplier.err.nothingToOrder") };
  }
  const notes = input.notes?.trim();
  try {
    const order = await supplierOrdersApi.create({
      uniformIds: input.uniformIds,
      notes: notes ? notes : undefined,
      allowReorder: input.allowReorder || undefined,
    });
    revalidateUniforms();
    return { success: true, id: order.id, number: order.number };
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      const details = err.details as { alreadyOrdered?: AlreadyOrdered } | undefined;
      return {
        success: false,
        error: t("uniforms.supplier.err.conflict"),
        alreadyOrdered: details?.alreadyOrdered ?? [],
      };
    }
    return { success: false, error: await errMsg(err, "uniforms.supplier.err.create") };
  }
}

export async function markSupplierOrderSent(id: string): Promise<ActionResult> {
  try {
    await supplierOrdersApi.markOrdered(id);
  } catch (err) {
    return { success: false, error: await errMsg(err, "uniforms.supplier.err.update") };
  }
  revalidateUniforms();
  return { success: true };
}

export async function markSupplierOrderDraft(id: string): Promise<ActionResult> {
  try {
    await supplierOrdersApi.markDraft(id);
  } catch (err) {
    return { success: false, error: await errMsg(err, "uniforms.supplier.err.update") };
  }
  revalidateUniforms();
  return { success: true };
}

export async function deleteSupplierOrder(id: string): Promise<ActionResult> {
  try {
    await supplierOrdersApi.remove(id);
  } catch (err) {
    return { success: false, error: await errMsg(err, "uniforms.supplier.err.delete") };
  }
  revalidateUniforms();
  return { success: true };
}

/** Records one delivery batch. Touches the order only — never hand-outs or payments. */
export async function receiveSupplierOrder(
  id: string,
  input: { receivedAt?: string; note?: string; lines: { size: string; quantity: number }[] },
): Promise<ActionResult> {
  const lines = input.lines
    .map((l) => ({ size: l.size.trim(), quantity: Math.floor(Number(l.quantity)) }))
    .filter((l) => l.size && Number.isFinite(l.quantity) && l.quantity > 0);
  if (lines.length === 0) {
    const t = await getT();
    return { success: false, error: t("uniforms.receive.err.empty") };
  }
  const note = input.note?.trim();
  try {
    await supplierOrdersApi.receive(id, {
      receivedAt: input.receivedAt || undefined,
      note: note ? note : undefined,
      lines,
    });
  } catch (err) {
    return { success: false, error: await errMsg(err, "uniforms.receive.err.save") };
  }
  revalidateUniforms();
  return { success: true };
}

export async function deleteSupplierReceipt(
  id: string,
  receiptId: string,
): Promise<ActionResult> {
  try {
    await supplierOrdersApi.removeReceipt(id, receiptId);
  } catch (err) {
    return { success: false, error: await errMsg(err, "uniforms.receive.err.delete") };
  }
  revalidateUniforms();
  return { success: true };
}
