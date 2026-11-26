import Link from "next/link";
import { notFound } from "next/navigation";
import { studentsApi } from "@/lib/api/students";
import { settingsApi } from "@/lib/api/settings";
import { attendanceApi } from "@/lib/api/attendance";
import { ApiError } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/app/page-header";
import { SummaryStrip } from "@/components/app/summary-strip";
import { StudentDangerZone } from "@/components/students/student-danger-zone";
import { SiblingsCard } from "@/components/students/siblings-card";
import { PaymentTimeline } from "@/components/payments/payment-timeline";
import {
  birthYear,
  currentYearMonth,
  formatAge,
  formatCurrency,
  formatDate,
  formatDateOnly,
  weekdayShort,
  whatsappReminderUrl,
} from "@/lib/utils";
import { getLocale, getT } from "@/lib/i18n/server";
import { monthLabelI18n } from "@/lib/i18n";
import { Pencil, MessageCircle } from "lucide-react";

type Params = Promise<{ id: string }>;
type Translator = Awaited<ReturnType<typeof getT>>;

/**
 * The backend writes `pricingNote` in English ("First month: 55 × 4/8
 * sessions" / "Manual first-month amount"); show the known shapes in the
 * viewer's language and anything else as-is.
 */
function localizePricingNote(note: string | null, t: Translator): string | null {
  if (!note) return null;
  const m = /^First month: ([\d.]+) × (\d+)\/(\d+) sessions$/.exec(note.trim());
  if (m) {
    return t("students.payment.note.prorated", {
      fee: formatCurrency(Number(m[1])),
      remaining: m[2],
      total: m[3],
    });
  }
  if (note.trim() === "Manual first-month amount") return t("students.payment.note.manual");
  return note;
}

