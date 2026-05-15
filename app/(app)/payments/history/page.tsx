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

      <Card>
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
    </div>
  );
}
