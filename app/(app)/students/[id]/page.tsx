import Link from "next/link";
import { notFound } from "next/navigation";
import { studentsApi } from "@/lib/api/students";
import { settingsApi } from "@/lib/api/settings";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/app/page-header";
import { StudentDangerZone } from "@/components/students/student-danger-zone";
import { PaymentTimeline } from "@/components/payments/payment-timeline";
import {
  formatAge,
  formatCurrency,
  formatDate,
  monthLabel,
  whatsappReminderUrl,
} from "@/lib/utils";
import { Pencil, MessageCircle } from "lucide-react";

type Params = Promise<{ id: string }>;

export default async function StudentDetailPage({ params }: { params: Params }) {
  const { id } = await params;

  let student;
  try {
    student = await studentsApi.get(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const settings = await settingsApi.get().catch(() => null);

  // Effective fee: override > group fee > default fee.
  const effectiveFee =
    student.monthlyFee ?? student.group?.monthlyFee ?? settings?.defaultFee ?? 0;
  const feeSource = student.monthlyFee != null
    ? "custom override"
    : student.group
      ? `from ${student.group.name}`
      : "default fee";

  const totalDue = student.payments
    .filter((p) => p.status !== "PAID")
    .reduce((sum, p) => sum + p.amount - p.paidAmount, 0);
  const totalPaid = student.payments.reduce((sum, p) => sum + p.paidAmount, 0);

  // Pick the oldest unpaid month for the WhatsApp reminder.
  const oldestUnpaid = [...student.payments].reverse().find((p) => p.status !== "PAID");
  const reminderUrl =
    student.phoneNumber && oldestUnpaid && settings
      ? whatsappReminderUrl({
          phoneNumber: student.phoneNumber,
          studentName: student.fullName,
          amount: oldestUnpaid.amount - oldestUnpaid.paidAmount,
          month: oldestUnpaid.month,
          year: oldestUnpaid.year,
          academyName: settings.academyName,
          countryCode: settings.whatsappCountry,
          template: settings.whatsappTemplate,
        })
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={student.fullName}
        description={formatAge(student.dateOfBirth)}
        backHref="/students"
        backLabel="Back to students"
        actions={
          <>
            {reminderUrl && (
              <Button asChild variant="outline">
                <a href={reminderUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-4" />
                  WhatsApp reminder
                </a>
              </Button>
            )}
            <Button asChild>
              <Link href={`/students/${student.id}/edit`}>
                <Pencil className="size-4" />
                Edit
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
            <Field label="Year of birth" value={new Date(student.dateOfBirth).getFullYear()} />
            <Field label="Parent phone" value={student.phoneNumber ?? "—"} />
            <Field
              label="Group"
              value={
                student.group ? (
                  <Link href={`/groups/${student.group.id}`} className="hover:underline">
                    {student.group.name}
                  </Link>
                ) : (
                  "—"
                )
              }
            />
            <Field
              label="Status"
              value={
                student.isActive ? (
                  <Badge variant="success">Active</Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )
              }
            />
            <Field
              label="Monthly fee"
              value={
                <span>
                  {formatCurrency(effectiveFee)}{" "}
                  <span className="text-xs text-muted-foreground">({feeSource})</span>
                </span>
              }
            />
            {student.notes && (
              <div className="sm:col-span-2">
                <Separator className="my-2" />
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Notes</p>
                <p className="mt-1 whitespace-pre-wrap">{student.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-3 pt-6">
              <Stat label="Total paid" value={formatCurrency(totalPaid)} />
              <Stat
                label="Total outstanding"
                value={formatCurrency(totalDue)}
                tone={totalDue > 0 ? "warn" : "ok"}
              />
              <Stat label="Payments on record" value={String(student.payments.length)} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment history</CardTitle>
        </CardHeader>
        <CardContent>
          {student.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No payments yet. Generate monthly invoices from the Payments page.
            </p>
          ) : (
            <PaymentTimeline
              payments={student.payments.map((p) => ({
                id: p.id,
                month: p.month,
                year: p.year,
                amount: p.amount,
                paidAmount: p.paidAmount,
                status: p.status,
                paymentMethod: p.paymentMethod,
                paymentDate: p.paymentDate,
                notes: p.notes,
                label: monthLabel(p.month, p.year),
              }))}
            />
          )}
        </CardContent>
      </Card>

      <StudentDangerZone studentId={student.id} fullName={student.fullName} isActive={student.isActive} />
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1">{value}</div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <div className="flex items-baseline justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={
          tone === "warn"
            ? "font-semibold text-destructive"
            : tone === "ok"
              ? "font-semibold text-success"
              : "font-semibold"
        }
      >
        {value}
      </span>
    </div>
  );
}
