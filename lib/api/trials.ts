import { api } from "./client";
import type { Trial, TrialStatus } from "./types";

export type TrialInput = {
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: string | null;
  groupId?: string | null;
  /** YYYY-MM-DD */
  trialDate: string;
  notes?: string;
};

export const trialsApi = {
  list: (filter: { status?: TrialStatus[]; from?: string; to?: string } = {}) => {
    const qs = new URLSearchParams();
    if (filter.status?.length) qs.set("status", filter.status.join(","));
    if (filter.from) qs.set("from", filter.from);
    if (filter.to) qs.set("to", filter.to);
    const q = qs.toString();
    return api.get<Trial[]>(`/trials${q ? `?${q}` : ""}`);
  },
  get: (id: string) => api.get<Trial>(`/trials/${id}`),
  create: (body: TrialInput) => api.post<Trial>("/trials", body),
  update: (id: string, body: TrialInput) => api.put<Trial>(`/trials/${id}`, body),
  setStatus: (id: string, status: Exclude<TrialStatus, "JOINED">) =>
    api.patch<Trial>(`/trials/${id}/status`, { status }),
  /** Turn the trial into a real student (enrolled this month). */
  convert: (
    id: string,
    body: {
      fullName?: string;
      dateOfBirth: string;
      groupId?: string | null;
      phoneNumber?: string;
      monthlyFee?: number | null;
      /** YYYY-MM-DD the child starts training. */
      trainingStartDate?: string;
      firstMonth?: { mode: "FULL" | "PRORATED" | "MANUAL"; amount?: number };
    },
  ) => api.post<{ trial: Trial; studentId: string }>(`/trials/${id}/convert`, body),
  remove: (id: string) => api.delete<{ success: true }>(`/trials/${id}`),
};
