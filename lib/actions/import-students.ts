"use server";

import { revalidatePath } from "next/cache";
import { studentsApi } from "@/lib/api/students";
import { groupsApi } from "@/lib/api/groups";
import { ApiError } from "@/lib/api/client";
import { parseCsvRows } from "@/lib/csv";
import { parseXlsxRows, looksLikeXlsx } from "@/lib/xlsx";
import { normalizeArabic } from "@/lib/arabic";
import { birthYear, currentYearMonth } from "@/lib/utils";
import { getT } from "@/lib/i18n/server";

export type ImportRowError = { row: number; fullName: string; error: string };

export type ImportResult =
  | {
      success: true;
      created: number;
      failed: number;
      errors: ImportRowError[];
    }
  | { success: false; error: string };

// Limits mirrored from the backend's Zod `studentSchema` / `importStudentsSchema`.
// The backend validates the whole batch at once, so a single row breaking one
// of these would reject every row — we catch them here and report that row.
const MAX_ROWS = 2000;
const NAME_MIN = 2;
const NAME_MAX = 120;
const SCHOOL_MAX = 120;
const ADDRESS_MAX = 300;
const FEE_MAX = 1_000_000;

type Canonical =
  | "fullName"
  | "birthYear"
  | "parentPhone"
  | "group"
  | "school"
  | "address"
  | "monthlyFeeOverride"
  | "notes";

// Header aliases, compared after `normalizeHeader`. Any "Status" / "Active"
// column is deliberately not listed: the active/inactive concept is gone and
// such a column is ignored.
const COLUMN_ALIASES: Record<Canonical, string[]> = {
  fullName: ["full name", "fullname", "name", "student", "student name", "الاسم", "الاسم الكامل", "اسم التلميذ", "اسم الطالب"],
  birthYear: [
    "year of birth",
    "birth year",
    "birthyear",
    "yearofbirth",
    "year",
    // Files with a full date column.
    "date of birth",
    "dob",
    "birth date",
    "birthdate",
    "dateofbirth",
    "سنة الولادة",
    "تاريخ الولادة",
    "المواليد",
  ],
  parentPhone: ["parent phone", "phone", "phone number", "phonenumber", "parentphone", "mobile", "الهاتف", "رقم الهاتف", "رقم الأهل", "التلفون"],
  group: ["group", "group name", "groupname", "المجموعة", "الفريق"],
  school: ["school", "المدرسة"],
  address: ["address", "العنوان"],
  monthlyFeeOverride: [
    "monthly fee (override)",
    "monthly fee override",
    "monthlyfee",
    "monthly fee",
    "fee",
    "monthlyfeeoverride",
    "القسط",
    "القسط الشهري",
    "القسط الشهري (خاص)",
  ],
  notes: ["notes", "note", "comment", "comments", "ملاحظات", "ملاحظة"],
};

function normalizeHeader(h: string): string {
  return normalizeArabic(h).replace(/\s*\(\s*/g, " (").replace(/\s*\)\s*/g, ")").trim();
}

/** Maps each canonical field to the header actually used in the file. */
function resolveColumns(headers: string[]): Partial<Record<Canonical, string>> {
  const out: Partial<Record<Canonical, string>> = {};
  for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES) as [Canonical, string[]][]) {
    const wanted = new Set(aliases.map(normalizeHeader));
    const hit = headers.find((h) => wanted.has(normalizeHeader(h)));
    if (hit !== undefined) out[canonical] = hit;
  }
  return out;
}

/** Arabic-Indic / Persian digits and separators → ASCII. */
function asciiDigits(s: string): string {
  return s
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, ".")
    .replace(/٬/g, ",");
}

const CURRENCY_RE = /us\$|usd|dollars?|lbp|syp|eur|l\.\s?l\.?|دولار|ليرة|ل\.\s?ل\.?|[$€£¥﷼]/gi;

/**
 * Parses a fee cell. Accepts "50", "50$", "$ 50", "37.5", "37,5" (comma
 * decimal), "1,234.50" and "1.234,50". Anything else is an error — a fee is
 * never silently dropped (blank = inherit is the only "no value").
 */
