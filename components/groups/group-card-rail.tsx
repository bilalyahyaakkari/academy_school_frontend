"use client";

import { useEffect, useRef, type ReactNode } from "react";

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

/** One slot in the rail — fixed width while the row scrolls, a grid cell from `md` up. */
export function GroupCardRailItem({ children }: { children: ReactNode }) {
  return <li className="w-[16.5rem] shrink-0 snap-start md:w-auto">{children}</li>;
}
