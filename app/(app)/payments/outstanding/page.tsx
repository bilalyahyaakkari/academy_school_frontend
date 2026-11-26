import { Fragment } from "react";
import Link from "next/link";
import { paymentsApi } from "@/lib/api/payments";
import { settingsApi } from "@/lib/api/settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { SummaryStrip } from "@/components/app/summary-strip";
import { formatCurrency, whatsappReminderUrl } from "@/lib/utils";
import { getT, getLocale } from "@/lib/i18n/server";
import { monthLabelI18n } from "@/lib/i18n";
import { MessageCircle, AlertCircle, Users } from "lucide-react";

export async function generateMetadata() {
  const t = await getT();
  return { title: `${t("payments.outstanding.title")} — Academy` };
}

type OutstandingRow = Awaited<ReturnType<typeof paymentsApi.outstanding>>[number];

/** A student on their own, or siblings (same familyId) who all owe money. */
type Entry =
  | { kind: "single"; row: OutstandingRow }
  | { kind: "family"; familyId: string; members: OutstandingRow[]; total: number };

/** Groups siblings into one entry, placed where the first of them appears. */
function groupFamilies(rows: OutstandingRow[]): Entry[] {
  const byFamily = new Map<string, OutstandingRow[]>();
  for (const r of rows) {
    if (!r.familyId) continue;
    const list = byFamily.get(r.familyId) ?? [];
    list.push(r);
    byFamily.set(r.familyId, list);
  }
  const entries: Entry[] = [];
  const placed = new Set<string>();
  for (const r of rows) {
    const members = r.familyId ? byFamily.get(r.familyId) : undefined;
    if (!r.familyId || !members || members.length < 2) {
      entries.push({ kind: "single", row: r });
      continue;
    }
    if (placed.has(r.familyId)) continue;
    placed.add(r.familyId);
    entries.push({
      kind: "family",
      familyId: r.familyId,
      members,
      total: members.reduce((sum, m) => sum + m.unpaidAmount, 0),
    });
  }
  return entries;
}

/** Every month any of them owes, once each, oldest first. */
function unionMonths(members: OutstandingRow[]): { month: number; year: number }[] {
  const seen = new Map<number, { month: number; year: number }>();
  for (const m of members) {
    for (const mo of m.months) seen.set(mo.year * 12 + mo.month, { month: mo.month, year: mo.year });
  }
  return [...seen.entries()].sort((a, b) => a[0] - b[0]).map(([, v]) => v);
}

