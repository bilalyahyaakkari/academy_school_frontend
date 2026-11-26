import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * The academy runs on Beirut time; the server (Vercel) runs on UTC. Anything
 * that asks "what month / what day is it?" must answer in this timezone, or the
 * first hours of every month would still count as the previous month.
 */
export const ACADEMY_TZ = "Asia/Beirut";

/** Today's { year, month (1-12), day } in the academy's timezone. */
export function academyToday(): { year: number; month: number; day: number } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: ACADEMY_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const out: Record<string, string> = {};
  for (const p of fmt.formatToParts(new Date())) out[p.type] = p.value;
  return { year: Number(out.year), month: Number(out.month), day: Number(out.day) };
}

/** Current { year, month } in the academy's timezone. */
export function currentYearMonth(): { year: number; month: number } {
  const { year, month } = academyToday();
  return { year, month };
}

/**
 * Reads ?year=&month= from a page's searchParams, falling back to the current
 * month when either is missing or out of range (e.g. ?month=0 or ?year=abc).
 */
export function resolveYearMonth(params: {
  year?: string | string[];
  month?: string | string[];
}): { year: number; month: number } {
  const cur = currentYearMonth();
  const one = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v);
  const y = Number(one(params.year));
  const m = Number(one(params.month));
  const yearOk = Number.isInteger(y) && y >= 2000 && y <= 2100;
  const monthOk = Number.isInteger(m) && m >= 1 && m <= 12;
  return {
    year: yearOk ? y : cur.year,
    month: yearOk && monthOk ? m : yearOk ? 1 : cur.month,
  };
}

/** Intl locale tag for the app locale (Latin digits in Arabic too). */
export function intlLocale(locale?: string): string {
  return locale === "ar" ? "ar-LB-u-nu-latn" : "en-GB";
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

export function formatAge(
  dateOfBirth: Date | string,
  locale?: string,
  now: Date = new Date(),
): string {
  const { years } = calculateAge(dateOfBirth, now);
  return locale === "ar" ? `${years} سنة` : `${years}y`;
}

/** Returns the birth year as a 4-digit string, or empty if invalid. */
export function birthYear(dateOfBirth: Date | string | null | undefined): string {
  if (!dateOfBirth) return "";
  const d = dateOfBirth instanceof Date ? dateOfBirth : new Date(dateOfBirth);
  if (Number.isNaN(d.getTime())) return "";
  // Dates of birth are stored at UTC midnight — read the UTC year so a host
  // west of UTC doesn't show (and re-save) the previous year.
  return String(d.getUTCFullYear());
}

export function formatCurrency(value: number | string, currency = "USD"): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "—";
  const text = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n);
  // Wrapped in a left-to-right isolate (LRI … PDI) so inside Arabic text the
  // amount keeps its shape — "$100.00", never "100.00$".
  return `\u2066${text}\u2069`;
}

/**
 * Formats a timestamp as a date in the academy's timezone and the app's
 * locale. Deterministic (fixed timezone + locale), so the server render and the
 * browser render match — no hydration mismatch.
 */
export function formatDate(input: Date | string | null | undefined, locale?: string): string {
  if (!input) return "—";
  const d = asDate(input);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: ACADEMY_TZ,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(d);
}

/**
 * Formats a date-only value (stored at UTC midnight) without letting the local
 * timezone shift it a day — "2026-09-12" must render as the 12th everywhere.
 */
