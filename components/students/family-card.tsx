"use client";

import Link from "next/link";
import type { DragEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import type { FamilyMember } from "@/lib/api/types";
import { GripVertical, Phone, Plus, X } from "lucide-react";
import { joinNames, type DropProps, type Family } from "./families-shared";

/**
 * One family on the Families page: its children as draggable chips (× takes
 * one out), and the whole card is a drop target. "+ Add N here" adds the
 * checked students (the no-drag way: phones, keyboard, screen readers).
 */
export function FamilyCard({
  family,
  checkedCount,
  isOver,
  canReceive,
  draggingId,
  dropKey,
  dropHandlers,
  onAddChecked,
  onRemove,
  onMemberDragStart,
  onDragEnd,
}: {
  family: Family;
  checkedCount: number;
  /** Something droppable is hovering this card. */
  isOver: boolean;
  /** A drag is in progress and could be dropped here. */
  canReceive: boolean;
  /** The member being dragged, if it's one of ours. */
  draggingId: string | null;
  dropKey: string;
  dropHandlers: DropProps;
  onAddChecked: () => void;
  onRemove: (member: FamilyMember) => void;
  onMemberDragStart: (e: DragEvent, member: FamilyMember) => void;
  onDragEnd: () => void;
}) {
  const t = useT();
  const names = joinNames(
    family.members.map((m) => m.fullName),
    t,
  );
  const phone = family.members.find((m) => m.phoneNumber)?.phoneNumber;

  return (
    <section
      aria-label={t("students.families.card.label", { names })}
      data-drop={dropKey}
      {...dropHandlers}
      className={cn(
        "relative flex min-w-0 flex-col gap-3 rounded-xl border bg-card p-3 transition-colors",
        isOver
          ? "border-sea-500 bg-sea-100 ring-2 ring-sea-500"
          : canReceive
            ? "border-dashed border-sea-500"
            : "border-border",
      )}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-sea-900">
            {t("students.families.card.count", { count: family.members.length })}
          </p>
          {phone && (
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone aria-hidden className="size-3 shrink-0" />
              <span dir="ltr" className="truncate">
                {phone}
              </span>
            </p>
          )}
        </div>
        {checkedCount > 0 && (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={onAddChecked}
            aria-label={t("students.families.card.addLabel", { count: checkedCount, names })}
          >
            <Plus className="size-4" />
            {t("students.families.card.add", { count: checkedCount })}
          </Button>
        )}
      </div>

      <ul className="flex min-w-0 flex-wrap gap-1.5">
        {family.members.map((m) => (
          <li
            key={m.id}
            draggable
            onDragStart={(e) => onMemberDragStart(e, m)}
            onDragEnd={onDragEnd}
            title={t("students.families.member.drag", { name: m.fullName })}
            className={cn(
              "flex min-w-0 max-w-full cursor-grab items-center gap-1 rounded-lg border border-sea-300 bg-background py-1 ps-1 pe-0.5 active:cursor-grabbing",
              draggingId === m.id && "opacity-50",
            )}
          >
            <GripVertical aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="min-w-0">
              <span className="flex min-w-0 items-center gap-1.5">
                <Link
                  href={`/students/${m.id}`}
                  draggable={false}
                  className="truncate text-sm font-medium hover:underline"
                >
                  {m.fullName}
                </Link>
                {m.archived && (
                  <Badge variant="soft" className="shrink-0 rounded-full px-1.5 text-[10px]">
                    {t("students.badge.left")}
                  </Badge>
                )}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {m.group?.name ?? t("students.families.noGroup")}
              </span>
            </span>
            <button
              type="button"
              onClick={() => onRemove(m)}
              aria-label={t("students.families.member.remove", { name: m.fullName })}
              className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-alert/10 hover:text-alert focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X aria-hidden className="size-4" />
            </button>
          </li>
        ))}
      </ul>

      {isOver && (
        <span
          aria-hidden
          className="pointer-events-none absolute end-2 bottom-2 rounded-full bg-sea-800 px-2 py-0.5 text-xs font-medium text-white"
        >
          {t("students.families.card.drop")}
        </span>
      )}
    </section>
  );
}
