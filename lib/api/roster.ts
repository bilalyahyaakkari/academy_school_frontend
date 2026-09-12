import { api } from "./client";
import type {
  RosterCandidate,
  RosterMonth,
  RosterMonthSummary,
} from "./types";

export const rosterApi = {
  month: (year: number, month: number) =>
    api.get<RosterMonth>(`/roster?year=${year}&month=${month}`),

  available: (year: number, month: number) =>
    api.get<RosterCandidate[]>(`/roster/available?year=${year}&month=${month}`),

  months: () => api.get<RosterMonthSummary[]>("/roster/months"),

  seed: (year: number, month: number) =>
    api.post<{ created: number }>("/roster/seed", { year, month }),

  add: (year: number, month: number, studentIds: string[]) =>
    api.post<{ added: number; restored: number }>("/roster/add", {
      year,
      month,
      studentIds,
    }),

  /** Remove from this one month only. Their invoice for it is kept. */
  remove: (year: number, month: number, studentId: string) =>
    api.post<{ removed: true; keptPayment: { id: string; paidAmount: number } | null }>(
      "/roster/remove",
      { year, month, studentId },
    ),

  /** "They left" — remove from this month onwards and archive them. */
  removeFrom: (year: number, month: number, studentId: string) =>
    api.post<{ removedMonths: number }>("/roster/remove-from", {
      year,
      month,
      studentId,
    }),
};
