import { api } from "./client";
import type { SupplierOrder, SupplierOrderPreview } from "./types";

export const supplierOrdersApi = {
  list: () => api.get<SupplierOrder[]>("/supplier-orders"),
  get: (id: string) => api.get<SupplierOrder>(`/supplier-orders/${id}`),
  /** Quantities per size for chosen uniform requests (+ already-ordered warning). */
  preview: (uniformIds: string[]) =>
    api.post<SupplierOrderPreview>("/supplier-orders/preview", { uniformIds }),
  /** Create a DRAFT order. 409 when some are in an open order (unless allowReorder). */
  create: (body: { uniformIds: string[]; notes?: string; allowReorder?: boolean }) =>
    api.post<SupplierOrder>("/supplier-orders", body),
  /** Confirm it was sent to the supplier. */
  markOrdered: (id: string) => api.post<SupplierOrder>(`/supplier-orders/${id}/ordered`),
  /** Back to draft (only before any delivery). */
  markDraft: (id: string) => api.post<SupplierOrder>(`/supplier-orders/${id}/draft`),
  /** Delete a draft (its requests become free again). */
  remove: (id: string) => api.delete<{ success: true }>(`/supplier-orders/${id}`),
  /** Record one delivery batch (sizes not ordered are allowed — they show as extra). */
  receive: (id: string, body: { receivedAt?: string; note?: string; lines: { size: string; quantity: number }[] }) =>
    api.post<SupplierOrder>(`/supplier-orders/${id}/receipts`, body),
  removeReceipt: (id: string, receiptId: string) =>
    api.delete<SupplierOrder>(`/supplier-orders/${id}/receipts/${receiptId}`),
};
