import { api } from "./client";
import type { SiblingSuggestion, StudentDetail, StudentWithGroup } from "./types";

export const studentsApi = {
  list: (filter: {
    q?: string;
    groupId?: string;
    archived?: "exclude" | "only" | "include";
  }) => {
    const qs = new URLSearchParams();
    if (filter.q) qs.set("q", filter.q);
    if (filter.groupId) qs.set("groupId", filter.groupId);
    if (filter.archived) qs.set("archived", filter.archived);
    const query = qs.toString();
    return api.get<StudentWithGroup[]>(`/students${query ? `?${query}` : ""}`);
  },

  get: (id: string) => api.get<StudentDetail>(`/students/${id}`),

  create: (body: unknown) => api.post<StudentDetail>("/students", body),

  update: (id: string, body: unknown) => api.put<StudentDetail>(`/students/${id}`, body),

  /** Move a student to another group (null = no group). */
  changeGroup: (id: string, groupId: string | null) =>
    api.patch<StudentDetail>(`/students/${id}/group`, { groupId }),

  /** Students with the same parent phone, not yet linked as siblings. */
  siblingSuggestions: (id: string) =>
    api.get<SiblingSuggestion[]>(`/students/${id}/sibling-suggestions`),
  /** Link two students as siblings (merges families). */
  linkSibling: (id: string, siblingId: string) =>
    api.post<StudentDetail>(`/students/${id}/siblings`, { siblingId }),
  /** Take a student out of their family. */
  unlinkSibling: (id: string) => api.delete<StudentDetail>(`/students/${id}/family`),

  archive: (id: string) => api.patch<StudentDetail>(`/students/${id}/archive`),
  unarchive: (id: string) => api.patch<StudentDetail>(`/students/${id}/unarchive`),

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
