import { api } from "./client";
import type { DailyReport } from "./types";

export const reportsApi = {
  /** Cash report for one day (YYYY-MM-DD, default today) or a from/to range. */
  daily: (opts: { date?: string; from?: string; to?: string } = {}) => {
    const qs = new URLSearchParams();
    if (opts.date) qs.set("date", opts.date);
    if (opts.from) qs.set("from", opts.from);
    if (opts.to) qs.set("to", opts.to);
    const q = qs.toString();
    return api.get<DailyReport>(`/reports/daily${q ? `?${q}` : ""}`);
  },
};
