import Link from "next/link";
import { paymentsApi } from "@/lib/api/payments";
import type { PaymentStatus } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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

export async function generateMetadata() {
  const t = await getT();
  return { title: `${t("payments.history.title")} — Academy` };
}

type SearchParams = Promise<{ from?: string; to?: string; status?: string }>;

export default async function PaymentHistoryPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const t = await getT();
  const locale = await getLocale();
  const { rows: payments, total, truncated } = await paymentsApi.history({
    from: sp.from,
    to: sp.to,
    status: sp.status,
  });

  const statusBadge = (status: PaymentStatus) =>
    status === "PAID" ? (
      <Badge variant="success">{t("common.paid")}</Badge>
    ) : status === "PARTIAL" ? (
      <Badge variant="warning">{t("common.partial")}</Badge>
    ) : (
      <Badge variant="alert">{t("common.unpaid")}</Badge>
    );

  const description = truncated
    ? t("payments.history.truncated", { shown: payments.length, total })
    : total === 1
      ? t("payments.history.desc.one")
      : t("payments.history.desc", { count: total });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("payments.history.title")}
        description={description}
        backHref="/payments"
        backLabel={t("payments.back")}
      />

      {/* The page has no visible title bar, so the record count lives here. */}
      <p className={truncated ? "text-xs font-medium text-alert" : "text-xs text-muted-foreground"}>
        {description}
      </p>

      {/* ===== Desktop / tablet: table ===== */}
      <Card className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("table.student")}</TableHead>
              <TableHead>{t("table.period")}</TableHead>
              <TableHead className="text-end">{t("table.amount")}</TableHead>
              <TableHead className="text-end">{t("table.paid")}</TableHead>
              <TableHead>{t("payments.table.method")}</TableHead>
              <TableHead>{t("table.date")}</TableHead>
              <TableHead>{t("table.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  {t("payments.history.empty")}
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <Link href={`/students/${p.student.id}`} className="hover:underline">
                      {p.student.fullName}
                    </Link>
                  </TableCell>
                  <TableCell>{monthLabelI18n(locale, p.month, p.year)}</TableCell>
                  <TableCell className="text-end">{formatCurrency(p.amount)}</TableCell>
                  <TableCell className="text-end">{formatCurrency(p.paidAmount)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.paymentMethod ? t(`payments.method.${p.paymentMethod}`) : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(p.paymentDate, locale)}
                  </TableCell>
                  <TableCell>{statusBadge(p.status)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* ===== Mobile: card layout ===== */}
      <div className="md:hidden">
        {payments.length === 0 ? (
          <Card className="py-12 text-center text-sm text-muted-foreground">
            {t("payments.history.empty")}
          </Card>
        ) : (
          <ul className="space-y-2">
            {payments.map((p) => (
              <li
                key={p.id}
                className="rounded-xl border border-border bg-card p-3 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/students/${p.student.id}`}
                      className="block truncate font-semibold hover:underline"
                    >
                      {p.student.fullName}
                    </Link>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {monthLabelI18n(locale, p.month, p.year)}
                      {p.paymentDate && ` • ${formatDate(p.paymentDate, locale)}`}
                    </p>
                  </div>
                  <div className="shrink-0">{statusBadge(p.status)}</div>
                </div>
                <div className="mt-2 flex items-baseline justify-between border-t border-border pt-2 text-sm">
                  <span className="font-semibold text-foreground">
                    {formatCurrency(p.paidAmount)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    / {formatCurrency(p.amount)}
                    {p.paymentMethod && ` • ${t(`payments.method.${p.paymentMethod}`)}`}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
