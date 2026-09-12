import Link from "next/link";
import { rosterApi } from "@/lib/api/roster";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { MonthPicker } from "@/components/payments/month-picker";
import { RosterTable } from "@/components/roster/roster-table";
import { AddStudentsDialog } from "@/components/roster/add-students-dialog";
import { CarryOverButton } from "@/components/roster/carry-over-button";
import { formatCurrency, cn } from "@/lib/utils";
import { getT, getLocale } from "@/lib/i18n/server";
import { monthLabelI18n } from "@/lib/i18n";
import { CalendarRange, UserPlus, UserMinus, CircleDollarSign, Wallet } from "lucide-react";

export const metadata = { title: "Monthly roster — Academy" };

type SearchParams = Promise<{ year?: string; month?: string }>;

type Tone = "blue" | "green" | "amber" | "rose";

const TONES: Record<Tone, { bar: string; blob: string; iconBg: string; drift: string }> = {
  blue: {
    bar: "from-blue-500 via-blue-500 to-cyan-400",
    blob: "bg-blue-400/40",
    iconBg: "bg-gradient-to-br from-blue-500 to-blue-600 text-white",
    drift: "animate-drift-1",
  },
  green: {
    bar: "from-emerald-500 via-emerald-500 to-teal-400",
    blob: "bg-emerald-400/40",
    iconBg: "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white",
    drift: "animate-drift-2",
  },
  amber: {
    bar: "from-amber-500 via-orange-500 to-red-500",
    blob: "bg-orange-400/40",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-600 text-white",
    drift: "animate-drift-3",
  },
  rose: {
    bar: "from-rose-500 via-pink-500 to-rose-400",
    blob: "bg-rose-400/40",
    iconBg: "bg-gradient-to-br from-rose-500 to-rose-600 text-white",
    drift: "animate-drift-1",
  },
};

export default async function RosterPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const now = new Date();
  const year = sp.year ? Number(sp.year) : now.getFullYear();
  const month = sp.month ? Number(sp.month) : now.getMonth() + 1;

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

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("roster.title")}
        description={
          roster.students.length === 1
            ? t("roster.desc.one", { month: monthName })
            : t("roster.desc", { count: roster.students.length, month: monthName })
        }
        actions={
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label={t("roster.stat.total")}
              value={String(roster.students.length)}
              icon={<CalendarRange className="size-5" />}
              tone="blue"
            />
            <Stat
              label={t("roster.stat.new")}
              value={String(roster.newCount)}
              icon={<UserPlus className="size-5" />}
              tone="green"
            />
            <Stat
              label={t("roster.stat.left", { month: prevName })}
              value={String(roster.leftCount)}
              icon={<UserMinus className="size-5" />}
              tone={roster.leftCount > 0 ? "amber" : "green"}
            />
            <Stat
              label={t("roster.stat.collected")}
              value={formatCurrency(collected)}
              sub={formatCurrency(due)}
              icon={<CircleDollarSign className="size-5" />}
              tone="rose"
            />
          </div>

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
                      className="rounded-full bg-muted px-3 py-1 text-sm transition-colors hover:bg-muted/70"
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
  const s = TONES[tone];
  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <span aria-hidden className={cn("absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r", s.bar)} />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-12 -top-12 size-40 rounded-full blur-3xl",
          s.blob,
          s.drift,
        )}
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
            className={cn(
              "grid size-12 shrink-0 place-items-center rounded-xl shadow-md transition-transform group-hover:scale-110",
              s.iconBg,
            )}
          >
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
