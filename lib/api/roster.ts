import { api } from "./client";
import type {
  RosterCandidate,
  RosterMonth,
  RosterMonthSummary,
} from "./types";

/** Shared by both removal endpoints: what happened to the student's invoices. */
type RosterRemoveResult = {
  /** Invoices deleted because nothing had been paid on them. */
  deletedInvoices: number;
  /** Invoices left alone because money was already recorded against them. */
  keptInvoices: { id: string; year: number; month: number; amount: number; paidAmount: number }[];
};

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

  /**
   * Remove from this one month only. The month's invoice goes with them unless
   * money has already been recorded against it, in which case it is kept and
   * returned in `keptInvoices`.
   */
  remove: (year: number, month: number, studentId: string) =>
    api.post<RosterRemoveResult & { removed: true }>("/roster/remove", {
      year,
      month,
      studentId,
    }),

  /** "They left" — remove from this month onwards and archive them. */
  removeFrom: (year: number, month: number, studentId: string) =>
    api.post<RosterRemoveResult & { removedMonths: number }>("/roster/remove-from", {
      year,
      month,
      studentId,
    }),
};
