import Link from "next/link";
import { paymentsApi } from "@/lib/api/payments";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/app/page-header";
import { SummaryStrip } from "@/components/app/summary-strip";
import { PaymentsTable } from "@/components/payments/payments-table";
import { MonthPicker } from "@/components/payments/month-picker";
import { GenerateInvoicesButton } from "@/components/payments/generate-invoices-button";
import { formatCurrency, resolveYearMonth } from "@/lib/utils";
import { getT, getLocale } from "@/lib/i18n/server";
import { monthLabelI18n } from "@/lib/i18n";
import { AlertCircle, CalendarRange, Coins } from "lucide-react";

export async function generateMetadata() {
  const t = await getT();
  return { title: `${t("payments.title")} — Academy` };
}

type SearchParams = Promise<{ year?: string | string[]; month?: string | string[] }>;

export default async function PaymentsPage({ searchParams }: { searchParams: SearchParams }) {
  const { year, month } = resolveYearMonth(await searchParams);

  const t = await getT();
  const locale = await getLocale();

  const students = await paymentsApi.monthGrid(year, month);

  const totalDue = students.reduce(
    (sum, s) => sum + (s.payments[0] ? s.payments[0].amount : 0),
    0,
  );
  const totalCollected = students.reduce(
    (sum, s) => sum + (s.payments[0] ? s.payments[0].paidAmount : 0),
    0,
  );
  const missingInvoices = students.filter((s) => s.payments.length === 0).length;
  const unpaidCount = students.filter(
    (s) => s.payments[0] && s.payments[0].status !== "PAID",
  ).length;
  const outstanding = totalDue - totalCollected;

  // The page has no title bar: its buttons live in the summary card.
  const pageActions = (
    <>
            <Button asChild variant="outline">
              <Link href={`/roster?year=${year}&month=${month}`}>
                <CalendarRange className="size-4" />
                {t("nav.roster")}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/payments/daily">
                <Coins className="size-4" />
                {t("payments.daily.link")}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/payments/outstanding">
                <AlertCircle className="size-4" />
                {t("payments.action.outstanding")}
              </Link>
            </Button>
            <GenerateInvoicesButton
              year={year}
              month={month}
              pendingCount={missingInvoices}
            />
          </>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("payments.title")}
        description={
          students.length === 1
            ? t("payments.descMonth.one", { month: monthLabelI18n(locale, month, year) })
            : t("payments.descMonth", {
                month: monthLabelI18n(locale, month, year),
                count: students.length,
              })
        }
      />

      <MonthPicker year={year} month={month} />

      <SummaryStrip
        actions={pageActions}
        items={[
          {
            label: t("payments.stat.collected"),
            value: formatCurrency(totalCollected),
            suffix: t("dashboard.stat.collected.sub", {
              expected: formatCurrency(totalDue),
            }),
            progress:
              totalDue > 0 ? Math.min(100, (totalCollected / totalDue) * 100) : 0,
            sub:
              totalDue > 0
                ? t("payments.stat.collected.sub", {
                    percent: Math.round((totalCollected / totalDue) * 100),
                  })
                : undefined,
          },
          {
            label: t("payments.stat.outstanding"),
            value: formatCurrency(outstanding),
            sub:
              missingInvoices === 1
                ? t("payments.stat.outstanding.sub", {
                    unpaid: unpaidCount,
                    missing: missingInvoices,
                  })
                : t("payments.stat.outstanding.sub.plural", {
                    unpaid: unpaidCount,
                    missing: missingInvoices,
                  }),
            tone: outstanding > 0 ? "alert" : "default",
          },
        ]}
      />

      <PaymentsTable
        rows={students.map((s) => ({
          studentId: s.id,
          studentName: s.fullName,
          phoneNumber: s.phoneNumber,
          groupName: s.group?.name ?? null,
          payment: s.payments[0]
            ? {
                id: s.payments[0].id,
                amount: s.payments[0].amount,
                discount: s.payments[0].discount ?? 0,
                paidAmount: s.payments[0].paidAmount,
                status: s.payments[0].status,
                paymentMethod: s.payments[0].paymentMethod,
                paymentDate: s.payments[0].paymentDate,
                notes: s.payments[0].notes,
              }
            : null,
        }))}
      />
    </div>
  );
}
