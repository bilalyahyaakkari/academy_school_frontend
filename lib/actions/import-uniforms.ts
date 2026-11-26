"use server";

import { revalidatePath } from "next/cache";
import { uniformsApi } from "@/lib/api/uniforms";
import { studentsApi } from "@/lib/api/students";
import { ApiError } from "@/lib/api/client";
import { parseCsvRows } from "@/lib/csv";
import { parseXlsxRows, looksLikeXlsx } from "@/lib/xlsx";
import { normalizeArabic } from "@/lib/arabic";
import { getT } from "@/lib/i18n/server";

export type ImportUniformsResult =
  | {
      success: true;
      created: number;
      failed: number;
      errors: { row: number; studentName: string; error: string }[];
    }
  | { success: false; error: string };

type Canonical = "studentName" | "size" | "price" | "isPaid" | "isReceived" | "notes";

/**
 * Accepted header names per column, compared after normalizeArabic (so case,
 * hamza/alif variants and taa marbuta don't matter). The Arabic ones match the
 * labels the Arabic import instructions show (`uniforms.import.col.*`).
 */
const COLUMN_ALIASES: Record<Canonical, string[]> = {
  studentName: [
    "student",
    "student name",
    "studentname",
    "full name",
    "fullname",
    "name",
    "الطالب",
    "طالب",
    "اسم الطالب",
    "الاسم",
    "الاسم الكامل",
    "التلميذ",
    "اسم التلميذ",
  ],
  size: ["size", "uniform size", "uniformsize", "المقاس", "مقاس", "القياس", "قياس"],
  price: ["price", "amount", "cost", "السعر", "سعر", "المبلغ", "الثمن"],
  isPaid: [
    "paid",
    "is paid",
    "ispaid",
    "status",
    "payment status",
    "مدفوع",
    "مدفوعة",
    "الدفع",
    "حالة الدفع",
    "دفع",
  ],
  isReceived: [
    "received",
    "is received",
    "isreceived",
    "delivered",
    "مستلم",
    "مستلمة",
    "الاستلام",
    "تم الاستلام",
    "استلم",
  ],
  notes: ["notes", "note", "comment", "comments", "ملاحظات", "ملاحظه", "ملاحظة"],
};

// Aliases pre-normalized the same way headers are.
const NORMALIZED_ALIASES: Record<Canonical, Set<string>> = Object.fromEntries(
  Object.entries(COLUMN_ALIASES).map(([k, list]) => [
    k,
    new Set(list.map((a) => normalizeArabic(a))),
  ]),
) as Record<Canonical, Set<string>>;

function isAlias(header: string, canonical: Canonical): boolean {
  return NORMALIZED_ALIASES[canonical].has(normalizeArabic(header));
}

function findCol(row: Record<string, string>, canonical: Canonical): string | undefined {
  for (const key of Object.keys(row)) {
    if (isAlias(key, canonical)) return row[key];
  }
  return undefined;
}

const TRUE_VALUES = new Set(
  ["true", "1", "yes", "y", "paid", "received", "نعم", "اي", "ايه", "إي", "إيه", "مدفوع", "مدفوعة", "مستلم", "تم"].map(
    (v) => normalizeArabic(v),
  ),
);

function parseBoolean(input: string | undefined): boolean {
  if (input == null || input.trim() === "") return false;
  return TRUE_VALUES.has(normalizeArabic(input));
}

/**
 * Accepts "50", "50.5", "1,250" (thousands separator), "50,5" (decimal comma)
 * and Arabic-Indic digits ("٥٠", "٧٫٥").
 */
function parseNumber(input: string | undefined): number | null {
  if (input == null) return null;
  let s = input
    .trim()
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/٫/g, ".")
    .replace(/٬/g, ",")
    .replace(/[$\s]/g, "");
  if (s === "") return null;
  if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) s = s.replace(/,/g, "");
  else if (/^\d+,\d+$/.test(s)) s = s.replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * Decode CSV bytes. Strict UTF-8 first; if the bytes aren't valid UTF-8 the
 * file was most likely saved by Excel on an Arabic Windows machine, i.e.
 * windows-1256, so fall back to that rather than showing mojibake.
 */
function decodeCsv(buffer: ArrayBuffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder("windows-1256").decode(buffer);
  }
}

