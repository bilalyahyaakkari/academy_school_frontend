import Link from "next/link";
import { paymentsApi } from "@/lib/api/payments";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { PaymentsTable } from "@/components/payments/payments-table";
import { MonthPicker } from "@/components/payments/month-picker";
import { GenerateInvoicesButton } from "@/components/payments/generate-invoices-button";
import { formatCurrency, cn } from "@/lib/utils";
import { getT, getLocale } from "@/lib/i18n/server";
import { monthLabelI18n } from "@/lib/i18n";
import {
  AlertCircle,
  CircleDollarSign,
  CheckCircle2,
  TrendingDown,
} from "lucide-react";

export const metadata = { title: "Payments — Academy" };

type SearchParams = Promise<{ year?: string; month?: string }>;

type Tone = "blue" | "green" | "rose";

const TONES: Record<
  Tone,
  { bar: string; blob: string; iconBg: string; valueText: string; drift: string }
> = {
  blue: {
    bar: "from-blue-500 via-blue-500 to-cyan-400",
    blob: "bg-blue-400/40",
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-600 text-white",
    valueText: "",
    drift: "animate-drift-1",
  },
  green: {
    bar: "from-emerald-500 via-emerald-500 to-teal-400",
    blob: "bg-emerald-400/40",
    iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white",
    valueText: "text-emerald-600 dark:text-emerald-400",
    drift: "animate-drift-2",
  },
  rose: {
    bar: "from-rose-500 via-pink-500 to-rose-400",
    blob: "bg-rose-400/40",
    iconBg: "bg-gradient-to-br from-rose-500 to-rose-600 text-white",
    valueText: "text-rose-600 dark:text-rose-400",
    drift: "animate-drift-3",
  },
};

export default async function PaymentsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const now = new Date();
  const year = sp.year ? Number(sp.year) : now.getFullYear();
  const month = sp.month ? Number(sp.month) : now.getMonth() + 1;

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

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("payments.title")}
        description={t("payments.desc", {
          month: monthLabelI18n(locale, month, year),
          count: students.length,
        })}
        actions={
          <>
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
        }
      />

      <MonthPicker year={year} month={month} />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label={t("payments.stat.expected")}
          value={formatCurrency(totalDue)}
          icon={<CircleDollarSign className="size-5" />}
          tone="blue"
        />
        <Stat
          label={t("payments.stat.collected")}
          value={formatCurrency(totalCollected)}
          sub={
            totalDue > 0
              ? t("payments.stat.collected.sub", {
                  percent: Math.round((totalCollected / totalDue) * 100),
                })
              : undefined
          }
          icon={<CheckCircle2 className="size-5" />}
          tone="green"
        />
        <Stat
          label={t("payments.stat.outstanding")}
          value={formatCurrency(outstanding)}
          sub={
            missingInvoices === 1
              ? t("payments.stat.outstanding.sub", {
                  unpaid: unpaidCount,
                  missing: missingInvoices,
                })
              : t("payments.stat.outstanding.sub.plural", {
                  unpaid: unpaidCount,
                  missing: missingInvoices,
                })
          }
          icon={<TrendingDown className="size-5" />}
          tone={outstanding > 0 ? "rose" : "green"}
        />
      </div>

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
                paidAmount: s.payments[0].paidAmount,
                status: s.payments[0].status,
                paymentMethod: s.payments[0].paymentMethod,
                paymentDate: s.payments[0].paymentDate,
                notes: s.payments[0].notes,
              }
            : null,
        }))}
        year={year}
        month={month}
      />
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  icon,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  tone: Tone;
}) {
  const t = TONES[tone];
  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <span
        aria-hidden
        className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", t.bar)}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-12 -top-12 size-40 rounded-full blur-3xl",
          t.blob,
          t.drift,
        )}
      />
      <CardContent className="relative pt-7">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {label}
            </p>
            <p
              className={cn(
                "mt-2 text-3xl font-bold tracking-tight",
                t.valueText,
              )}
            >
              {value}
            </p>
            {sub && (
              <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
            )}
          </div>
          <div
            className={cn(
              "grid size-12 shrink-0 place-items-center rounded-xl shadow-md transition-transform group-hover:scale-110",
              t.iconBg,
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
