import Link from "next/link";
import { paymentsApi } from "@/lib/api/payments";
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
import { formatCurrency, formatDate, monthLabel } from "@/lib/utils";

export const metadata = { title: "Payment history — Academy" };

type SearchParams = Promise<{ from?: string; to?: string; status?: string }>;

export default async function PaymentHistoryPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const payments = await paymentsApi.history({
    from: sp.from,
    to: sp.to,
    status: sp.status,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment history"
        description={`${payments.length} record${payments.length === 1 ? "" : "s"}`}
        backHref="/payments"
        backLabel="Back to payments"
      />

      {/* ===== Desktop / tablet: table ===== */}
      <Card className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Period</TableHead>
              <TableHead className="text-end">Amount</TableHead>
              <TableHead className="text-end">Paid</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                  No payments yet.
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
                  <TableCell>{monthLabel(p.month, p.year)}</TableCell>
                  <TableCell className="text-end">{formatCurrency(p.amount)}</TableCell>
                  <TableCell className="text-end">{formatCurrency(p.paidAmount)}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {p.paymentMethod ? p.paymentMethod.toLowerCase().replace("_", " ") : "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(p.paymentDate)}
                  </TableCell>
                  <TableCell>
                    {p.status === "PAID" ? (
                      <Badge variant="success">Paid</Badge>
                    ) : p.status === "PARTIAL" ? (
                      <Badge variant="warning">Partial</Badge>
                    ) : (
                      <Badge variant="secondary">Unpaid</Badge>
                    )}
                  </TableCell>
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
            No payments yet.
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
                      {monthLabel(p.month, p.year)}
                      {p.paymentDate && ` • ${formatDate(p.paymentDate)}`}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {p.status === "PAID" ? (
                      <Badge variant="success">Paid</Badge>
                    ) : p.status === "PARTIAL" ? (
                      <Badge variant="warning">Partial</Badge>
                    ) : (
                      <Badge variant="secondary">Unpaid</Badge>
                    )}
                  </div>
                </div>
                <div className="mt-2 flex items-baseline justify-between border-t border-border pt-2 text-sm">
                  <span className="font-semibold text-foreground">
                    {formatCurrency(p.paidAmount)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    / {formatCurrency(p.amount)}
                    {p.paymentMethod &&
                      ` • ${p.paymentMethod.toLowerCase().replace("_", " ")}`}
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
