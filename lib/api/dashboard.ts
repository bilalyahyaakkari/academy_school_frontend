import { groupsApi } from "./groups";
import { studentsApi } from "./students";
import { paymentsApi } from "./payments";

/**
 * Composite "dashboard data" — fetched in parallel from several endpoints.
 * Lives here so the page itself doesn't fan out manually.
 */
export async function fetchDashboardData(year: number, month: number) {
  const [students, groups, monthRows, recent] = await Promise.all([
    studentsApi.list({ status: "active" }),
    groupsApi.list(),
    paymentsApi.monthGrid(year, month),
    paymentsApi.history({}), // last 500, descending
  ]);

  return { students, groups, monthRows, recent };
}
