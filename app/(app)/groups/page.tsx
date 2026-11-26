import Link from "next/link";
import { groupsApi } from "@/lib/api/groups";
import { studentsApi } from "@/lib/api/students";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { GroupCard } from "@/components/groups/group-card";
import { GroupCardRail, GroupCardRailItem } from "@/components/groups/group-card-rail";
import { GroupPlayers, type PlayerRow } from "@/components/groups/group-players";
import { playersLabel } from "@/components/groups/group-format";
import { getT } from "@/lib/i18n/server";
import { ArrowUpRight, Plus, UsersRound } from "lucide-react";

export async function generateMetadata() {
  const t = await getT();
  return { title: `${t("groups.title")} — Academy` };
}

/** `?group=none` selects the "Unassigned" card. */
const UNASSIGNED = "none";

type SearchParams = Promise<{ group?: string | string[] }>;

export default async function GroupsPage({ searchParams }: { searchParams: SearchParams }) {
  const [sp, groups, unassigned, t] = await Promise.all([
    searchParams,
    groupsApi.list(),
    studentsApi.list({ groupId: UNASSIGNED }),
    getT(),
  ]);

  const addGroupButton = (
    <Button asChild>
      <Link href="/groups/new">
        <Plus aria-hidden />
        {t("groups.action.add")}
      </Link>
    </Button>
  );

  const header = (
    <PageHeader
      title={t("groups.title")}
      description={
        groups.length === 1
          ? t("groups.desc.count.one")
          : t("groups.desc.count", { count: groups.length })
      }
      actions={addGroupButton}
    />
  );

  if (groups.length === 0 && unassigned.length === 0) {
    return (
      <div className="space-y-6">
        {header}
        <Card className="flex flex-col items-center justify-center gap-3 border-dashed p-12 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-sea-100 text-sea-900">
            <UsersRound aria-hidden className="size-8" />
          </div>
          <h2 className="font-semibold">{t("groups.empty.title")}</h2>
          <p className="max-w-sm text-sm text-muted-foreground">{t("groups.empty.sub")}</p>
          <div className="mt-2">{addGroupButton}</div>
        </Card>
      </div>
    );
  }

  // Selection lives in the URL; fall back to the first group (or Unassigned).
  const requested = Array.isArray(sp.group) ? sp.group[0] : sp.group;
  const hasUnassigned = unassigned.length > 0;
  const selectedId =
    (requested && groups.some((g) => g.id === requested) && requested) ||
    (requested === UNASSIGNED && hasUnassigned && UNASSIGNED) ||
    groups[0]?.id ||
    UNASSIGNED;

  const selectedGroup = selectedId === UNASSIGNED ? null : await groupsApi.get(selectedId);
  const players: PlayerRow[] = selectedGroup ? selectedGroup.students : unassigned;
  const sectionName = selectedGroup?.name ?? t("groups.unassigned.title");
  const groupOptions = groups.map((g) => ({ id: g.id, name: g.name }));

  return (
    <div className="space-y-8">
      {header}

      <GroupCardRail label={t("groups.cards.label")} selectedKey={selectedId}>
        {groups.map((g) => (
          <GroupCardRailItem key={g.id}>
            <GroupCard
              kind="group"
              href={`/groups?group=${g.id}`}
              selected={g.id === selectedId}
              id={g.id}
              name={g.name}
              // The open group's count comes from its fresh detail fetch.
              studentCount={
                g.id === selectedGroup?.id ? selectedGroup.students.length : g._count.students
              }
              minAge={g.minAge}
              maxAge={g.maxAge}
              maxCapacity={g.maxCapacity}
              monthlyFee={g.monthlyFee}
              schedule={g.schedule}
              coachName={g.coachName}
            />
          </GroupCardRailItem>
        ))}
        {hasUnassigned && (
          <GroupCardRailItem>
            <GroupCard
              kind="unassigned"
              href={`/groups?group=${UNASSIGNED}`}
              selected={selectedId === UNASSIGNED}
              name={t("groups.unassigned.title")}
              studentCount={unassigned.length}
            />
          </GroupCardRailItem>
        )}
      </GroupCardRail>

      <section aria-labelledby="group-players-heading" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="group-players-heading" className="text-xl font-bold tracking-tight">
              {t("groups.players.title", { name: sectionName })}
            </h2>
            <span aria-hidden className="mt-2 block h-1 w-12 rounded-full bg-sea-500" />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="soft" className="tabular-nums">
              {playersLabel(t, players.length, null)}
            </Badge>
            {selectedGroup && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/groups/${selectedGroup.id}`}>
                  {t("groups.action.details")}
                  <ArrowUpRight aria-hidden className="rtl:-scale-x-100" />
                </Link>
              </Button>
            )}
          </div>
        </div>

        <GroupPlayers
          players={players}
          groupId={selectedGroup?.id ?? null}
          groupName={selectedGroup?.name ?? null}
          groups={groupOptions}
        />
      </section>
    </div>
  );
}
