import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAge } from "@/lib/utils";
import { getLocale, getT } from "@/lib/i18n/server";
import { ChangeGroupDialog, type GroupOption } from "./change-group-dialog";
import { DraggablePlayer } from "./group-dnd";
import { initials } from "./group-format";
import { GripVertical, Move, Plus, UsersRound } from "lucide-react";

export type PlayerRow = { id: string; fullName: string; dateOfBirth: string };

/**
 * The selected group's players: a table on desktop, stacked cards on mobile.
 * Rows can be dragged onto a group card (mouse / trackpad); every row also
 * has a "Change group" dialog — the keyboard and touch-screen alternative.
 */
export async function GroupPlayers({
  players,
  groupId,
  groupName,
  groups,
}: {
  players: PlayerRow[];
  /** The group being shown; null = the "Unassigned" list. */
  groupId: string | null;
  /** Display name for the Group column (null = no group). */
  groupName: string | null;
  /** Every group, for the Change group select. */
  groups: GroupOption[];
}) {
  const [t, locale] = await Promise.all([getT(), getLocale()]);

  if (players.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-3 border-dashed px-6 py-12 text-center">
        <div className="grid size-14 place-items-center rounded-full bg-sea-100 text-sea-900">
          <UsersRound aria-hidden className="size-7" />
        </div>
        <h3 className="font-semibold">
          {groupId ? t("groups.players.empty.title") : t("groups.players.empty.unassigned")}
        </h3>
        {groupId && (
          <>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("groups.players.empty.sub")}
            </p>
            <Button asChild className="mt-1">
              <Link href="/students/new">
                <Plus aria-hidden />
                {t("students.action.add")}
              </Link>
            </Button>
          </>
        )}
      </Card>
    );
  }

  const groupBadge = groupName ? (
    <Badge variant="soft">{groupName}</Badge>
  ) : (
    <Badge variant="outline" className="border-dashed text-muted-foreground">
      {t("groups.noGroup")}
    </Badge>
  );

  return (
    <>
      {/* Only where a mouse / trackpad can drag (HTML5 drag doesn't work on touch). */}
      <p className="hidden items-center gap-1.5 text-sm text-muted-foreground pointer-fine:flex">
        <Move aria-hidden className="size-4 shrink-0" />
        {t("groups.drag.hint")}
      </p>

      {/* Desktop: table */}
      <Card className="hidden overflow-hidden md:block">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-11 ps-5 font-semibold text-secondary-foreground">
                {t("groups.players.col.player")}
              </TableHead>
              <TableHead className="h-11 font-semibold text-secondary-foreground">
                {t("table.age")}
              </TableHead>
              <TableHead className="h-11 font-semibold text-secondary-foreground">
                {t("table.group")}
              </TableHead>
              <TableHead className="h-11 pe-5 font-semibold text-secondary-foreground">
                {t("table.actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((p) => (
              <DraggablePlayer key={p.id} id={p.id} name={p.fullName} as="tr">
                <TableCell className="py-3 ps-5">
                  <span className="flex items-center gap-2">
                    <GripVertical
                      aria-hidden
                      className="-ms-2 hidden size-4 shrink-0 text-muted-foreground pointer-fine:block"
                    />
                    <PlayerName player={p} />
                  </span>
                </TableCell>
                <TableCell className="py-3 tabular-nums">
                  {formatAge(p.dateOfBirth, locale)}
                </TableCell>
                <TableCell className="py-3">{groupBadge}</TableCell>
                <TableCell className="py-3 pe-5">
                  <ChangeGroupDialog
                    studentId={p.id}
                    studentName={p.fullName}
                    currentGroupId={groupId}
                    groups={groups}
                  />
                </TableCell>
              </DraggablePlayer>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Mobile: stacked cards */}
      <ul className="space-y-2 md:hidden">
        {players.map((p) => (
          <DraggablePlayer key={p.id} id={p.id} name={p.fullName} as="li">
            <Card className="p-4">
              <div className="flex items-start justify-between gap-3">
                <PlayerName player={p} />
                <span className="shrink-0 pt-1.5 text-sm tabular-nums text-muted-foreground">
                  {formatAge(p.dateOfBirth, locale)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-3">
                {groupBadge}
                <ChangeGroupDialog
                  studentId={p.id}
                  studentName={p.fullName}
                  currentGroupId={groupId}
                  groups={groups}
                />
              </div>
            </Card>
          </DraggablePlayer>
        ))}
      </ul>
    </>
  );
}

function PlayerName({ player }: { player: PlayerRow }) {
  return (
    <Link
      href={`/students/${player.id}`}
      // Not a link drag: grabbing the name drags the whole row instead.
      draggable={false}
      className="group/player inline-flex min-w-0 items-center gap-3 rounded-md font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        aria-hidden
        className="grid size-8 shrink-0 place-items-center rounded-full bg-sea-100 text-xs font-semibold text-sea-900"
      >
        {initials(player.fullName)}
      </span>
      <span className="truncate underline-offset-4 group-hover/player:text-primary group-hover/player:underline">
        {player.fullName}
      </span>
    </Link>
  );
}