function parseFee(raw: string): { ok: true; value: number | null } | { ok: false } {
  let s = asciiDigits(raw.trim());
  if (s === "") return { ok: true, value: null };
  s = s.replace(CURRENCY_RE, "").replace(/[\s  ']/g, "");
  if (s === "") return { ok: false };

  let normalized: string | null = null;
  if (/^\d+$/.test(s)) normalized = s;
  // 1,234 / 1,234.50 — comma as thousands separator.
  else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) normalized = s.replace(/,/g, "");
  // 1.234,50 — dot thousands, comma decimal.
  else if (/^\d{1,3}(\.\d{3})+,\d+$/.test(s)) normalized = s.replace(/\./g, "").replace(",", ".");
  // 37.5 / 37,5 / .5
  else if (/^\d*[.,]\d+$/.test(s)) normalized = s.replace(",", ".");

  if (normalized === null) return { ok: false };
  const n = Number(normalized);
  return Number.isFinite(n) ? { ok: true, value: n } : { ok: false };
}

/**
 * Parses the birth cell: a 4-digit year, an ISO date (what the Excel reader
 * produces for real date cells), or a day-first D/M/YYYY text date.
 * Returns null when it isn't a real calendar date.
 */
function parseBirth(raw: string): { iso: string; year: number } | null {
  const s = asciiDigits(raw.trim());
  let y: number, m: number, d: number;
  let match: RegExpMatchArray | null;
  if (/^\d{4}$/.test(s)) {
    y = Number(s);
    m = 1;
    d = 1;
  } else if ((match = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ].*)?$/))) {
    y = Number(match[1]);
    m = Number(match[2]);
    d = Number(match[3]);
  } else if ((match = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/))) {
    const a = Number(match[1]);
    const b = Number(match[2]);
    y = Number(match[3]);
    // Day-first (the local convention) unless that's impossible.
    if (b > 12 && a <= 12) {
      m = a;
      d = b;
    } else {
      d = a;
      m = b;
    }
  } else {
    return null;
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return { iso: `${y}-${pad(m)}-${pad(d)}`, year: y };
}

/**
 * Decodes a CSV upload. Excel saves "CSV UTF-8" as UTF-8, but a plain "CSV"
 * from an Arabic Windows install is windows-1256 — decoding that as UTF-8
 * would turn every Arabic name into "�". Strict UTF-8 first, then fall back.
 */
function decodeText(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder("utf-16le").decode(buffer);
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder("utf-16be").decode(buffer);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1256").decode(buffer);
  }
}

const dupKey = (fullName: string, year: number | string) =>
  `${normalizeArabic(fullName)}|${year}`;

