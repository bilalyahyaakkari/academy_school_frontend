import { api } from "./client";
import type { Uniform, UniformWithStudent } from "./types";

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
