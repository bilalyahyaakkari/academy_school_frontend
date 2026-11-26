import Link from "next/link";
import { studentsApi } from "@/lib/api/students";
import { groupsApi } from "@/lib/api/groups";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/app/page-header";
import { SummaryStrip } from "@/components/app/summary-strip";
import { StudentsFilterBar } from "@/components/students/students-filter-bar";
import { StudentsTable } from "@/components/students/students-table";
import { getT } from "@/lib/i18n/server";
import { Plus, UserPlus2, Download, Upload, Sparkles, UsersRound } from "lucide-react";

export async function generateMetadata() {
  const t = await getT();
  return { title: `${t("students.title")} — Academy` };
}

type SearchParams = Promise<{
  q?: string;
  groupId?: string;
  archived?: string;
}>;

export default async function StudentsPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const groupParam = sp.groupId === "__none__" ? "none" : sp.groupId || undefined;
  // undefined = current students only (the default); "only" = left; "include" = both.
  const archivedParam =
    sp.archived === "only" || sp.archived === "include" ? sp.archived : undefined;

  const t = await getT();

  // 2 parallel fetches:
  //   - filtered list for the table (matches what the user is filtering for)
  //   - everyone, including those who left, for the stats banner and for the
  //     "of Y" total — Y must be counted in the same archived mode as X.
  const [students, everyone, groups] = await Promise.all([
    studentsApi.list({
      q: q || undefined,
      groupId: groupParam,
      archived: archivedParam,
    }),
    studentsApi.list({ archived: "include" }),
    groupsApi.list(),
  ]);

  const current = everyone.filter((s) => !s.archived);
  const leftCount = everyone.length - current.length;
  const unassigned = current.filter((s) => !s.groupId).length;
  const scopeTotal =
    archivedParam === "only"
      ? leftCount
      : archivedParam === "include"
        ? everyone.length
        : current.length;

  // q / group narrow the list; the archived mode only picks which pool we're
  // looking at, so it changes the total rather than counting as a filter.
  const isFiltered = !!(q || sp.groupId);
  const hasAnyFilter = isFiltered || !!archivedParam;

  const description = isFiltered
    ? t("students.desc.showing", { filtered: students.length, total: scopeTotal })
    : archivedParam === "only"
      ? leftCount === 1
        ? t("students.desc.left.one")
        : t("students.desc.left", { count: leftCount })
      : archivedParam === "include"
        ? t("students.desc.withLeft", { count: everyone.length, left: leftCount })
        : current.length === 1
          ? t("students.desc.enrolled.one")
          : t("students.desc.enrolled", { count: current.length });

  const exportParams = new URLSearchParams();
  if (q) exportParams.set("q", q);
  if (sp.groupId) exportParams.set("groupId", sp.groupId);
  if (archivedParam) exportParams.set("archived", archivedParam);
  const exportHref = `/api/students/export${
    exportParams.toString() ? `?${exportParams.toString()}` : ""
  }`;

  // Remounts the table whenever the filters change, so a selection made under
  // one filter can never be bulk-deleted under another.
  const tableKey = JSON.stringify([q, sp.groupId ?? "", archivedParam ?? ""]);

  // The page has no title bar: its buttons live in the summary card.
  const pageActions = (
    <>
            <Button asChild variant="outline">
              <Link href="/students/families">
                <UsersRound className="size-4" />
                {t("students.families.open")}
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/students/import">
                <Upload className="size-4" />
                {t("students.action.import")}
              </Link>
            </Button>
            <Button asChild variant="outline" disabled={students.length === 0}>
              <a href={exportHref} download>
                <Download className="size-4" />
                {t("students.action.exportExcel")}
              </a>
            </Button>
            <Button asChild>
              <Link href="/students/new">
                <Plus className="size-4" />
                {t("students.action.add")}
              </Link>
            </Button>
          </>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("students.title")}
        description={description}
      />

      <SummaryStrip
        actions={pageActions}
        items={[
          {
            label: t("students.stat.current"),
            value: current.length,
            sub: t("students.stat.total.groups", { count: groups.length }),
          },
          {
            label: t("students.stat.unassigned"),
            value: unassigned,
            sub:
              unassigned === 0 && current.length > 0
                ? t("students.stat.unassigned.none")
                : undefined,
          },
          {
            label: t("students.stat.left"),
            value: leftCount,
            sub: leftCount > 0 ? t("students.stat.left.sub") : undefined,
          },
        ]}
      />

      <StudentsFilterBar
        groups={groups.map((g) => ({ id: g.id, name: g.name }))}
        initialQ={q}
        initialGroupId={sp.groupId}
        initialArchived={archivedParam}
      />

      {students.length === 0 ? (
        <Card className="relative overflow-hidden">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sea-700 to-sea-500"
          />
          <CardContent className="relative flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="relative">
              <div className="relative grid size-20 place-items-center rounded-full bg-sea-100">
                <UserPlus2 className="size-10 text-sea-800" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold tracking-tight text-sea-900">
                {hasAnyFilter
                  ? t("students.empty.title.filtered")
                  : t("students.empty.title")}
              </h3>
              <p className="max-w-sm text-sm text-muted-foreground">
                {hasAnyFilter
                  ? t("students.empty.sub.filtered")
                  : t("students.empty.sub")}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <Button asChild>
                <Link href="/students/new">
                  <Plus className="size-4" />
                  {t("students.action.add")}
                </Link>
              </Button>
              {!hasAnyFilter && (
                <Button asChild variant="outline">
                  <Link href="/students/import">
                    <Upload className="size-4" />
                    {t("students.empty.importBtn")}
                  </Link>
                </Button>
              )}
            </div>
            <p className="flex items-center gap-1.5 pt-3 text-xs text-muted-foreground">
              <Sparkles className="size-3 text-sea-700" />
              <span>{t("students.empty.importHint")}</span>
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {/* No visible title bar: say how many match when a filter is on. */}
          {isFiltered && <p className="text-xs text-muted-foreground">{description}</p>}
          <StudentsTable key={tableKey} students={students} />
        </div>
      )}
    </div>
  );
}