export async function importStudents(formData: FormData): Promise<ImportResult> {
  const t = await getT();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: t("students.import.err.noFile") };
  }

  // Sniff the first 2 bytes to decide xlsx vs csv (extension can lie). xlsx
  // is a ZIP container — magic bytes "PK". Anything else is treated as text.
  const buffer = await file.arrayBuffer();
  const firstBytes = new Uint8Array(buffer.slice(0, 2));
  const isXlsx = looksLikeXlsx(firstBytes) || file.name.toLowerCase().endsWith(".xlsx");

  let headers: string[];
  let rows: { row: number; data: Record<string, string> }[];
  try {
    ({ headers, rows } = isXlsx ? parseXlsxRows(buffer) : parseCsvRows(decodeText(buffer)));
  } catch {
    return {
      success: false,
      error: isXlsx ? t("students.import.err.parseXlsx") : t("students.import.err.parseCsv"),
    };
  }
  if (rows.length === 0) {
    return { success: false, error: t("students.import.err.empty") };
  }
  if (rows.length > MAX_ROWS) {
    return {
      success: false,
      error: t("students.import.err.tooMany", { count: rows.length, max: MAX_ROWS }),
    };
  }

  // Sanity check: if NONE of the required columns are recognized, the file
  // uses an unknown delimiter or headers we don't have aliases for.
  const cols = resolveColumns(headers);
  if (!cols.fullName && !cols.birthYear) {
    return {
      success: false,
      error: t("students.import.err.headers", { found: headers.join(", ") }),
    };
  }
  const get = (data: Record<string, string>, c: Canonical) => {
    const key = cols[c];
    return key === undefined ? "" : (data[key] ?? "").trim();
  };

  // Resolve group names → group IDs, and load every existing student
  // (including those who left) to catch duplicates. If that list can't be
  // loaded we stop: importing blind is how doubles get created.
  let groups: Awaited<ReturnType<typeof groupsApi.list>>;
  let existing: Awaited<ReturnType<typeof studentsApi.list>>;
  try {
    [groups, existing] = await Promise.all([
      groupsApi.list(),
      studentsApi.list({ archived: "include" }),
    ]);
  } catch (err) {
    return {
      success: false,
      error: err instanceof ApiError ? err.message : t("students.import.err.existing"),
    };
  }
  const groupByName = new Map(groups.map((g) => [normalizeArabic(g.name), g.id]));
  const existingByKey = new Map<string, { archived: boolean }>();
  for (const s of existing) {
    existingByKey.set(dupKey(s.fullName, birthYear(s.dateOfBirth)), { archived: s.archived });
  }

  const maxYear = currentYearMonth().year;
  const students: Record<string, unknown>[] = [];
  /** fileRows[i] = the user's row number for students[i]. */
  const fileRows: number[] = [];
  const seenInFile = new Map<string, number>();
  const errors: ImportRowError[] = [];

  for (const { row, data } of rows) {
    const fullName = get(data, "fullName").replace(/\s+/g, " ");
    const birthRaw = get(data, "birthYear");
    const fail = (error: string) => errors.push({ row, fullName: fullName || "—", error });

    if (!fullName || !birthRaw) {
      fail(t("students.import.err.missing"));
      continue;
    }
    if (fullName.length < NAME_MIN || fullName.length > NAME_MAX) {
      fail(t("students.import.err.nameLength"));
      continue;
    }

    const birth = parseBirth(birthRaw);
    if (!birth) {
      fail(t("students.import.err.birth", { value: birthRaw }));
      continue;
    }
    if (birth.year < 1900 || birth.year > maxYear) {
      fail(t("students.import.err.birthRange", { year: birth.year, max: maxYear }));
      continue;
    }

    const groupNameRaw = get(data, "group");
    let groupId: string | null = null;
    if (groupNameRaw) {
      const id = groupByName.get(normalizeArabic(groupNameRaw));
      if (!id) {
        fail(t("students.import.err.group", { group: groupNameRaw }));
        continue;
      }
      groupId = id;
    }

    const feeRaw = get(data, "monthlyFeeOverride");
    const fee = parseFee(feeRaw);
    if (!fee.ok) {
      fail(t("students.import.err.fee", { value: feeRaw }));
      continue;
    }
    if (fee.value !== null && (fee.value < 0 || fee.value > FEE_MAX)) {
      fail(t("students.import.err.feeRange"));
      continue;
    }

    const school = get(data, "school");
    if (school.length > SCHOOL_MAX) {
      fail(t("students.import.err.tooLong", { field: cols.school ?? "School", max: SCHOOL_MAX }));
      continue;
    }
    const address = get(data, "address");
    if (address.length > ADDRESS_MAX) {
      fail(t("students.import.err.tooLong", { field: cols.address ?? "Address", max: ADDRESS_MAX }));
      continue;
    }

    // Duplicates: same normalized name + birth year, within the file or
    // against students already in the academy.
    const key = dupKey(fullName, birth.year);
    const firstRow = seenInFile.get(key);
    if (firstRow !== undefined) {
      fail(t("students.import.err.dupFile", { row: firstRow }));
      continue;
    }
    const match = existingByKey.get(key);
    if (match) {
      fail(
        match.archived
          ? t("students.import.err.dupExistingLeft")
          : t("students.import.err.dupExisting"),
      );
      continue;
    }
    seenInFile.set(key, row);

    students.push({
      fullName,
      dateOfBirth: birth.iso,
      phoneNumber: get(data, "parentPhone") || undefined,
      groupId,
      school: school || null,
      address: address || null,
      monthlyFee: fee.value,
      notes: get(data, "notes") || undefined,
    });
    fileRows.push(row);
  }

  if (students.length === 0) {
    return { success: true, created: 0, failed: errors.length, errors };
  }

  let serverResult: { created: number; failed: number; errors: ImportRowError[] };
  try {
    serverResult = await studentsApi.importMany(students);
  } catch (err) {
    return {
      success: false,
      error: err instanceof ApiError ? err.message : t("students.import.err.request"),
    };
  }

  revalidatePath("/students");
  revalidatePath("/dashboard");
  revalidatePath("/roster");

  // The backend numbers rows within *its* batch (index + 2); map them back to
  // the row numbers in the user's file.
  const serverErrors = serverResult.errors.map((e) => ({
    ...e,
    row: fileRows[e.row - 2] ?? e.row,
  }));

  const allErrors = [...errors, ...serverErrors].sort((a, b) => a.row - b.row);
  return {
    success: true,
    created: serverResult.created,
    failed: allErrors.length,
    errors: allErrors,
  };
}
