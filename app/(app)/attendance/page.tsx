import { PageHeader } from "@/components/app/page-header";
import { AttendanceTabs, type AttendanceTab } from "@/components/attendance/attendance-tabs";
import { TodayView } from "@/components/attendance/today-view";
import { isIsoDay, weekdayKey } from "@/components/attendance/session-dates";
import { HistoryView } from "@/components/attendance/history-view";
import { UnsavedChangesProvider } from "@/components/attendance/unsaved-guard";
import { formatDateOnly, resolveYearMonth, todayIso } from "@/lib/utils";
import { getT, getLocale } from "@/lib/i18n/server";
import { monthLabelI18n } from "@/lib/i18n";

export async function generateMetadata() {
  const t = await getT();
  return { title: `${t("attendance.title")} — Academy` };
}

type SearchParams = Promise<{
  tab?: string | string[];
  group?: string | string[];
  at?: string | string[];
  session?: string | string[];
  date?: string | string[];
  year?: string | string[];
  month?: string | string[];
}>;

const one = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);

/**
 * /attendance?tab=today&group=<id>   take today's attendance (default)
 * /attendance?tab=today&date=YYYY-MM-DD   another day (e.g. where a session was moved)
 * /attendance?tab=today&session=<id>   a session moved onto that day
 * /attendance?tab=history&year=&month=   month overview
 *
 * A bare ?year=&month= (what MonthPicker and older links produce) also means
 * History, so the month picker and back links land on the right tab.
 */
export default async function AttendancePage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const tabParam = one(sp.tab);
  const tab: AttendanceTab =
    tabParam === "history" || tabParam === "today"
      ? tabParam
      : one(sp.year) || one(sp.month)
        ? "history"
        : "today";
  const { year, month } = resolveYearMonth(sp);

  const t = await getT();
  const locale = await getLocale();
  // The Today tab's day: ?date=YYYY-MM-DD, else today in Beirut.
  const dateParam = one(sp.date);
  const day = isIsoDay(dateParam) ? dateParam : todayIso();

  return (
    <UnsavedChangesProvider>
      <div className="space-y-5">
        <PageHeader
          title={t("attendance.title")}
          description={
            tab === "today"
              ? t("attendance.today.desc", {
                  weekday: t(weekdayKey(day)),
                  date: formatDateOnly(day, locale),
                })
              : t("attendance.history.desc", { month: monthLabelI18n(locale, month, year) })
          }
        />

        <AttendanceTabs
          active={tab}
          historyHref={
            tab === "history"
              ? `/attendance?tab=history&year=${year}&month=${month}`
              : "/attendance?tab=history"
          }
        />

        {tab === "today" ? (
          <TodayView
            date={day}
            groupParam={one(sp.group)}
            atParam={one(sp.at)}
            sessionParam={one(sp.session)}
          />
        ) : (
          <HistoryView year={year} month={month} />
        )}
      </div>
    </UnsavedChangesProvider>
  );
}
