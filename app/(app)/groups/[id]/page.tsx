import Link from "next/link";
import { notFound } from "next/navigation";
import { groupsApi } from "@/lib/api/groups";
import { ApiError } from "@/lib/api/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { SummaryStrip } from "@/components/app/summary-strip";
import { GroupDangerZone } from "@/components/groups/group-danger-zone";
import { GroupPlayers } from "@/components/groups/group-players";
import { ageLabel, playersLabel } from "@/components/groups/group-format";
import { formatCurrency } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n";
import type { ScheduleSlot } from "@/lib/api/types";
import { Clock, Pencil } from "lucide-react";

type Params = Promise<{ id: string }>;

const DAY_ORDER: ScheduleSlot["day"][] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default async function GroupDetailPage({ params }: { params: Params }) {
  const { id } = await params;

  let group;
  try {
    group = await groupsApi.get(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }

  const [t, groups] = await Promise.all([getT(), groupsApi.list()]);
  const fee = formatCurrency(group.monthlyFee);
  const count = group.students.length;
  const over = group.maxCapacity != null && count > group.maxCapacity;
  const schedule = [...group.schedule].sort(
    (a, b) =>
      DAY_ORDER.indexOf(a.day) - DAY_ORDER.indexOf(b.day) ||
      a.startTime.localeCompare(b.startTime),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        showTitle
        title={group.name}
        description={
          count === 1
            ? t("groups.detail.desc.one", { fee })
            : t("groups.detail.desc", { count, fee })
        }
        backHref="/groups"
        backLabel={t("groups.back")}
        actions={
          <Button asChild>
            <Link href={`/groups/${group.id}/edit`}>
              <Pencil aria-hidden />
              {t("common.edit")}
            </Link>
          </Button>
        }
      />

      <SummaryStrip
        items={[
          {
            label: t("groups.detail.capacity"),
            value: playersLabel(t, count, group.maxCapacity),
            sub: over ? (
              <Badge variant="alert">{t("groups.card.overCapacity")}</Badge>
            ) : undefined,
          },
          {
            label: t("groups.detail.fee"),
            value: fee,
            suffix: t("groups.card.perMonth"),
          },
          {
            label: t("groups.detail.ageRange"),
            value: ageLabel(t, group.minAge, group.maxAge) ?? "—",
          },
          {
            label: t("groups.detail.coach"),
            value: group.coachName ?? "—",
          },
        ]}
      />

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">{t("groups.detail.schedule")}</CardTitle>
        </CardHeader>
        <CardContent>
          {schedule.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("groups.detail.noSessions")}</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {schedule.map((s, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <span className="font-medium">{t(`day.${s.day}` as TranslationKey)}</span>
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Clock aria-hidden className="size-3.5" />
                    <span dir="ltr" className="tabular-nums">
                      {s.startTime}–{s.endTime}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <section aria-labelledby="group-players-heading" className="space-y-4">
        <div>
          <h2 id="group-players-heading" className="text-xl font-bold tracking-tight">
            {t("groups.players.title", { name: group.name })}
          </h2>
          <span aria-hidden className="mt-2 block h-1 w-12 rounded-full bg-sea-500" />
        </div>
        <GroupPlayers
          players={group.students}
          groupId={group.id}
          groupName={group.name}
          groups={groups.map((g) => ({ id: g.id, name: g.name }))}
        />
      </section>

      <GroupDangerZone groupId={group.id} groupName={group.name} studentCount={count} />
    </div>
  );
}
