import Link from "next/link";
import { fetchDashboardData } from "@/lib/api/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/app/page-header";
import { currentYearMonth, formatCurrency, formatDate } from "@/lib/utils";
import { getT, getLocale } from "@/lib/i18n/server";
import { monthLabelI18n } from "@/lib/i18n";
import { SummaryStrip } from "@/components/app/summary-strip";
import { Plus, Wallet } from "lucide-react";

export async function generateMetadata() {
  const t = await getT();
  return { title: `${t("dashboard.title")} — Academy` };
}

export default async function DashboardPage() {
  // Beirut time, not the server's UTC clock — otherwise the first hours of a
  // month would still show the previous one.
  const { year, month } = currentYearMonth();

  const t = await getT();
  const locale = await getLocale();

  const { students, groups, monthRows, recent } = await fetchDashboardData(year, month);

  const monthPayments = monthRows.flatMap((s) => s.payments);

  const collectedThisMonth = monthPayments.reduce((sum, p) => sum + p.paidAmount, 0);
  const expectedThisMonth = monthPayments.reduce((sum, p) => sum + p.amount, 0);
  const unpaidThisMonth = monthPayments.filter((p) => p.status !== "PAID");
  const pendingAmount = unpaidThisMonth.reduce(
    (sum, p) => sum + p.amount - p.paidAmount,
    0,
  );

  const recentPayments = recent
    .filter((p) => p.status === "PAID" || p.status === "PARTIAL")
    .slice(0, 10);

  // The page has no title bar: its buttons live in the summary card.
  const pageActions = (
    <>
            <Button asChild variant="outline">
              <Link href="/students/new">
                <Plus className="size-4" />
                {t("dashboard.action.addStudent")}
              </Link>
            </Button>
            <Button asChild>
              <Link href="/payments">
                <Wallet className="size-4" />
                {t("dashboard.action.payments")}
              </Link>
            </Button>
          </>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dashboard.title")}
        description={monthLabelI18n(locale, month, year)}
      />

      <SummaryStrip
        actions={pageActions}
        items={[
          {
            label: t("dashboard.stat.collected"),
            value: formatCurrency(collectedThisMonth),
            suffix: t("dashboard.stat.collected.sub", {
              expected: formatCurrency(expectedThisMonth),
            }),
            progress:
              expectedThisMonth > 0
                ? Math.min(100, (collectedThisMonth / expectedThisMonth) * 100)
                : 0,
          },
          {
            label: t("dashboard.stat.pending"),
            value: formatCurrency(pendingAmount),
            sub: t("dashboard.stat.pending.sub", { count: unpaidThisMonth.length }),
            tone: pendingAmount > 0 ? "alert" : "default",
          },
          {
            label: t("payments.stat.students"),
            value: students.length,
            sub: t("payments.stat.students.sub"),
          },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("dashboard.section.studentsPerGroup")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {groups.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {t("dashboard.groups.empty")}
            </p>
          ) : (
            groups.map((g) => {
              const max = Math.max(...groups.map((x) => x._count.students), 1);
              const pct = (g._count.students / max) * 100;
              return (
                <div key={g.id} className="space-y-1">
                  <div className="flex items-baseline justify-between text-sm">
                    <Link href={`/groups/${g.id}`} className="font-medium text-sea-900 hover:text-sea-700 hover:underline">
                      {g.name}
                    </Link>
                    <span className="text-muted-foreground">
                      {g._count.students}
                      {g.maxCapacity ? ` / ${g.maxCapacity}` : ""}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sea-800 to-sea-700 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("dashboard.section.recentPayments")}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentPayments.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">
              {t("dashboard.recent.empty")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.student")}</TableHead>
                  <TableHead>{t("table.period")}</TableHead>
                  <TableHead className="text-end">{t("table.paid")}</TableHead>
                  <TableHead>{t("table.date")}</TableHead>
                  <TableHead>{t("table.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">
                      <Link href={`/students/${p.student.id}`} className="hover:underline">
                        {p.student.fullName}
                      </Link>
                    </TableCell>
                    <TableCell>{monthLabelI18n(locale, p.month, p.year)}</TableCell>
                    <TableCell className="text-end">
                      {formatCurrency(p.paidAmount)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(p.paymentDate, locale)}
                    </TableCell>
                    <TableCell>
                      {p.status === "PAID" ? (
                        <Badge variant="success">{t("common.paid")}</Badge>
                      ) : (
                        <Badge variant="warning">{t("common.partial")}</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
