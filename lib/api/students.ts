import { api } from "./client";
import type { StudentDetail, StudentWithGroup } from "./types";

export const studentsApi = {
  list: (filter: { q?: string; groupId?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (filter.q) qs.set("q", filter.q);
    if (filter.groupId) qs.set("groupId", filter.groupId);
    if (filter.status) qs.set("status", filter.status);
    const query = qs.toString();
    return api.get<StudentWithGroup[]>(`/students${query ? `?${query}` : ""}`);
  },

  get: (id: string) => api.get<StudentDetail>(`/students/${id}`),

  create: (body: unknown) => api.post<StudentDetail>("/students", body),

  update: (id: string, body: unknown) => api.put<StudentDetail>(`/students/${id}`, body),

  toggleActive: (id: string) => api.patch<StudentDetail>(`/students/${id}/toggle-active`),

  remove: (id: string) => api.delete<{ success: true }>(`/students/${id}`),

  importMany: (students: unknown[]) =>
    api.post<{
      created: number;
      failed: number;
      errors: { row: number; fullName: string; error: string }[];
    }>("/students/import", { students }),

  bulkDelete: (ids: string[]) =>
    api.post<{ deleted: number }>("/students/bulk-delete", { ids }),
};
