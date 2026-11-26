import { api } from "./client";
import type {
  DayAgenda,
  GuestCandidate,
  ReschedulePreview,
  AttendanceChecklist,
  AttendanceGrid,
  AttendanceOverview,
} from "./types";

export const attendanceApi = {
  overview: (year: number, month: number) =>
    api.get<AttendanceOverview>(`/attendance/overview?year=${year}&month=${month}`),

  monthGrid: (groupId: string, year: number, month: number) =>
    api.get<AttendanceGrid>(
      `/attendance/group/${groupId}?year=${year}&month=${month}`,
    ),

  /**
   * One group's checklist for a day WITHOUT creating it (`id` is null until the
   * first save). Use this for the "Today" screen.
   */
  day: (groupId: string, date: string) =>
    api.get<Omit<AttendanceChecklist, "id"> & { id: string | null }>(
      `/attendance/day?groupId=${groupId}&date=${date}`,
    ),

  /** Save a group's checklist for a day; creates the session on first save. */
  saveDay: (
    groupId: string,
    date: string,
    records: { studentId: string; present: boolean }[],
    notes?: string,
  ) =>
    api.put<{ id: string; saved: number; presentCount: number }>("/attendance/day", {
      groupId,
      date,
      records,
      notes,
    }),

  /** Sessions happening on a date, in time order (incl. moved / postponed). */
  agenda: (date: string) => api.get<DayAgenda>(`/attendance/agenda?date=${date}`),

  /** Check a one-session reschedule before confirming. `date` = original day. */
  reschedulePreview: (body: { groupId: string; date: string; newDate: string; startTime: string; endTime: string }) =>
    api.post<ReschedulePreview>("/attendance/reschedule/preview", body),
  /** Move this one session (weekly schedule unchanged). */
  reschedule: (body: { groupId: string; date: string; newDate: string; startTime: string; endTime: string }) =>
    api.put<{ session: AttendanceChecklist; previous: ReschedulePreview["current"]; conflicts: ReschedulePreview["conflicts"] }>(
      "/attendance/reschedule",
      body,
    ),
  /** Put a rescheduled session back on its original day/times. */
  clearReschedule: (groupId: string, date: string) =>
    api.put<{ session: AttendanceChecklist }>("/attendance/reschedule/clear", { groupId, date }),

  /** Players (other groups) who could join this session as guests. */
  guestCandidates: (groupId: string, date: string) =>
    api.get<GuestCandidate[]>(`/attendance/guests/candidates?groupId=${groupId}&date=${date}`),
  /** Add a guest to one session (`date` = the session's original day). */
  addGuest: (groupId: string, date: string, studentId: string) =>
    api.post<AttendanceChecklist>("/attendance/guests", { groupId, date, studentId }),
  removeGuest: (sessionId: string, studentId: string) =>
    api.delete<AttendanceChecklist>(`/attendance/session/${sessionId}/guests/${studentId}`),

  /** Cancel a group's session on a day (rain, holiday…). */
  cancelDay: (groupId: string, date: string, reason?: string) =>
    api.put<AttendanceChecklist>("/attendance/day/cancel", { groupId, date, reason }),
  uncancelDay: (groupId: string, date: string) =>
    api.put<AttendanceChecklist>("/attendance/day/uncancel", { groupId, date }),

  session: (id: string) => api.get<AttendanceChecklist>(`/attendance/session/${id}`),

  /** Idempotent: one checklist per group per day. */
  createSession: (groupId: string, date: string) =>
    api.post<{ id: string; created: boolean }>("/attendance/session", {
      groupId,
      date,
    }),

  saveSession: (
    id: string,
    records: { studentId: string; present: boolean }[],
    notes?: string,
  ) =>
    api.put<{ saved: number; presentCount: number }>(`/attendance/session/${id}`, {
      records,
      notes,
    }),

  deleteSession: (id: string) =>
    api.delete<{ success: true }>(`/attendance/session/${id}`),

  studentMonth: (studentId: string, year: number, month: number) =>
    api.get<{
      year: number;
      month: number;
      sessions: {
        sessionId: string;
        date: string;
        group: { id: string; name: string };
        present: boolean;
        /** Joined another group's session as a guest. */
        isGuest: boolean;
      }[];
      presentCount: number;
      totalCount: number;
    }>(`/attendance/student/${studentId}?year=${year}&month=${month}`),
};
