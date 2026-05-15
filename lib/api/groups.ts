import { api } from "./client";
import type { Group, GroupDetail, GroupWithCount } from "./types";

export const groupsApi = {
  list: () => api.get<GroupWithCount[]>("/groups"),

  get: (id: string) => api.get<GroupDetail>(`/groups/${id}`),

  create: (body: unknown) => api.post<Group>("/groups", body),

  update: (id: string, body: unknown) => api.put<Group>(`/groups/${id}`, body),

  remove: (id: string) => api.delete<{ success: true }>(`/groups/${id}`),
};
