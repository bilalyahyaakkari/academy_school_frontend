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
import { formatCurrency, formatDate } from "@/lib/utils";
import { getT, getLocale } from "@/lib/i18n/server";
import { monthLabelI18n } from "@/lib/i18n";
import {
  Users,
  CircleDollarSign,
  AlertCircle,
  Plus,
  Wallet,
} from "lucide-react";

export const metadata = { title: "Dashboard — Academy" };

export default async function DashboardPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

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

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("dashboard.title")}
        description={monthLabelI18n(locale, month, year)}
        actions={
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
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={<CircleDollarSign className="size-6" />}
          label={t("dashboard.stat.collected")}
          value={formatCurrency(collectedThisMonth)}
          sub={t("dashboard.stat.collected.sub", {
            expected: formatCurrency(expectedThisMonth),
          })}
          tone="primary"
        />
        <StatCard
          icon={<AlertCircle className="size-6" />}
          label={t("dashboard.stat.pending")}
          value={formatCurrency(pendingAmount)}
          sub={t("dashboard.stat.pending.sub", {
            count: unpaidThisMonth.length,
          })}
          tone="warn"
        />
        <StatCard
          icon={<Users className="size-6" />}
          label={t("dashboard.stat.activeStudents")}
          value={String(students.length)}
          tone="success"
        />
      </div>

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
                    <Link href={`/groups/${g.id}`} className="font-medium hover:underline">
                      {g.name}
                    </Link>
                    <span className="text-muted-foreground">
                      {g._count.students}
                      {g.maxCapacity ? ` / ${g.maxCapacity}` : ""}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-primary transition-all"
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
                      {formatDate(p.paymentDate)}
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

function StatCard({
  icon,
  label,
  value,
  sub,
  tone = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: "primary" | "warn" | "success";
}) {
  const iconBg =
    tone === "warn"
      ? "bg-gradient-to-br from-warning to-warning/70 text-warning-foreground"
      : tone === "success"
        ? "bg-gradient-to-br from-success to-success/70 text-success-foreground"
        : "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground";

  const accentBar =
    tone === "warn"
      ? "from-warning to-warning/40"
      : tone === "success"
        ? "from-success to-success/40"
        : "from-primary to-primary/40";

  const glow =
    tone === "warn"
      ? "from-warning/10 via-warning/5 to-transparent"
      : tone === "success"
        ? "from-success/10 via-success/5 to-transparent"
        : "from-primary/10 via-primary/5 to-transparent";

  return (
    <Card className="group relative overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5">
      {/* Top accent bar */}
      <span
        aria-hidden
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accentBar}`}
      />
      {/* Corner glow */}
      <span
        aria-hidden
        className={`pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-gradient-to-br ${glow} opacity-0 transition-opacity group-hover:opacity-100`}
      />
      <CardContent className="relative pt-7">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
            {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div
            className={`grid size-12 shrink-0 place-items-center rounded-xl shadow-md transition-transform group-hover:scale-110 ${iconBg}`}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
