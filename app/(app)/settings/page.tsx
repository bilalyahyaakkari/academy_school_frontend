import { settingsApi } from "@/lib/api/settings";
import { studentsApi } from "@/lib/api/students";
import { groupsApi } from "@/lib/api/groups";
import { paymentsApi } from "@/lib/api/payments";
import { PageHeader } from "@/components/app/page-header";
import { SummaryStrip } from "@/components/app/summary-strip";
import { GeneralSection } from "@/components/settings/general-section";
import { WhatsAppSection } from "@/components/settings/whatsapp-section";
import { ReceiptTemplateSection } from "@/components/settings/receipt-template-section";
import { SiblingDiscountSection } from "@/components/settings/sibling-discount-section";
import { SecuritySection } from "@/components/settings/security-section";
import { formatCurrency, currentYearMonth } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: `${t("settings.title")} — Academy` };
}

export default async function SettingsPage() {
  const { year } = currentYearMonth();
  const t = await getT();
  const [settings, students, groups, stats] = await Promise.all([
    settingsApi.get(),
    // Excludes students who left (archived) by default.
    studentsApi.list({}).catch(() => []),
    groupsApi.list().catch(() => []),
    // Aggregated in the database — the history list is capped, so summing it
    // would undercount.
    paymentsApi.stats(year).catch(() => null),
  ]);

  return (
    <div className="space-y-8">
      <PageHeader title={t("settings.title")} description={t("settings.desc")} />

      <SummaryStrip
        items={[
          {
            label: t("payments.stat.students"),
            value: students.length,
            sub: t("payments.stat.students.sub"),
          },
          {
            label: t("settings.stat.groups"),
            value: groups.length,
          },
          {
            label: t("payments.settings.payments", { year }),
            value: stats ? stats.paymentsCount : "—",
            sub: t("payments.settings.payments.sub"),
          },
          {
            label: t("settings.stat.revenue", { year }),
            value: stats ? formatCurrency(stats.revenue) : "—",
          },
        ]}
      />

      {/* Sectioned settings */}
      <GeneralSection defaults={settings} />
      <SiblingDiscountSection defaults={settings} />
      <WhatsAppSection defaults={settings} />
      <ReceiptTemplateSection defaults={settings} />
      <SecuritySection />
    </div>
  );
}