export default async function StudentDetailPage({ params }: { params: Params }) {
  const { id } = await params;

  let student;
  try {
    student = await studentsApi.get(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const ym = currentYearMonth();
  const [settings, suggestions, attendance, t, locale] = await Promise.all([
    settingsApi.get().catch(() => null),
    // Same parent phone, not linked yet — offered first in "Link sibling".
    studentsApi.siblingSuggestions(id).catch(() => []),
    attendanceApi.studentMonth(id, ym.year, ym.month).catch(() => null),
    getT(),
    getLocale(),
  ]);

  // Effective fee: override > group fee > default fee.
  const effectiveFee =
    student.monthlyFee ?? student.group?.monthlyFee ?? settings?.defaultFee ?? 0;
  const feeSource = student.monthlyFee != null
    ? t("students.detail.fee.custom")
    : student.group
      ? t("students.detail.fee.group", { group: student.group.name })
      : t("students.detail.fee.default");

  // Every invoice with money still owed, oldest first.
  const owed = student.payments
    .filter((p) => p.status !== "PAID" && p.amount - p.paidAmount > 0)
    .sort((a, b) => a.year - b.year || a.month - b.month);
  const totalDue = owed.reduce((sum, p) => sum + p.amount - p.paidAmount, 0);
  const totalPaid = student.payments.reduce((sum, p) => sum + p.paidAmount, 0);

  // The reminder asks for the whole balance and names every month it covers,
  // so the amount and the month(s) in the message always describe the same debt.
  const reminderUrl =
    student.phoneNumber && owed.length > 0 && settings
      ? whatsappReminderUrl({
          phoneNumber: student.phoneNumber,
          studentName: student.fullName,
          amount: totalDue,
          month: owed[0].month,
          year: owed[0].year,
          months: owed.map((p) => ({ month: p.month, year: p.year })),
          academyName: settings.academyName,
          countryCode: settings.whatsappCountry,
          template: settings.whatsappTemplate,
        })
      : null;
  const reminderHint = t("students.detail.whatsapp.hint", {
    amount: formatCurrency(totalDue),
    months: owed
      .map((p) => monthLabelI18n(locale, p.month, p.year))
      .join(locale === "ar" ? "، " : ", "),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        showTitle
        title={student.fullName}
        description={formatAge(student.dateOfBirth, locale)}
        backHref="/students"
        backLabel={t("students.back")}
        actions={
          <>
            {reminderUrl && (
              <Button asChild variant="outline">
                <a
                  href={reminderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={reminderHint}
                >
                  <MessageCircle className="size-4" />
                  {t("students.detail.whatsapp")}
                </a>
              </Button>
            )}
            <Button asChild>
              <Link href={`/students/${student.id}/edit`}>
                <Pencil className="size-4" />
                {t("common.edit")}
              </Link>
            </Button>
          </>
        }
      />

      <SummaryStrip
        items={[
          {
            label: t("students.detail.totalPaid"),
            value: formatCurrency(totalPaid),
          },
          {
            label: t("students.detail.totalDue"),
            value: formatCurrency(totalDue),
            tone: totalDue > 0 ? "alert" : "default",
          },
          {
            label: t("students.detail.paymentsCount"),
            value: student.payments.length,
          },
        ]}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("students.detail.profile")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
          {student.archived && (
            <Field
              label={t("table.status")}
              value={
                <span className="inline-flex flex-wrap items-center gap-2">
                  <Badge variant="soft">{t("students.badge.left")}</Badge>
                  {student.archivedAt && (
                    <span className="text-xs text-muted-foreground">
                      {t("students.detail.leftSince", {
                        date: formatDate(student.archivedAt, locale),
                      })}
                    </span>
                  )}
                </span>
              }
            />
          )}
          <Field label={t("studentForm.birthYear")} value={birthYear(student.dateOfBirth) || "—"} />
          <Field
            label={t("studentForm.phone")}
            value={student.phoneNumber ? <span dir="ltr">{student.phoneNumber}</span> : "—"}
          />
          <Field
            label={t("studentForm.group")}
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
            label={t("students.detail.startedTraining")}
            value={
              student.trainingStartDate ? formatDateOnly(student.trainingStartDate, locale) : "—"
            }
          />
          <Field label={t("studentForm.school")} value={student.school || "—"} />
          <Field label={t("studentForm.address")} value={student.address || "—"} />
          <Field
            label={t("students.detail.fee")}
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
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t("studentForm.notes")}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{student.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <SiblingsCard
        studentId={student.id}
        studentName={student.fullName}
        siblings={student.siblings ?? []}
        suggestions={suggestions}
      />

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0">
          <CardTitle className="text-base">
            {t("students.attendance.title")}
            <span className="ms-2 text-sm font-normal text-muted-foreground">
              {monthLabelI18n(locale, ym.month, ym.year)}
            </span>
          </CardTitle>
          {attendance && attendance.totalCount > 0 && (
            <Badge variant="soft" className="tabular-nums">
              {t("students.attendance.count", {
                present: attendance.presentCount,
                total: attendance.totalCount,
              })}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {!attendance ? (
            <p className="text-sm text-muted-foreground">{t("students.attendance.error")}</p>
          ) : attendance.sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("students.attendance.empty")}</p>
          ) : (
            <ul className="divide-y divide-border">
              {attendance.sessions.map((s) => (
                <li
                  key={s.sessionId}
                  className="flex items-center justify-between gap-3 py-2 text-sm first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium tabular-nums">
                      {weekdayShort(s.date, locale)} · {formatDateOnly(s.date, locale)}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{s.group.name}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    {s.isGuest && (
                      <Badge
                        variant="outline"
                        title={t("students.attendance.guest.title", { group: s.group.name })}
                      >
                        {t("students.attendance.guest")}
                      </Badge>
                    )}
                    <Badge variant={s.present ? "success" : "alert"}>
                      {s.present ? t("students.attendance.present") : t("students.attendance.absent")}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("students.detail.history")}</CardTitle>
        </CardHeader>
        <CardContent>
          {student.payments.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("students.detail.noPayments")}</p>
          ) : (
            <PaymentTimeline
              payments={student.payments.map((p) => ({
                id: p.id,
                month: p.month,
                year: p.year,
                amount: p.amount,
                paidAmount: p.paidAmount,
                discount: p.discount,
                status: p.status,
                paymentMethod: p.paymentMethod,
                paymentDate: p.paymentDate,
                notes: p.notes,
                locked: p.locked,
                pricingNote: localizePricingNote(p.pricingNote, t),
                label: monthLabelI18n(locale, p.month, p.year),
              }))}
            />
          )}
        </CardContent>
      </Card>

      <StudentDangerZone studentId={student.id} fullName={student.fullName} />
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
