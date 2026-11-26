import { api } from "./client";
import type { PaymentMethod, Receipt, Uniform, UniformWithStudent } from "./types";

export const uniformsApi = {
  list: (filter: { paid?: "true" | "false" } = {}) => {
    const qs = new URLSearchParams();
    if (filter.paid) qs.set("paid", filter.paid);
    const q = qs.toString();
    return api.get<UniformWithStudent[]>(`/uniforms${q ? `?${q}` : ""}`);
  },

  create: (body: unknown) => api.post<Uniform>("/uniforms", body),
  update: (id: string, body: unknown) => api.put<Uniform>(`/uniforms/${id}`, body),
  togglePaid: (id: string) => api.patch<Uniform>(`/uniforms/${id}/toggle-paid`),
  toggleReceived: (id: string) =>
    api.patch<Uniform>(`/uniforms/${id}/toggle-received`),
  addPayment: (id: string, body: { amount: number; paymentMethod?: PaymentMethod }) =>
    api.post<Uniform>(`/uniforms/${id}/add-payment`, body),
  /** What a receipt needs: latest money received, total paid, remaining. */
  receipt: (id: string) => api.get<Receipt>(`/uniforms/${id}/receipt`),
  remove: (id: string) => api.delete<{ success: true }>(`/uniforms/${id}`),

  importMany: (uniforms: unknown[]) =>
    api.post<{
      created: number;
      failed: number;
      errors: { row: number; studentId: string; error: string }[];
    }>("/uniforms/import", { uniforms }),

  bulkDelete: (ids: string[]) =>
    api.post<{ deleted: number }>("/uniforms/bulk-delete", { ids }),
};