export default async function OutstandingPage() {
  const t = await getT();
  const locale = await getLocale();
  const [rows, settings] = await Promise.all([
    paymentsApi.outstanding(),
    settingsApi.get().catch(() => null),
  ]);

  const totalOutstanding = rows.reduce((sum, r) => sum + r.unpaidAmount, 0);
  const totalStudents = rows.length;
  const entries = groupFamilies(rows);

  // The message names every owed month and asks for their combined balance,
  // so the months and the amount always describe the same debt.
  const reminderUrlFor = (r: OutstandingRow) =>
    r.phoneNumber && settings
      ? whatsappReminderUrl({
          phoneNumber: r.phoneNumber,
          studentName: r.fullName,
          amount: r.unpaidAmount,
          month: r.oldestUnpaid.month,
          year: r.oldestUnpaid.year,
          months: r.months,
          academyName: settings.academyName,
          countryCode: settings.whatsappCountry,
          template: settings.whatsappTemplate,
        })
      : null;

  // One reminder per family: every child's name, the family total, and the
  // union of their owed months — sent to the first phone number on file.
  const familyReminderUrl = (members: OutstandingRow[], total: number) => {
    const phoneNumber = members.find((m) => m.phoneNumber)?.phoneNumber;
    const months = unionMonths(members);
    if (!phoneNumber || !settings || months.length === 0) return null;
    return whatsappReminderUrl({
      phoneNumber,
      studentName: members.map((m) => m.fullName.trim()).join(" و "),
      amount: total,
      month: months[0].month,
      year: months[0].year,
      months,
      academyName: settings.academyName,
      countryCode: settings.whatsappCountry,
      template: settings.whatsappTemplate,
    });
  };

  /** Every owed month, for the tooltip on the unpaid-count badge. */
  const owedMonths = (r: OutstandingRow) =>
    r.months
      .map((m) => `${monthLabelI18n(locale, m.month, m.year)}: ${formatCurrency(m.due)}`)
      .join("\n");

  const leftBadge = (
    <Badge variant="soft" className="ms-2">
      {t("roster.badge.left")}
    </Badge>
  );

  const remindButton = (url: string | null) =>
    url ? (
      <Button asChild size="sm" variant="outline">
        <a href={url} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="size-4" />
          {t("payments.outstanding.remind")}
        </a>
      </Button>
    ) : (
      <span className="text-xs text-muted-foreground">
        {t("payments.outstanding.noPhone")}
      </span>
    );

  /** One student's table row; inside a family block there's no own reminder. */
  const desktopRow = (r: OutstandingRow, withRemind: boolean) => (
    <TableRow key={r.studentId}>
      <TableCell
        className={withRemind ? "font-medium" : "border-s-2 border-s-sea-300 ps-6 font-medium"}
      >
        <Link href={`/students/${r.studentId}`} className="hover:underline">
          {r.fullName}
        </Link>
        {r.archived && leftBadge}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">{r.group?.name ?? "—"}</TableCell>
      <TableCell className="text-center">
        <Badge variant={r.unpaidCount >= 3 ? "destructive" : "warning"} title={owedMonths(r)}>
          {r.unpaidCount}
        </Badge>
      </TableCell>
      <TableCell className="text-sm">
        {monthLabelI18n(locale, r.oldestUnpaid.month, r.oldestUnpaid.year)}
      </TableCell>
      <TableCell className="text-end font-semibold">{formatCurrency(r.unpaidAmount)}</TableCell>
      <TableCell className="text-end">
        {withRemind ? remindButton(reminderUrlFor(r)) : null}
      </TableCell>
    </TableRow>
  );

  /** Name, group, oldest month and count — plus the amount when in a family. */
  const mobileStudent = (r: OutstandingRow, withAmount = false) => (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="flex items-center">
          <Link href={`/students/${r.studentId}`} className="truncate font-semibold hover:underline">
            {r.fullName}
          </Link>
          {r.archived && leftBadge}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {r.group?.name ?? "—"} •{" "}
          {t("payments.outstanding.oldestShort", {
            month: monthLabelI18n(locale, r.oldestUnpaid.month, r.oldestUnpaid.year),
          })}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {withAmount && (
          <span className="text-sm font-semibold">{formatCurrency(r.unpaidAmount)}</span>
        )}
        <Badge variant={r.unpaidCount >= 3 ? "destructive" : "warning"} title={owedMonths(r)}>
          {r.unpaidCount}
        </Badge>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("payments.outstanding.title")}
        description={t("payments.outstanding.desc")}
        backHref="/payments"
        backLabel={t("payments.back")}
      />

      <SummaryStrip
        items={[
          {
            label: t("payments.outstanding.totalOwed"),
            value: formatCurrency(totalOutstanding),
            tone: totalOutstanding > 0 ? "alert" : "default",
          },
          { label: t("payments.outstanding.students"), value: totalStudents },
        ]}
      />

      {rows.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
            <AlertCircle className="size-8 text-muted-foreground" />
            <p className="font-medium">{t("payments.outstanding.empty.title")}</p>
            <p className="text-sm text-muted-foreground">
              {t("payments.outstanding.empty.sub")}
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* ===== Desktop / tablet: table ===== */}
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.student")}</TableHead>
                  <TableHead>{t("table.group")}</TableHead>
                  <TableHead className="text-center">
                    {t("payments.outstanding.monthsUnpaid")}
                  </TableHead>
                  <TableHead>{t("payments.outstanding.oldest")}</TableHead>
                  <TableHead className="text-end">
                    {t("payments.outstanding.totalOwed")}
                  </TableHead>
                  <TableHead className="text-end">{t("table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) =>
                  e.kind === "single" ? (
                    desktopRow(e.row, true)
                  ) : (
                    <Fragment key={`family-${e.familyId}`}>
                      <TableRow className="bg-sea-100/50 hover:bg-sea-100/50">
                        <TableCell colSpan={4} className="border-s-2 border-s-sea-700">
                          <span className="inline-flex items-center gap-2 text-sm font-medium text-sea-900">
                            <Users className="size-4" aria-hidden />
                            {t("payments.family.label", { count: e.members.length })}
                          </span>
                        </TableCell>
                        <TableCell className="text-end">
                          <span className="block text-[11px] text-muted-foreground">
                            {t("payments.family.total")}
                          </span>
                          <span className="font-semibold text-destructive">
                            {formatCurrency(e.total)}
                          </span>
                        </TableCell>
                        <TableCell className="text-end">
                          {remindButton(familyReminderUrl(e.members, e.total))}
                        </TableCell>
                      </TableRow>
                      {e.members.map((m) => desktopRow(m, false))}
                    </Fragment>
                  ),
                )}
              </TableBody>
            </Table>
          </Card>

          {/* ===== Mobile: card layout ===== */}
          <ul className="space-y-2 md:hidden">
            {entries.map((e) =>
              e.kind === "single" ? (
                <li
                  key={e.row.studentId}
                  className="rounded-xl border border-border bg-card p-3 shadow-sm"
                >
                  {mobileStudent(e.row)}
                  <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-2">
                    <span className="text-base font-bold text-destructive">
                      {formatCurrency(e.row.unpaidAmount)}
                    </span>
                    {remindButton(reminderUrlFor(e.row))}
                  </div>
                </li>
              ) : (
                <li
                  key={`family-${e.familyId}`}
                  className="rounded-xl border border-border border-s-2 border-s-sea-700 bg-card p-3 shadow-sm"
                >
                  <p className="mb-2 inline-flex items-center gap-2 text-xs font-medium text-sea-900">
                    <Users className="size-3.5" aria-hidden />
                    {t("payments.family.label", { count: e.members.length })}
                  </p>
                  <ul className="divide-y divide-border">
                    {e.members.map((m) => (
                      <li key={m.studentId} className="py-2 first:pt-0">
                        {mobileStudent(m, true)}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-1 flex items-center justify-between gap-2 border-t border-border pt-2">
                    <div>
                      <p className="text-[11px] text-muted-foreground">
                        {t("payments.family.total")}
                      </p>
                      <p className="text-base font-bold text-destructive">
                        {formatCurrency(e.total)}
                      </p>
                    </div>
                    {remindButton(familyReminderUrl(e.members, e.total))}
                  </div>
                </li>
              ),
            )}
          </ul>
        </>
      )}
    </div>
  );
}
