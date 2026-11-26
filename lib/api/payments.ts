import { api } from "./client";
import type { Payment, PaymentHistory, PaymentStats, Receipt, StudentMonthRow } from "./types";

export const paymentsApi = {
  monthGrid: (year: number, month: number) =>
    api.get<StudentMonthRow[]>(`/payments/month?year=${year}&month=${month}`),

  history: (filter: { from?: string; to?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (filter.from) qs.set("from", filter.from);
    if (filter.to) qs.set("to", filter.to);
    if (filter.status) qs.set("status", filter.status);
    const q = qs.toString();
    return api.get<PaymentHistory>(`/payments/history${q ? `?${q}` : ""}`);
  },

  stats: (year: number) => api.get<PaymentStats>(`/payments/stats?year=${year}`),

  outstanding: () =>
    api.get<
      {
        studentId: string;
        fullName: string;
        phoneNumber: string | null;
        isActive: boolean;
        /** True when the student has left the academy — the debt still stands. */
        archived: boolean;
        /** Students with the same familyId are siblings. */
        familyId: string | null;
        group: { id: string; name: string } | null;
        unpaidAmount: number;
        unpaidCount: number;
        oldestUnpaid: { month: number; year: number };
        /** Every month still owed, oldest first, with what's left on each. */
        months: { month: number; year: number; due: number }[];
      }[]
    >("/payments/outstanding"),

  generateInvoices: (year: number, month: number) =>
    api.post<{ created: number; skipped: number }>("/payments/generate-invoices", {
      year,
      month,
    }),

  markPaid: (id: string, method: "CASH" | "BANK_TRANSFER" | "OTHER" = "CASH") =>
    api.patch<Payment>(`/payments/${id}/mark-paid?method=${method}`),

  addPayment: (
    id: string,
    body: {
      amount: number;
      paymentMethod?: "CASH" | "BANK_TRANSFER" | "OTHER";
      notes?: string;
    },
  ) => api.post<Payment>(`/payments/${id}/add-payment`, body),

  /** What a receipt needs: latest money received, total paid, remaining. */
  receipt: (id: string) => api.get<Receipt>(`/payments/${id}/receipt`),

  markUnpaid: (id: string) => api.patch<Payment>(`/payments/${id}/mark-unpaid`),

  update: (id: string, body: unknown) => api.put<Payment>(`/payments/${id}`, body),
};
