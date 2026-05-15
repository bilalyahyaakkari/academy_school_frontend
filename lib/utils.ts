import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Coerces a Date or ISO date string to a Date. */
function asDate(input: Date | string): Date {
  return input instanceof Date ? input : new Date(input);
}

/** Calculates `{ years, months }` from a date of birth, relative to `now`. */
export function calculateAge(
  dateOfBirth: Date | string,
  now: Date = new Date(),
): { years: number; months: number } {
  const dob = asDate(dateOfBirth);
  let years = now.getFullYear() - dob.getFullYear();
  let months = now.getMonth() - dob.getMonth();

  if (now.getDate() < dob.getDate()) {
    months -= 1;
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  return { years: Math.max(0, years), months: Math.max(0, months) };
}

export function formatAge(dateOfBirth: Date | string, now: Date = new Date()): string {
  const { years } = calculateAge(dateOfBirth, now);
  return `${years}y`;
}

/** Returns the birth year as a 4-digit string, or empty if invalid. */
export function birthYear(dateOfBirth: Date | string | null | undefined): string {
  if (!dateOfBirth) return "";
  const d = dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);
  if (Number.isNaN(d.getTime())) return "";
  return String(d.getFullYear());
}

export function formatCurrency(value: number | string, currency = "USD"): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatDate(input: Date | string | null | undefined): string {
  if (!input) return "—";
  return asDate(input).toLocaleDateString();
}

export const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

/** Levantine Arabic month names (used in the Syrian/Lebanese calendar). */
export const ARABIC_MONTH_NAMES = [
  "كانون الثاني", // January
  "شباط",         // February
  "آذار",         // March
  "نيسان",        // April
  "أيار",         // May
  "حزيران",       // June
  "تموز",         // July
  "آب",           // August
  "أيلول",        // September
  "تشرين الأول",  // October
  "تشرين الثاني", // November
  "كانون الأول",  // December
] as const;

export function monthLabel(month: number, year: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/**
 * Default WhatsApp reminder template (Arabic).
 * Supports placeholders:
 *   {month}    Levantine Arabic month name (e.g. "أيار")
 *   {year}     4-digit year
 *   {amount}   formatted amount string (e.g. "25.00")
 *   {student}  student full name
 *   {academy}  academy name
 *
 * WhatsApp `*bold*` formatting is honored; keep no whitespace between `*` and
 * the wrapped text, otherwise WhatsApp won't render it bold.
 */
export const DEFAULT_WHATSAPP_TEMPLATE = `السلام عليكم ،
نذكّركم بدفع اشتراك شهر {month}

               *{amount}$*

شاكرين تعاونكم واهتمامكم.
*{academy}*`;

/** Substitutes {placeholder} tokens in a template string. */
export function applyTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : `{${key}}`,
  );
}

/** Builds a wa.me reminder URL for an unpaid student. */
export function whatsappReminderUrl(opts: {
  phoneNumber: string;
  studentName: string;
  amount: number | string;
  month: number;
  year: number;
  academyName: string;
  countryCode: string;
  /** Custom template override. Falls back to DEFAULT_WHATSAPP_TEMPLATE if null/empty. */
  template?: string | null;
}): string | null {
  const digits = opts.phoneNumber.replace(/\D/g, "");
  if (!digits) return null;
  const intl = digits.startsWith(opts.countryCode) ? digits : `${opts.countryCode}${digits.replace(/^0+/, "")}`;
  // Trim values that go inside *…* — WhatsApp won't bold a string that has a
  // space right before the closing asterisk.
  const amount = (
    typeof opts.amount === "string" ? opts.amount : opts.amount.toFixed(2)
  ).trim();
  const academy = opts.academyName.trim();
  const student = opts.studentName.trim();
  const arabicMonth = ARABIC_MONTH_NAMES[opts.month - 1];

  const template =
    opts.template && opts.template.trim().length > 0
      ? opts.template
      : DEFAULT_WHATSAPP_TEMPLATE;

  const message = applyTemplate(template, {
    month: arabicMonth,
    year: String(opts.year),
    amount,
    student,
    academy,
  });

  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}
