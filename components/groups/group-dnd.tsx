"use client";

import {
  createContext,
  useContext,
  useOptimistic,
  useState,
  useTransition,
  type DragEvent,
  type ReactNode,
} from "react";
import { TableRow } from "@/components/ui/table";
import { changeStudentGroup } from "@/lib/actions/groups";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Drag & drop for the Groups page: drag a player row (native HTML5 DnD, no
 * library) onto a group card — or the "Unassigned" card — to move them.
 *
 * Touch screens don't fire HTML5 drag events, so the row's "Change group"
 * button stays the accessible / phone way to do the same thing.
 */

/** Drop key of the "Unassigned" card (matches `?group=none`). */
export const UNASSIGNED_KEY = "none";

type DraggedPlayer = { id: string; name: string };
type PendingMove = { studentId: string; to: string };

type GroupDndValue = {
  /** Key of the group whose players are listed (UNASSIGNED_KEY = no group). */
  currentKey: string;
  dragging: DraggedPlayer | null;
  overKey: string | null;
  /** Players moved away optimistically (hidden until the page refreshes). */
  hiddenIds: Set<string>;
  /** Cards with a move in flight. */
  pendingKeys: Set<string>;
  startDrag: (player: DraggedPlayer) => void;
  endDrag: () => void;
  setOverKey: (key: string | null) => void;
  drop: (key: string) => void;
};

const GroupDndContext = createContext<GroupDndValue | null>(null);

function useGroupDnd() {
  return useContext(GroupDndContext);
}

export function GroupDndProvider({
  groups,
  currentGroupId,
  children,
}: {
  /** Every group (for toast names). */
  groups: { id: string; name: string }[];
  /** The group whose players are listed; null = the "Unassigned" list. */
  currentGroupId: string | null;
  children: ReactNode;
}) {
  const t = useT();
  const [dragging, setDragging] = useState<DraggedPlayer | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [pending, addPending] = useOptimistic<PendingMove[], PendingMove>(
    [],
    (state, move) => [...state, move],
  );
  const currentKey = currentGroupId ?? UNASSIGNED_KEY;

  function move(player: DraggedPlayer, fromKey: string, toKey: string, isUndo = false) {
    const to = toKey === UNASSIGNED_KEY ? null : toKey;
    startTransition(async () => {
      // Optimistic: the row disappears now; the refreshed page replaces it.
      addPending({ studentId: player.id, to: toKey });
      const res = await changeStudentGroup(player.id, to);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      const toName = groups.find((g) => g.id === to)?.name ?? "";
      const message = to
        ? t("groups.toast.moved", { name: player.name, group: toName })
        : t("groups.toast.removedFromGroup", { name: player.name });
      toast.success(
        message,
        isUndo
          ? undefined
          : {
              action: {
                label: t("groups.toast.undo"),
                onClick: () => move(player, toKey, fromKey, true),
              },
            },
      );
    });
  }

  const value: GroupDndValue = {
    currentKey,
    dragging,
    overKey,
    hiddenIds: new Set(pending.filter((m) => m.to !== currentKey).map((m) => m.studentId)),
    pendingKeys: new Set(pending.map((m) => m.to)),
    startDrag: (player) => setDragging(player),
    endDrag: () => {
      setDragging(null);
      setOverKey(null);
    },
    setOverKey,
    drop: (key) => {
      const player = dragging;
      setDragging(null);
      setOverKey(null);
      if (!player || key === currentKey) return; // same group: nothing to do
      move(player, currentKey, key);
    },
  };

  return <GroupDndContext.Provider value={value}>{children}</GroupDndContext.Provider>;
}

/**
 * True while a player is being dragged, or a move onto `dropKey` is in flight.
 * Lets a card that's normally hidden (an empty "Unassigned") appear as a target.
 */
export function useDropTargetVisible(dropKey: string): boolean {
  const dnd = useGroupDnd();
  return Boolean(dnd && (dnd.dragging || dnd.pendingKeys.has(dropKey)));
}

/** Small "Karim → …" pill used as the drag image. */
function setGhost(e: DragEvent, label: string) {
  const ghost = document.createElement("div");
  ghost.textContent = label;
  ghost.dir = document.documentElement.dir || "ltr";
  ghost.className =
    "fixed -top-96 start-0 whitespace-nowrap rounded-full bg-sea-900 px-3 py-1.5 text-sm font-medium text-white shadow-md";
  document.body.appendChild(ghost);
  e.dataTransfer.setDragImage(ghost, 12, 12);
  setTimeout(() => ghost.remove(), 0);
}

/**
 * One draggable player: a table row on desktop (`as="tr"`) or a list item on
 * mobile (`as="li"`). Hidden while their move is in flight.
 */
export function DraggablePlayer({
  id,
  name,
  as,
  className,
  children,
}: {
  id: string;
  name: string;
  as: "tr" | "li";
  className?: string;
  children: ReactNode;
}) {
  const t = useT();
  const dnd = useGroupDnd();
  if (dnd?.hiddenIds.has(id)) return null;

  const props = {
    draggable: Boolean(dnd),
    onDragStart: (e: DragEvent<HTMLElement>) => {
      if (!dnd) return;
      e.dataTransfer.effectAllowed = "move";
      // Firefox only starts a drag when some data is set.
      e.dataTransfer.setData("text/plain", name);
      setGhost(e, t("groups.drag.ghost", { name }));
      dnd.startDrag({ id, name });
    },
    onDragEnd: () => dnd?.endDrag(),
    className: cn(
      className,
      dnd && "pointer-fine:cursor-grab pointer-fine:active:cursor-grabbing",
      dnd?.dragging?.id === id && "opacity-50",
    ),
  };

  return as === "tr" ? <TableRow {...props}>{children}</TableRow> : <li {...props}>{children}</li>;
}

/**
 * Wraps a group card as a drop target. Exposes `data-drop` ("valid" / "over" /
 * "pending") on a `group/drop` element so the card can style itself.
 */
export function GroupDropTarget({
  dropKey,
  className,
  children,
}: {
  dropKey: string;
  className?: string;
  children: ReactNode;
}) {
  const t = useT();
  const dnd = useGroupDnd();
  const dragging = dnd?.dragging ?? null;
  const valid = Boolean(dnd && dragging && dropKey !== dnd.currentKey);
  const over = valid && dnd?.overKey === dropKey;
  const pending = Boolean(dnd?.pendingKeys.has(dropKey));
  const state = pending ? "pending" : over ? "over" : valid ? "valid" : undefined;

  const allow = (e: DragEvent<HTMLElement>) => {
    if (!valid || !dnd) return; // not ours, or the player's own group
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dnd.overKey !== dropKey) dnd.setOverKey(dropKey);
  };

  return (
    <div
      data-drop={state}
      onDragEnter={allow}
      onDragOver={allow}
      onDragLeave={(e) => {
        if (!dnd || dnd.overKey !== dropKey) return;
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) dnd.setOverKey(null);
      }}
      onDrop={(e) => {
        if (!valid || !dnd) return;
        e.preventDefault();
        dnd.drop(dropKey);
      }}
      className={cn("group/drop relative h-full", className)}
    >
      {children}
      {over && dragging ? (
        <DropChip>{t("groups.drag.dropHere", { name: dragging.name })}</DropChip>
      ) : pending ? (
        <DropChip>{t("groups.drag.moving")}</DropChip>
      ) : null}
    </div>
  );
}

function DropChip({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-3 bottom-3 z-20 truncate rounded-md bg-sea-900 px-2 py-1.5 text-center text-xs font-medium text-white shadow-md"
    >
      {children}
    </span>
  );
}
