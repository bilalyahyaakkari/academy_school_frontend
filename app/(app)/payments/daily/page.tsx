import { reportsApi } from "@/lib/api/reports";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { SummaryStrip } from "@/components/app/summary-strip";
import { DayPicker } from "@/components/payments/day-picker";
import { DailyTransactions } from "@/components/payments/daily-transactions";
import { formatCurrency, formatDateOnly, todayIso } from "@/lib/utils";
import { getT, getLocale } from "@/lib/i18n/server";
import { Coins } from "lucide-react";

export async function generateMetadata() {
  const t = await getT();
  return { title: `${t("payments.daily.title")} — Academy` };
}

type SearchParams = Promise<{ date?: string | string[] }>;

/** ?date=YYYY-MM-DD when it's a real calendar day, else today (Beirut). */
function resolveDate(raw: string | string[] | undefined, today: string): string {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return today;
  const [y, m, d] = v.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toISOString().slice(0, 10) === v && y >= 2000 && y <= 2100 ? v : today;
}

export default async function DailyCashPage({ searchParams }: { searchParams: SearchParams }) {
  const today = todayIso();
  const date = resolveDate((await searchParams).date, today);

  const t = await getT();
  const locale = await getLocale();
  const report = await reportsApi.daily({ date });

  const transactions = [...report.transactions].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
  const dateLabel = formatDateOnly(date, locale);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("payments.daily.title")}
        description={dateLabel}
        backHref="/payments"
        backLabel={t("payments.back")}
      />

      <SummaryStrip
        actions={<DayPicker date={date} today={today} />}
        items={[
          {
            label: t("payments.daily.total"),
            value: formatCurrency(report.total),
            sub:
              report.count === 1
                ? t("payments.daily.count.one")
                : t("payments.daily.count", { count: report.count }),
            tone: report.total < 0 ? "alert" : "default",
          },
          {
            label: t("payments.method.CASH"),
            value: formatCurrency(report.byMethod.CASH),
            tone: report.byMethod.CASH < 0 ? "alert" : "default",
          },
          {
            label: t("payments.method.BANK_TRANSFER"),
            value: formatCurrency(report.byMethod.BANK_TRANSFER),
            tone: report.byMethod.BANK_TRANSFER < 0 ? "alert" : "default",
          },
          {
            label: t("payments.method.OTHER"),
            value: formatCurrency(report.byMethod.OTHER),
            tone: report.byMethod.OTHER < 0 ? "alert" : "default",
          },
        ]}
        footer={
          <p className="text-xs text-muted-foreground">
            {t("payments.daily.footer", {
              fees: formatCurrency(report.byKind.FEE),
              uniforms: formatCurrency(report.byKind.UNIFORM),
            })}
          </p>
        }
      />

      {transactions.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
          <Coins className="size-6 text-muted-foreground" aria-hidden />
          <h2 className="font-medium">{t("payments.daily.empty.title", { date: dateLabel })}</h2>
          <p className="text-sm text-muted-foreground">{t("payments.daily.empty.sub")}</p>
        </Card>
      ) : (
        <DailyTransactions transactions={transactions} />
      )}
    </div>
  );
}
