import type { DragEvent } from "react";
import type { FamilyMember } from "@/lib/api/types";
import type { TranslationKey } from "@/lib/i18n";

/** The backend links at most this many students in one call. */
export const MAX_FAMILY = 20;

export type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string;

export type Family = { familyId: string; members: FamilyMember[] };
export type Suggestion = { key: string; phone: string; members: FamilyMember[] };

// ---------- Drag & drop ----------

/** What's being dragged: lone students (one, or the checked ones) or a family member. */
export type DragItem =
  | { kind: "students"; ids: string[] }
  | { kind: "member"; id: string; familyId: string };

/** Where it can be dropped. */
export type DropTarget =
  | { kind: "family"; familyId: string }
  | { kind: "student"; id: string }
  | { kind: "new" };

export function targetKey(target: DropTarget): string {
  return target.kind === "family"
    ? `family:${target.familyId}`
    : target.kind === "student"
      ? `student:${target.id}`
      : "new";
}

/** Reverse of targetKey (read back from the element's data-drop attribute). */
export function parseTargetKey(key: string | undefined): DropTarget | null {
  if (!key) return null;
  if (key === "new") return { kind: "new" };
  if (key.startsWith("family:")) return { kind: "family", familyId: key.slice(7) };
  if (key.startsWith("student:")) return { kind: "student", id: key.slice(8) };
  return null;
}

export function canDrop(item: DragItem, target: DropTarget): boolean {
  if (item.kind === "students") {
    return target.kind !== "student" || !item.ids.includes(target.id);
  }
  // A family member: onto another family (move) or a lone student (new family).
  if (target.kind === "family") return target.familyId !== item.familyId;
  return target.kind === "student";
}

/**
 * Handlers that make an element a drop target. The same handlers serve every
 * target: each target element says which one it is in `data-drop`.
 */
export type DropProps = {
  onDragEnter: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: (e: DragEvent) => void;
  onDrop: (e: DragEvent) => void;
};

/**
 * A small pill under the cursor ("Karim" / "Karim +2") instead of the browser's
 * snapshot of the whole row. Built off-screen and removed right after the
 * browser has captured it.
 */
export function setDragGhost(e: DragEvent, label: string) {
  try {
    const el = document.createElement("div");
    el.textContent = label;
    el.dir = document.documentElement.dir || "ltr";
    el.className =
      "max-w-64 truncate rounded-full bg-sea-800 px-3 py-1.5 text-sm font-medium text-white shadow-lg";
    el.style.position = "fixed";
    el.style.top = "-1000px";
    el.style.left = "0";
    document.body.appendChild(el);
    e.dataTransfer.setDragImage(el, 16, 16);
    window.setTimeout(() => el.remove(), 0);
  } catch {
    // Fall back to the browser's default ghost.
  }
}

// ---------- Optimistic family state ----------

export type FamilyChange =
  | { type: "link"; ids: string[] }
  | { type: "unlink"; id: string }
  | { type: "move"; id: string; targetIds: string[] };

function link(members: FamilyMember[], ids: string[]): FamilyMember[] {
  const idSet = new Set(ids);
  const families = new Set(
    members.filter((m) => idSet.has(m.id) && m.familyId).map((m) => m.familyId as string),
  );
  // Existing families among them are merged into the first one (like the backend).
  const target = families.values().next().value ?? `pending:${[...ids].sort().join(",")}`;
  return members.map((m) =>
    idSet.has(m.id) || (m.familyId && families.has(m.familyId))
      ? { ...m, familyId: target }
      : m,
  );
}

function unlink(members: FamilyMember[], id: string): FamilyMember[] {
  const me = members.find((m) => m.id === id);
  if (!me?.familyId) return members;
  const familyId = me.familyId;
  const rest = members.filter((m) => m.familyId === familyId && m.id !== id).length;
  // A family left with one member is dissolved.
  return members.map((m) =>
    m.id === id || (rest < 2 && m.familyId === familyId) ? { ...m, familyId: null } : m,
  );
}

export function applyFamilyChange(members: FamilyMember[], change: FamilyChange): FamilyMember[] {
  switch (change.type) {
    case "link":
      return link(members, change.ids);
    case "unlink":
      return unlink(members, change.id);
    case "move":
      return link(unlink(members, change.id), [change.id, ...change.targetIds]);
  }
}

/** Families (2+ members) in the order given, pending (just-made) ones first. */
export function groupFamilies(members: FamilyMember[], order: Map<string, number>): Family[] {
  const byId = new Map<string, FamilyMember[]>();
  for (const m of members) {
    if (!m.familyId) continue;
    const list = byId.get(m.familyId);
    if (list) list.push(m);
    else byId.set(m.familyId, [m]);
  }
  return [...byId.entries()]
    .filter(([, list]) => list.length >= 2)
    .map(([familyId, list]) => ({ familyId, members: list }))
    .sort((a, b) => (order.get(a.familyId) ?? -1) - (order.get(b.familyId) ?? -1));
}

/** A member to link new students against: one still enrolled when possible. */
export function familyAnchor(family: Family, exclude?: string): string | undefined {
  const pool = family.members.filter((m) => m.id !== exclude);
  return (pool.find((m) => !m.archived) ?? pool[0])?.id;
}

// ---------- Text ----------

/** "Karim", "Karim & Ali", "Karim, Ali & Sara" (Arabic: "كريم وعلي"). */
export function joinNames(names: string[], t: Translate): string {
  if (names.length <= 1) return names[0] ?? "";
  return (
    names.slice(0, -1).join(t("students.families.join.comma")) +
    t("students.families.join.and") +
    names[names.length - 1]
  );
}

/** Name or phone digits, Arabic spelling variants ignored. */
export function matchesSearch(
  m: FamilyMember,
  needle: string,
  digits: string,
  normalize: (s: string) => string,
): boolean {
  if (!needle) return true;
  if (normalize(m.fullName).includes(needle)) return true;
  return digits.length >= 3 && (m.phoneNumber ?? "").replace(/\D/g, "").includes(digits);
}

// ---------- "Not siblings" dismissals (this browser only) ----------

const DISMISSED_KEY = "academy:families:dismissed";
const dismissListeners = new Set<() => void>();
/** Fallback when localStorage is unavailable (private mode…). */
let memoryDismissed = "";

export function readDismissed(): string {
  try {
    return window.localStorage.getItem(DISMISSED_KEY) ?? "";
  } catch {
    return memoryDismissed;
  }
}

export function writeDismissed(keys: string[]) {
  const value = JSON.stringify(keys);
  memoryDismissed = value;
  try {
    window.localStorage.setItem(DISMISSED_KEY, value);
  } catch {
    // ignore: the in-memory copy still updates this tab
  }
  dismissListeners.forEach((l) => l());
}

export function subscribeDismissed(listener: () => void) {
  dismissListeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === DISMISSED_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    dismissListeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function parseDismissed(raw: string): string[] {
  try {
    const v: unknown = JSON.parse(raw || "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Same phone + same children: a new child with that phone shows it again. */
export function suggestionKey(phone: string, members: FamilyMember[]): string {
  return `${phone}|${members
    .map((m) => m.id)
    .sort()
    .join(",")}`;
}
