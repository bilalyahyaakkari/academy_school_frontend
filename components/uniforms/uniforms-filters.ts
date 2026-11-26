import { normalizeArabic } from "@/lib/arabic";
import type { UniformWithStudent } from "@/lib/api/types";

/** Segmented filter tabs above the table. */
export type UniformTab = "all" | "unpaid" | "toHandOut" | "done";
export const UNIFORM_TABS: UniformTab[] = ["all", "unpaid", "toHandOut", "done"];

export type UniformFilters = {
  tab: UniformTab;
  /** A size key (see `sizeKey`), or null for every size. */
  size: string | null;
  q: string;
};

export const NO_FILTERS: UniformFilters = { tab: "all", size: null, q: "" };

/** The size an order is grouped / filtered under ("—" when blank). */
export function sizeKey(u: UniformWithStudent): string {
  const raw = u.size?.trim() || "—";
  // "xxl" and "XXL" are the same size: letter sizes are grouped upper-case.
  return LETTER_SIZES.includes(raw.toUpperCase()) ? raw.toUpperCase() : raw;
}

export function matchesTab(u: UniformWithStudent, tab: UniformTab): boolean {
  switch (tab) {
    case "unpaid":
      return !u.isPaid;
    case "toHandOut":
      return !u.isReceived;
    case "done":
      return u.isPaid && u.isReceived;
    default:
      return true;
  }
}

/** Orders matching the size filter + Arabic-normalized search (tab ignored). */
export function filterBySizeAndSearch(
  uniforms: UniformWithStudent[],
  size: string | null,
  q: string,
): UniformWithStudent[] {
  const normalizedQ = normalizeArabic(q.trim());
  return uniforms.filter((u) => {
    if (size !== null && sizeKey(u) !== size) return false;
    if (!normalizedQ) return true;
    const haystack = normalizeArabic(
      `${u.student.fullName} ${u.size} ${u.notes ?? ""}`,
    );
    return haystack.includes(normalizedQ);
  });
}

/** Orders visible under tab + size + search combined. */
export function filterUniforms(
  uniforms: UniformWithStudent[],
  f: UniformFilters,
): UniformWithStudent[] {
  return filterBySizeAndSearch(uniforms, f.size, f.q).filter((u) =>
    matchesTab(u, f.tab),
  );
}

/** Keeps only the ids that are among `rows`. */
export function keepVisible(
  selected: Set<string>,
  rows: UniformWithStudent[],
): Set<string> {
  const visible = new Set(rows.map((u) => u.id));
  return new Set(Array.from(selected).filter((id) => visible.has(id)));
}

/** Money is summed in cents so float noise (0.1 + 0.2) never shows up. */
export const cents = (n: number) => Math.round(Number(n) * 100);

export type SizeTally = {
  size: string;
  total: number;
  paid: number;
  received: number;
};

export type UniformsSummary = {
  orders: number;
  /** Σ price. */
  totalValue: number;
  /** Σ paidAmount, capped at each order's price (partial payments count). */
  collected: number;
  /** Σ (price − paidAmount) over unpaid + partial orders. */
  outstanding: number;
  unpaidCount: number;
  toHandOut: number;
  sizes: SizeTally[];
};

/** Letter sizes, smallest to largest. */
const LETTER_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "XXXL", "3XL", "4XL"];

/**
 * Kids' numeric sizes first, smallest to largest (6, 8, 12, 14 — or "6Y"),
 * then letter sizes in size order (S, M, L, XL, XXL…), then anything else
 * alphabetically.
 */
function compareSizes(a: string, b: string): number {
  const num = (s: string) => {
    const m = /^(\d+(?:\.\d+)?)\s*[a-z]*$/i.exec(s);
    return m ? Number(m[1]) : null;
  };
  const rank = (s: string) => {
    if (num(s) !== null) return 0;
    if (LETTER_SIZES.includes(s.toUpperCase())) return 1;
    return 2;
  };
  const ra = rank(a);
  const rb = rank(b);
  if (ra !== rb) return ra - rb;
  if (ra === 0) return num(a)! - num(b)! || a.localeCompare(b);
  if (ra === 1) return LETTER_SIZES.indexOf(a.toUpperCase()) - LETTER_SIZES.indexOf(b.toUpperCase());
  return a.localeCompare(b);
}

/**
 * Totals cover every order — including those of students who have since
 * left: leaving doesn't settle an unpaid uniform.
 */
export function summarize(uniforms: UniformWithStudent[]): UniformsSummary {
  let totalC = 0;
  let collectedC = 0;
  let outstandingC = 0;
  const tallies = new Map<string, SizeTally>();
  for (const u of uniforms) {
    const price = cents(u.price);
    const paid = cents(u.paidAmount);
    totalC += price;
    collectedC += Math.min(paid, price);
    outstandingC += Math.max(0, price - paid);

    const key = sizeKey(u);
    const cur = tallies.get(key) ?? { size: key, total: 0, paid: 0, received: 0 };
    cur.total += 1;
    if (u.isPaid) cur.paid += 1;
    if (u.isReceived) cur.received += 1;
    tallies.set(key, cur);
  }

  const sizes = Array.from(tallies.values()).sort((a, b) => compareSizes(a.size, b.size));

  return {
    orders: uniforms.length,
    totalValue: totalC / 100,
    collected: collectedC / 100,
    outstanding: outstandingC / 100,
    unpaidCount: uniforms.filter((u) => !u.isPaid).length,
    toHandOut: uniforms.filter((u) => !u.isReceived).length,
    sizes,
  };
}

/** Share of an order's price that is paid, 0–100 (cent-safe). */
export function paidPercent(u: UniformWithStudent): number {
  if (u.isPaid) return 100;
  const price = cents(u.price);
  if (price <= 0) return 0;
  const paid = Math.min(Math.max(cents(u.paidAmount), 0), price);
  return Math.round((paid / price) * 100);
}
