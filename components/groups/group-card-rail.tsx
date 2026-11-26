"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { GroupDropTarget, useDropTargetVisible } from "./group-dnd";

/**
 * The row of group cards: a horizontally scrolling, snapping row on mobile and
 * a grid from `md` up. When the selection changes it scrolls the selected card
 * into view, so a card picked from a deep link isn't hidden off-screen.
 */
export function GroupCardRail({
  label,
  selectedKey,
  children,
}: {
  label: string;
  /** Changes whenever the selected card changes. */
  selectedKey: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const list = ref.current;
    if (!list || list.scrollWidth <= list.clientWidth) return; // grid: nothing to scroll
    const current = list.querySelector<HTMLElement>('[aria-current="page"]');
    current?.closest("li")?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [selectedKey]);

  return (
    <nav aria-label={label}>
      <ul
        ref={ref}
        className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pt-1 pb-3 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:pb-1 lg:grid-cols-3 2xl:grid-cols-4"
      >
        {children}
      </ul>
    </nav>
  );
}

/**
 * One slot in the rail — fixed width while the row scrolls, a grid cell from
 * `md` up. With `dropKey` the card is also a drop target for dragged players
 * (group id, or "none" for Unassigned).
 */
export function GroupCardRailItem({
  children,
  dropKey,
  hiddenUnlessDragging,
}: {
  children: ReactNode;
  dropKey?: string;
  /** Render only while a player is being dragged (an empty Unassigned card). */
  hiddenUnlessDragging?: boolean;
}) {
  const visible = useDropTargetVisible(dropKey ?? "");
  return (
    <li
      className={cn(
        "w-[16.5rem] shrink-0 snap-start md:w-auto",
        hiddenUnlessDragging && !visible && "hidden",
      )}
    >
      {dropKey ? <GroupDropTarget dropKey={dropKey}>{children}</GroupDropTarget> : children}
    </li>
  );
}