export async function importUniforms(
  formData: FormData,
): Promise<ImportUniformsResult> {
  const t = await getT();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: t("uniforms.import.toast.noFile") };
  }

  const buffer = await file.arrayBuffer();
  const firstBytes = new Uint8Array(buffer.slice(0, 2));
  const isXlsx =
    looksLikeXlsx(firstBytes) || file.name.toLowerCase().endsWith(".xlsx");

  // Each row keeps its real line number in the file (blank lines included),
  // so error messages point at the row the user actually sees.
  let parsed: { row: number; data: Record<string, string> }[];
  try {
    parsed = (isXlsx ? parseXlsxRows(buffer) : parseCsvRows(decodeCsv(buffer))).rows;
  } catch {
    return {
      success: false,
      error: isXlsx
        ? t("uniforms.import.err.parseXlsx")
        : t("uniforms.import.err.parseCsv"),
    };
  }
  const raw = parsed.map((r) => r.data);
  if (raw.length === 0) {
    return { success: false, error: t("uniforms.import.err.empty") };
  }

  const headerKeys = Object.keys(raw[0]);
  const recognized = (["studentName", "size", "price"] as const).some((c) =>
    headerKeys.some((k) => isAlias(k, c)),
  );
  if (!recognized) {
    return {
      success: false,
      error: t("uniforms.import.err.headers", { found: headerKeys.join(", ") }),
    };
  }

  // Resolve student full names → IDs. Match on an Arabic-normalized key so
  // visually-identical names with different Unicode shapes (alif variants,
  // taa marbuta vs haa, stray diacritics, etc.) still resolve. Students who
  // left are included: a uniform can still be recorded for them.
  let allStudents: Awaited<ReturnType<typeof studentsApi.list>>;
  try {
    allStudents = await studentsApi.list({ archived: "include" });
  } catch (err) {
    return {
      success: false,
      error: err instanceof ApiError ? err.message : t("uniforms.import.err.request"),
    };
  }
  // Every id per normalized name — two students with the same name must not
  // silently get each other's orders.
  const byName = new Map<string, string[]>();
  for (const s of allStudents) {
    const key = normalizeArabic(s.fullName);
    const ids = byName.get(key);
    if (ids) ids.push(s.id);
    else byName.set(key, [s.id]);
  }

  const uniforms: {
    studentId: string;
    size: string;
    price: number;
    isPaid: boolean;
    paidAmount: number;
    isReceived: boolean;
    notes?: string;
  }[] = [];
  /** fileRows[i] = the spreadsheet row number uniforms[i] came from. */
  const fileRows: number[] = [];
  /** studentNames[i] = the name exactly as typed in the file. */
  const studentNames: string[] = [];
  const localErrors: { row: number; studentName: string; error: string }[] = [];

  raw.forEach((row, i) => {
    const rowNum = parsed[i].row;
    const studentName = (findCol(row, "studentName") ?? "").trim();
    const sizeRaw = (findCol(row, "size") ?? "").trim();
    const priceRaw = (findCol(row, "price") ?? "").trim();

    if (!studentName || !sizeRaw || !priceRaw) {
      localErrors.push({
        row: rowNum,
        studentName: studentName || t("uniforms.import.blank"),
        error: t("uniforms.import.err.missing"),
      });
      return;
    }

    if (sizeRaw.length > 20) {
      localErrors.push({
        row: rowNum,
        studentName,
        error: t("uniforms.import.err.sizeTooLong", { size: sizeRaw }),
      });
      return;
    }

    const price = parseNumber(priceRaw);
    if (price === null || price < 0) {
      localErrors.push({
        row: rowNum,
        studentName,
        error: t("uniforms.import.err.price", { price: priceRaw }),
      });
      return;
    }

    const matches = byName.get(normalizeArabic(studentName)) ?? [];
    if (matches.length === 0) {
      localErrors.push({
        row: rowNum,
        studentName,
        error: t("uniforms.import.err.notFound", { name: studentName }),
      });
      return;
    }
    if (matches.length > 1) {
      localErrors.push({
        row: rowNum,
        studentName,
        error: t("uniforms.import.err.ambiguous", {
          name: studentName,
          count: matches.length,
        }),
      });
      return;
    }

    const isPaid = parseBoolean(findCol(row, "isPaid"));
    uniforms.push({
      studentId: matches[0],
      size: sizeRaw,
      price,
      isPaid,
      // Explicit, so "paid" always means the full price is recorded.
      paidAmount: isPaid ? price : 0,
      isReceived: parseBoolean(findCol(row, "isReceived")),
      notes: findCol(row, "notes")?.trim() || undefined,
    });
    fileRows.push(rowNum);
    studentNames.push(studentName);
  });

  if (uniforms.length === 0) {
    return {
      success: true,
      created: 0,
      failed: localErrors.length,
      errors: localErrors,
    };
  }

  let serverResult: {
    created: number;
    failed: number;
    errors: { row: number; studentId: string; error: string }[];
  };
  try {
    serverResult = await uniformsApi.importMany(uniforms);
  } catch (err) {
    return {
      success: false,
      error: err instanceof ApiError ? err.message : t("uniforms.import.err.request"),
    };
  }

  revalidatePath("/uniforms");

  // The backend numbers rows by their position in the array we sent
  // (index + 2), which skips every row rejected above. Map them back to the
  // file's own row numbers.
  const serverErrors = serverResult.errors.map((e) => {
    const index = e.row - 2;
    const inRange = index >= 0 && index < fileRows.length;
    return {
      row: inRange ? fileRows[index] : e.row,
      studentName: inRange ? studentNames[index] : e.studentId,
      error: e.error,
    };
  });

  return {
    success: true,
    created: serverResult.created,
    failed: localErrors.length + serverResult.failed,
    errors: [...localErrors, ...serverErrors].sort((a, b) => a.row - b.row),
  };
}
