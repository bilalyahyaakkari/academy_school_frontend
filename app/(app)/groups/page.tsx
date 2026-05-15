import Link from "next/link";
import { groupsApi } from "@/lib/api/groups";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { formatCurrency, cn } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";
import type { TranslationKey } from "@/lib/i18n";
import { Plus, UsersRound, Clock, User as UserIcon } from "lucide-react";

export const metadata = { title: "Groups — Academy" };

// Color palette — each group card cycles through one of these.
type Palette = {
  bar: string; // top accent gradient
  blob: string; // drifting blurred orb
  badge: string; // pill on the top-right
  drift: string; // which drift animation
};

const PALETTES: Palette[] = [
  {
    bar: "from-blue-500 via-blue-500 to-cyan-400",
    blob: "bg-blue-400/40",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    drift: "animate-drift-1",
  },
  {
    bar: "from-purple-500 via-fuchsia-500 to-pink-500",
    blob: "bg-fuchsia-400/40",
    badge: "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
    drift: "animate-drift-2",
  },
  {
    bar: "from-emerald-500 via-emerald-500 to-teal-400",
    blob: "bg-emerald-400/40",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    drift: "animate-drift-3",
  },
  {
    bar: "from-amber-500 via-orange-500 to-red-500",
    blob: "bg-orange-400/40",
    badge: "bg-orange-500/10 text-orange-700 dark:text-orange-300",
    drift: "animate-drift-1",
  },
  {
    bar: "from-rose-500 via-pink-500 to-rose-400",
    blob: "bg-rose-400/40",
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
    drift: "animate-drift-2",
  },
  {
    bar: "from-indigo-500 via-violet-500 to-purple-500",
    blob: "bg-violet-400/40",
    badge: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
    drift: "animate-drift-3",
  },
];

export default async function GroupsPage() {
  const groups = await groupsApi.list();
  const t = await getT();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("groups.title")}
        description={
          groups.length === 1
            ? t("groups.desc.count.one")
            : t("groups.desc.count", { count: groups.length })
        }
        actions={
          <Button asChild>
            <Link href="/groups/new">
              <Plus className="size-4" />
              {t("groups.action.new")}
            </Link>
          </Button>
        }
      />

      {groups.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
          <div className="rounded-full bg-muted p-4">
            <UsersRound className="size-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold">{t("groups.empty.title")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("groups.empty.sub")}
          </p>
          <Button asChild className="mt-2">
            <Link href="/groups/new">
              <Plus className="size-4" />
              {t("groups.action.new")}
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g, i) => {
            const palette = PALETTES[i % PALETTES.length];
            return (
              <Link key={g.id} href={`/groups/${g.id}`} className="group">
                <Card
                  className={cn(
                    "relative h-full overflow-hidden transition-all duration-300",
                    "hover:-translate-y-1 hover:shadow-xl",
                  )}
                >
                  {/* Top accent bar */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r",
                      palette.bar,
                    )}
                  />

                  {/* Drifting glow blob — animated */}
                  <span
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute -right-12 -top-12 size-44 rounded-full blur-3xl",
                      palette.blob,
                      palette.drift,
                    )}
                  />

                  {/* Subtle hover gradient sheen */}
                  <span
                    aria-hidden
                    className={cn(
                      "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100",
                      palette.bar,
                      "from-[var(--tw-gradient-from)]/[0.04] via-transparent to-transparent",
                    )}
                  />

                  <CardContent className="relative pt-7">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-lg font-bold tracking-tight">
                        {g.name}
                      </h3>
                      <span
                        className={cn(
                          "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          palette.badge,
                        )}
                      >
                        {g._count.students}
                        {g.maxCapacity ? ` / ${g.maxCapacity}` : ""}
                      </span>
                    </div>

                    {(g.minAge != null || g.maxAge != null) && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("groups.card.ages", {
                          min: g.minAge ?? "?",
                          max: g.maxAge ?? "?",
                        })}
                      </p>
                    )}

                    {/* Fee — featured prominently */}
                    <div className="mt-5 flex items-baseline gap-1.5">
                      <span className="text-2xl font-bold tracking-tight">
                        {formatCurrency(g.monthlyFee)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t("groups.card.perMonth")}
                      </span>
                    </div>

                    {g.coachName && (
                      <p className="mt-3 flex items-center gap-2 text-sm">
                        <UserIcon className="size-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {g.coachName}
                        </span>
                      </p>
                    )}

                    {g.schedule.length > 0 && (
                      <div className="mt-4 space-y-1 border-t border-border pt-3">
                        {g.schedule.slice(0, 3).map((s, idx) => (
                          <p
                            key={idx}
                            className="flex items-center gap-2 text-xs text-muted-foreground"
                          >
                            <Clock className="size-3" />
                            <span className="font-medium text-foreground">
                              {t(`day.${s.day}` as TranslationKey)}
                            </span>
                            <span>·</span>
                            <span>
                              {s.startTime}–{s.endTime}
                            </span>
                          </p>
                        ))}
                        {g.schedule.length > 3 && (
                          <p className="pt-1 text-xs text-muted-foreground">
                            {g.schedule.length - 3 === 1
                              ? t("groups.card.moreSessions", {
                                  count: g.schedule.length - 3,
                                })
                              : t("groups.card.moreSessions.plural", {
                                  count: g.schedule.length - 3,
                                })}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
