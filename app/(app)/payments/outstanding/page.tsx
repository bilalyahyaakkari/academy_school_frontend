import Link from "next/link";
import { paymentsApi } from "@/lib/api/payments";
import { settingsApi } from "@/lib/api/settings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/app/page-header";
import { formatCurrency, monthLabel, whatsappReminderUrl } from "@/lib/utils";
import { MessageCircle, AlertCircle } from "lucide-react";

export const metadata = { title: "Outstanding payments — Academy" };

export default async function OutstandingPage() {
  const [rows, settings] = await Promise.all([
    paymentsApi.outstanding(),
    settingsApi.get().catch(() => null),
  ]);

  const totalOutstanding = rows.reduce((sum, r) => sum + r.unpaidAmount, 0);
  const totalStudents = rows.length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Outstanding payments"
        description="Students with at least one unpaid invoice — across all months."
        backHref="/payments"
        backLabel="Back to payments"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Total owed
            </p>
            <p className="mt-1 text-2xl font-semibold text-destructive">
              {formatCurrency(totalOutstanding)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Students with balance
            </p>
            <p className="mt-1 text-2xl font-semibold">{totalStudents}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
            <AlertCircle className="size-8 text-muted-foreground" />
            <p className="font-medium">Nothing outstanding</p>
            <p className="text-sm text-muted-foreground">All invoices are paid.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Group</TableHead>
                <TableHead className="text-center">Months unpaid</TableHead>
                <TableHead>Oldest unpaid</TableHead>
                <TableHead className="text-end">Total owed</TableHead>
                <TableHead className="text-end">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const reminderUrl =
                  r.phoneNumber && settings
                    ? whatsappReminderUrl({
                        phoneNumber: r.phoneNumber,
                        studentName: r.fullName,
                        amount: r.unpaidAmount,
                        month: r.oldestUnpaid.month,
                        year: r.oldestUnpaid.year,
                        academyName: settings.academyName,
                        countryCode: settings.whatsappCountry,
                        template: settings.whatsappTemplate,
                      })
                    : null;
                return (
                  <TableRow key={r.studentId}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/students/${r.studentId}`}
                        className="hover:underline"
                      >
                        {r.fullName}
                      </Link>
                      {!r.isActive && (
                        <Badge variant="secondary" className="ms-2">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.group?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={r.unpaidCount >= 3 ? "destructive" : "warning"}
                      >
                        {r.unpaidCount}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {monthLabel(r.oldestUnpaid.month, r.oldestUnpaid.year)}
                    </TableCell>
                    <TableCell className="text-end font-semibold">
                      {formatCurrency(r.unpaidAmount)}
                    </TableCell>
                    <TableCell className="text-end">
                      {reminderUrl ? (
                        <Button asChild size="sm" variant="outline">
                          <a
                            href={reminderUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle className="size-4" />
                            Remind
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          no phone
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
