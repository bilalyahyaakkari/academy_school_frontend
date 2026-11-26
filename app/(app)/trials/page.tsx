import { trialsApi } from "@/lib/api/trials";
import { groupsApi } from "@/lib/api/groups";
import { settingsApi } from "@/lib/api/settings";
import { PageHeader } from "@/components/app/page-header";
import { SummaryStrip } from "@/components/app/summary-strip";
import { NewTrialButton } from "@/components/trials/new-trial-button";
import { TrialsClient } from "@/components/trials/trials-client";
import { TRIAL_TABS, type TrialTab } from "@/components/trials/trial-tabs";
import { todayIso } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: `${t("trials.title")} — Academy` };
}

type SearchParams = Promise<{ tab?: string | string[] }>;

export default async function TrialsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const tabParam = Array.isArray(sp.tab) ? sp.tab[0] : sp.tab;
  const initialTab: TrialTab = (TRIAL_TABS as readonly string[]).includes(tabParam ?? "")
    ? (tabParam as TrialTab)
    : "upcoming";

  const [trials, groups, settings, t] = await Promise.all([
    trialsApi.list(),
    groupsApi.list(),
    settingsApi.get().catch(() => null),
    getT(),
  ]);

  const today = todayIso();
  const thisMonth = today.slice(0, 7);
  const day = (iso: string) => iso.slice(0, 10);

  // Upcoming: still scheduled, from today on.
  const upcoming = trials.filter((tr) => tr.status === "SCHEDULED" && day(tr.trialDate) >= today);
  const upcomingToday = upcoming.filter((tr) => day(tr.trialDate) === today).length;
  // This month's trials so far: those whose day has come, plus any already
  // marked (a later-dated trial marked "came" still counts).
  const monthSoFar = trials.filter(
    (tr) =>
      tr.trialDate.startsWith(thisMonth) &&
      (day(tr.trialDate) <= today || tr.status !== "SCHEDULED"),
  );
  const came = monthSoFar.filter((tr) => tr.status === "ATTENDED" || tr.status === "JOINED");
  const joined = trials.filter(
    (tr) => tr.status === "JOINED" && tr.trialDate.startsWith(thisMonth),
  );
  const conversion = came.length > 0 ? Math.round((joined.length / came.length) * 100) : null;

  const groupOptions = groups
    .map((g) => ({ id: g.id, name: g.name, monthlyFee: g.monthlyFee }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <PageHeader title={t("trials.title")} description={t("trials.desc")} />

      <SummaryStrip
        actions={<NewTrialButton groups={groupOptions} today={today} />}
        items={[
          {
            label: t("trials.stat.upcoming"),
            value: upcoming.length,
            sub:
              upcomingToday > 0
                ? t("trials.stat.upcoming.today", { count: upcomingToday })
                : undefined,
          },
          {
            label: t("trials.stat.came"),
            value: came.length,
            sub:
              monthSoFar.length > 0
                ? t("trials.stat.came.sub", { count: monthSoFar.length })
                : undefined,
          },
          {
            label: t("trials.stat.joined"),
            value: joined.length,
            tone: joined.length > 0 ? "positive" : "default",
            sub:
              conversion != null
                ? t("trials.stat.joined.sub", { percent: conversion })
                : undefined,
          },
        ]}
      />

      <TrialsClient
        trials={trials}
        groups={groupOptions}
        today={today}
        countryCode={settings?.whatsappCountry ?? null}
        initialTab={initialTab}
      />
    </div>
  );
}
