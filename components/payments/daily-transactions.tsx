"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { ACADEMY_TZ, cn, formatCurrency, intlLocale } from "@/lib/utils";
import { useLocale, useT } from "@/lib/i18n/client";
import { monthLabelI18n } from "@/lib/i18n";
import type { LedgerTransaction } from "@/lib/api/types";

/** One day's money in and out: desktop table + mobile cards. */
export function DailyTransactions({ transactions }: { transactions: LedgerTransaction[] }) {
  const t = useT();
  const locale = useLocale();

  // Fixed timezone + locale, so the server and browser renders match.
  const timeFmt = new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: ACADEMY_TZ,
    hour: "2-digit",
    minute: "2-digit",
  });
  const time = (tx: LedgerTransaction) => timeFmt.format(new Date(tx.createdAt));

  const what = (tx: LedgerTransaction) => {
    if (tx.payment) {
      return t("payments.daily.fee", {
        month: monthLabelI18n(locale, tx.payment.month, tx.payment.year),
      });
    }
    if (tx.uniform?.size) return t("payments.daily.uniform", { size: tx.uniform.size });
    return t("payments.daily.uniformNoSize");
  };

  // Negative = an undo / correction: red, with its note.
  const amount = (tx: LedgerTransaction) => (
    <div className="text-end">
      <p className={cn("font-semibold tabular-nums", tx.amount < 0 && "text-alert")}>
        {formatCurrency(tx.amount)}
      </p>
      {tx.amount < 0 && (
        <p className="text-[11px] text-alert">{tx.note || t("payments.daily.correction")}</p>
      )}
      {tx.amount >= 0 && tx.note && (
        <p className="text-[11px] text-muted-foreground">{tx.note}</p>
      )}
    </div>
  );

  return (
    <>
      {/* ===== Desktop / tablet: table ===== */}
      <Card className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">{t("payments.daily.col.time")}</TableHead>
              <TableHead>{t("table.student")}</TableHead>
              <TableHead>{t("payments.daily.col.what")}</TableHead>
              <TableHead>{t("payments.table.method")}</TableHead>
              <TableHead className="text-end">{t("table.amount")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="text-sm tabular-nums text-muted-foreground">
                  {time(tx)}
                </TableCell>
                <TableCell className="font-medium">
                  <Link href={`/students/${tx.student.id}`} className="hover:underline">
                    {tx.student.fullName}
                  </Link>
                </TableCell>
                <TableCell className="text-sm">{what(tx)}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {t(`payments.method.${tx.method}`)}
                </TableCell>
                <TableCell>{amount(tx)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* ===== Mobile: card layout ===== */}
      <ul className="space-y-2 md:hidden">
        {transactions.map((tx) => (
          <li key={tx.id} className="rounded-xl border border-border bg-card p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <Link
                  href={`/students/${tx.student.id}`}
                  className="block truncate font-semibold hover:underline"
                >
                  {tx.student.fullName}
                </Link>
                <p className="mt-0.5 text-xs text-muted-foreground">{what(tx)}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  <span className="tabular-nums">{time(tx)}</span>
                  {" · "}
                  {t(`payments.method.${tx.method}`)}
                </p>
              </div>
              <div className="shrink-0">{amount(tx)}</div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
