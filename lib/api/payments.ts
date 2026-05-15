import { api } from "./client";
import type { Payment, PaymentWithStudent, StudentMonthRow } from "./types";

export const paymentsApi = {
  monthGrid: (year: number, month: number) =>
    api.get<StudentMonthRow[]>(`/payments/month?year=${year}&month=${month}`),

  history: (filter: { from?: string; to?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (filter.from) qs.set("from", filter.from);
    if (filter.to) qs.set("to", filter.to);
    if (filter.status) qs.set("status", filter.status);
    const q = qs.toString();
    return api.get<PaymentWithStudent[]>(`/payments/history${q ? `?${q}` : ""}`);
  },

  outstanding: () =>
    api.get<
      {
        studentId: string;
        fullName: string;
        phoneNumber: string | null;
        isActive: boolean;
        group: { id: string; name: string } | null;
        unpaidAmount: number;
        unpaidCount: number;
        oldestUnpaid: { month: number; year: number };
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

  markUnpaid: (id: string) => api.patch<Payment>(`/payments/${id}/mark-unpaid`),

  update: (id: string, body: unknown) => api.put<Payment>(`/payments/${id}`, body),
};
