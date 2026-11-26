import Link from "next/link";
import { rosterApi } from "@/lib/api/roster";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { SummaryStrip } from "@/components/app/summary-strip";
import { MonthPicker } from "@/components/payments/month-picker";
import { RosterTable } from "@/components/roster/roster-table";
import { AddStudentsDialog } from "@/components/roster/add-students-dialog";
import { CarryOverButton } from "@/components/roster/carry-over-button";
import { formatCurrency, resolveYearMonth } from "@/lib/utils";
import { getT, getLocale } from "@/lib/i18n/server";
import { monthLabelI18n } from "@/lib/i18n";
import { CalendarRange, Wallet } from "lucide-react";

export async function generateMetadata() {
  const t = await getT();
  return { title: `${t("roster.title")} — Academy` };
}

type SearchParams = Promise<{ year?: string | string[]; month?: string | string[] }>;

export default async function RosterPage({ searchParams }: { searchParams: SearchParams }) {
  const { year, month } = resolveYearMonth(await searchParams);

  const t = await getT();
  const locale = await getLocale();

  const [roster, candidates] = await Promise.all([
    rosterApi.month(year, month),
    rosterApi.available(year, month),
  ]);

  const monthName = monthLabelI18n(locale, month, year);
  const prevName = monthLabelI18n(locale, roster.previous.month, roster.previous.year);

  const collected = roster.students.reduce(
    (sum, s) => sum + (s.payment ? s.payment.paidAmount : 0),
    0,
  );
  const due = roster.students.reduce(
    (sum, s) => sum + (s.payment ? s.payment.amount : 0),
    0,
  );

  // The page has no title bar: its buttons live in the summary card.
  const pageActions = (
    <>
            <Button asChild variant="outline">
              <Link href={`/payments?year=${year}&month=${month}`}>
                <Wallet className="size-4" />
                {t("roster.action.payments")}
              </Link>
            </Button>
            <AddStudentsDialog
              year={year}
              month={month}
              monthName={monthName}
              candidates={candidates}
            />
          </>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("roster.title")}
        description={
          roster.students.length === 1
            ? t("roster.desc.one", { month: monthName })
            : t("roster.desc", { count: roster.students.length, month: monthName })
        }
      />

      <MonthPicker year={year} month={month} basePath="/roster" />

      {roster.students.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <CalendarRange className="size-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold">{t("roster.empty.title", { month: monthName })}</h3>
          <p className="max-w-md text-sm text-muted-foreground">
            {candidates.length > 0 && roster.left.length === 0
              ? t("roster.empty.noPrevious")
              : t("roster.empty.sub")}
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <CarryOverButton
              year={year}
              month={month}
              fromLabel={prevName}
              label={t("roster.action.carry", { month: prevName })}
            />
            <AddStudentsDialog
              year={year}
              month={month}
              monthName={monthName}
              candidates={candidates}
              variant="outline"
            />
          </div>
        </Card>
      ) : (
        <>
          <SummaryStrip
            actions={pageActions}
            items={[
              {
                label: t("roster.stat.total"),
                value: roster.students.length,
              },
              {
                label: t("roster.stat.new"),
                value: roster.newCount,
              },
              {
                label: t("roster.stat.left", { month: prevName }),
                value: roster.leftCount,
              },
              {
                label: t("roster.stat.collected"),
                value: formatCurrency(collected),
                suffix: t("dashboard.stat.collected.sub", { expected: formatCurrency(due) }),
                progress: due > 0 ? Math.min(100, (collected / due) * 100) : 0,
              },
            ]}
          />

          <RosterTable
            year={year}
            month={month}
            monthName={monthName}
            students={roster.students}
          />

          {roster.left.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold">
                  {t("roster.left.title", { month: prevName })}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("roster.left.sub", { month: prevName })}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {roster.left.map((s) => (
                    <Link
                      key={s.studentId}
                      href={`/students/${s.studentId}`}
                      className="rounded-full bg-sea-100 px-3 py-1 text-sm text-sea-900 transition-colors hover:bg-sea-300/50"
                    >
                      {s.fullName}
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