export function formatDateOnly(input: string | Date | null | undefined, locale?: string): string {
  if (!input) return "—";
  const iso = typeof input === "string" ? input : input.toISOString();
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return "—";
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: "UTC",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

/** Day of the month for a date-only value, as displayed (no TZ shift). */
export function dayOfMonth(input: string | Date): number {
  const iso = typeof input === "string" ? input : input.toISOString();
  return Number(iso.slice(8, 10));
}

/** Short weekday label ("Mon") for a date-only value. */
export function weekdayShort(input: string | Date, locale?: string): string {
  const iso = typeof input === "string" ? input : input.toISOString();
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  // Fixed timezone + locale so server and browser render the same label.
  return new Intl.DateTimeFormat(intlLocale(locale), { weekday: "short", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

/** Today as "YYYY-MM-DD" in the academy's timezone. */
export function todayIso(): string {
  const { year, month, day } = academyToday();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
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

/**
 * Normalises a phone number to the international digits wa.me expects.
 *   "+961 70 123 456" / "00961 70…" → already international, kept as is
 *   "961 70 123 456"                → already has the country code
 *   "03 123 456" / "70 123 456"     → local: country code + number without leading 0
 */
export function toInternationalPhone(phone: string, countryCode: string): string | null {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  if (trimmed.startsWith("+")) return digits;
  if (digits.startsWith("00")) return digits.slice(2);
  // Has the country code already, and is long enough to be a full number.
  if (digits.startsWith(countryCode) && digits.length >= countryCode.length + 7) return digits;
  return `${countryCode}${digits.replace(/^0+/, "")}`;
}

/** Builds a wa.me reminder URL for an unpaid student. */
export function whatsappReminderUrl(opts: {
  phoneNumber: string;
  studentName: string;
  /** The amount the message asks for. Must cover exactly the month(s) named. */
  amount: number | string;
  /** The month the reminder is for — or, when several are owed, all of them. */
  month: number;
  year: number;
  months?: { month: number; year: number }[];
  academyName: string;
  countryCode: string;
  /** Custom template override. Falls back to DEFAULT_WHATSAPP_TEMPLATE if null/empty. */
  template?: string | null;
}): string | null {
  const intl = toInternationalPhone(opts.phoneNumber, opts.countryCode);
  if (!intl) return null;
  // Trim values that go inside *…* — WhatsApp won't bold a string that has a
  // space right before the closing asterisk.
  const amount = (
    typeof opts.amount === "string" ? opts.amount : opts.amount.toFixed(2)
  ).trim();
  const academy = opts.academyName.trim();
  const student = opts.studentName.trim();
  // Several months owed → name all of them ("آب، أيلول، تشرين الأول"), so the
  // month(s) and the amount in the message always describe the same debt.
  const owed = opts.months && opts.months.length > 0 ? opts.months : [{ month: opts.month, year: opts.year }];
  const multiYear = new Set(owed.map((m) => m.year)).size > 1;
  const arabicMonth = owed
    .map((m) => `${ARABIC_MONTH_NAMES[m.month - 1]}${multiYear ? ` ${m.year}` : ""}`)
    .join("، ");

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

/**
 * Default WhatsApp receipt template (Arabic). Placeholders:
 *   {student}   student full name
 *   {amount}    amount just received (e.g. "30.00")
 *   {item}      what it was for ("اشتراك شهر تشرين الثاني 2026" / "بدلة رياضية (M)")
 *   {remaining} a line saying what's left — or that it's fully paid
 *   {date}      day the money was received
 *   {academy}   academy name
 */
export const DEFAULT_RECEIPT_TEMPLATE = `مرحبا،
وصلنا مبلغ *{amount}$* عن {item} لـ {student}.
{remaining}

شكراً لكم 🙏
*{academy}*`;

/** Builds a wa.me link with a payment receipt for the parent. */
export function whatsappReceiptUrl(opts: {
  phoneNumber: string;
  countryCode: string;
  studentName: string;
  academyName: string;
  /** Amount just received. */
  amount: number;
  /** What's still owed on this invoice / uniform after this payment. */
  remaining: number;
  /** YYYY-MM-DD (or ISO) of the payment. */
  date: string;
  item: { kind: "FEE"; month: number; year: number } | { kind: "UNIFORM"; size?: string | null };
  template?: string | null;
}): string | null {
  const intl = toInternationalPhone(opts.phoneNumber, opts.countryCode);
  if (!intl) return null;
  const item =
    opts.item.kind === "FEE"
      ? `اشتراك شهر ${ARABIC_MONTH_NAMES[opts.item.month - 1]} ${opts.item.year}`
      : `بدلة رياضية${opts.item.size ? ` (${opts.item.size})` : ""}`;
  const remaining =
    opts.remaining > 0.004
      ? `المبلغ المتبقي: *${opts.remaining.toFixed(2)}$*`
      : "تم الدفع بالكامل ✅";
  const [y, m, d] = opts.date.slice(0, 10).split("-");
  const template =
    opts.template && opts.template.trim().length > 0 ? opts.template : DEFAULT_RECEIPT_TEMPLATE;
  const message = applyTemplate(template, {
    student: opts.studentName.trim(),
    amount: opts.amount.toFixed(2),
    item,
    remaining,
    date: `${d}/${m}/${y}`,
    academy: opts.academyName.trim(),
  });
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

/**
 * A wa.me link with no recipient: WhatsApp asks who to send it to (e.g. the
 * team's group chat). Used for "session cancelled" notices.
 */
export function whatsappShareUrl(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
