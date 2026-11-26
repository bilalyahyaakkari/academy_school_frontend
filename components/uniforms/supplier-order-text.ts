import type { Locale, TranslationKey } from "@/lib/i18n";
import type { SupplierOrder, SupplierOrderState } from "@/lib/api/types";
import { compareSizes } from "./uniforms-filters";

type T = (key: TranslationKey, vars?: Record<string, string | number>) => string;

/*
 * The messages sent to the supplier. They only ever contain the order number,
 * sizes and quantities — never student names or parent phones (the order's
 * `uniforms` are internal and are not read here).
 */

const ARABIC_INDIC = "٠١٢٣٤٥٦٧٨٩";

/** Arabic-Indic digits in Arabic ("12" → "١٢"), unchanged in English. */
export function localDigits(n: number | string, locale: Locale): string {
  const s = String(n);
  return locale === "ar" ? s.replace(/[0-9]/g, (d) => ARABIC_INDIC[Number(d)]) : s;
}

/**
 * "4 pcs" / "1 pc"; in Arabic the counted noun follows the number:
 * 1 → قطعة واحدة, 2 → قطعتين, 3–10 → ٤ قطع, 11+ → ١١ قطعة (103 → ١٠٣ قطع).
 */
export function piecesText(n: number, locale: Locale, t: T): string {
  const num = localDigits(n, locale);
  if (n === 1) return t("uniforms.supplier.pcs.one");
  if (n === 2) return t("uniforms.supplier.pcs.two");
  const lastTwo = n % 100;
  if (lastTwo >= 3 && lastTwo <= 10) return t("uniforms.supplier.pcs.few", { n: num });
  return t("uniforms.supplier.pcs.many", { n: num });
}

function bySize<R extends { size: string }>(rows: R[]): R[] {
  return [...rows].sort((a, b) => compareSizes(a.size, b.size));
}

/** «طلبية رقم ١٢ — قياس S: ٤ قطع، قياس M: ٦ قطع، المجموع: ١٠ قطع» */
export function supplierOrderText(
  order: Pick<SupplierOrder, "number" | "lines">,
  locale: Locale,
  t: T,
): string {
  const sep = t("uniforms.supplier.msg.sep");
  const lines = bySize(order.lines.filter((l) => l.quantity > 0));
  const total = lines.reduce((sum, l) => sum + l.quantity, 0);
  const parts = lines.map((l) =>
    t("uniforms.supplier.msg.line", { size: l.size, qty: piecesText(l.quantity, locale, t) }),
  );
  parts.push(t("uniforms.supplier.msg.total", { qty: piecesText(total, locale, t) }));
  return `${t("uniforms.supplier.msg.title", { number: localDigits(order.number, locale) })} — ${parts.join(sep)}`;
}

/** True when some size is short or over. */
export function hasDifferences(order: Pick<SupplierOrder, "reconciliation">): boolean {
  return order.reconciliation.some((r) => r.missing > 0 || r.extra > 0);
}

/** «طلبية رقم ١٢ — ناقص: قياس M قطعة واحدة. زايد: قياس L قطعة واحدة.» */
export function supplierDifferencesText(
  order: Pick<SupplierOrder, "number" | "reconciliation">,
  locale: Locale,
  t: T,
): string {
  const sep = t("uniforms.supplier.msg.sep");
  const rows = bySize(order.reconciliation);
  const item = (size: string, qty: number) =>
    t("uniforms.supplier.diff.item", { size, qty: piecesText(qty, locale, t) });
  const missing = rows.filter((r) => r.missing > 0).map((r) => item(r.size, r.missing));
  const extra = rows.filter((r) => r.extra > 0).map((r) => item(r.size, r.extra));
  const parts: string[] = [];
  if (missing.length) parts.push(t("uniforms.supplier.diff.missing", { items: missing.join(sep) }));
  if (extra.length) parts.push(t("uniforms.supplier.diff.extra", { items: extra.join(sep) }));
  if (parts.length === 0) parts.push(t("uniforms.supplier.diff.none"));
  return `${t("uniforms.supplier.msg.title", { number: localDigits(order.number, locale) })} — ${parts.join(" ")}`;
}

export const STATE_LABEL: Record<SupplierOrderState, TranslationKey> = {
  DRAFT: "uniforms.orders.state.DRAFT",
  ORDERED: "uniforms.orders.state.ORDERED",
  PARTIAL: "uniforms.orders.state.PARTIAL",
  RECEIVED: "uniforms.orders.state.RECEIVED",
};
