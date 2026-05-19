"use server";

import { revalidatePath } from "next/cache";
import { uniformsApi } from "@/lib/api/uniforms";
import { studentsApi } from "@/lib/api/students";
import { ApiError } from "@/lib/api/client";
import { parseCsvWithHeaders } from "@/lib/csv";
import { parseXlsxWithHeaders, looksLikeXlsx } from "@/lib/xlsx";
import { normalizeArabic } from "@/lib/arabic";

export type ImportUniformsResult =
  | {
      success: true;
      created: number;
      failed: number;
      errors: { row: number; studentName: string; error: string }[];
    }
  | { success: false; error: string };

const COLUMN_ALIASES: Record<string, string[]> = {
  studentName: [
    "student",
    "student name",
    "studentname",
    "full name",
    "fullname",
    "name",
  ],
  size: ["size", "uniform size", "uniformsize"],
  price: ["price", "amount", "cost"],
  isPaid: ["paid", "is paid", "ispaid", "status", "payment status"],
  notes: ["notes", "note", "comment", "comments"],
};

function findCol(row: Record<string, string>, canonical: string): string | undefined {
  const aliases = COLUMN_ALIASES[canonical] ?? [canonical.toLowerCase()];
  for (const key of Object.keys(row)) {
    if (aliases.includes(key.toLowerCase())) return row[key];
  }
  return undefined;
}

function parseBoolean(input: string | undefined): boolean {
  if (input == null || input.trim() === "") return false;
  const s = input.toLowerCase().trim();
  return ["true", "1", "yes", "y", "paid"].includes(s);
}

function parseNumber(input: string | undefined): number | null {
  if (input == null || input.trim() === "") return null;
  const n = Number(input);
  return Number.isFinite(n) ? n : null;
}

export async function importUniforms(
  formData: FormData,
): Promise<ImportUniformsResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "No file selected." };
  }

  const buffer = await file.arrayBuffer();
  const firstBytes = new Uint8Array(buffer.slice(0, 2));
  const isXlsx =
    looksLikeXlsx(firstBytes) || file.name.toLowerCase().endsWith(".xlsx");

  let raw: Record<string, string>[];
  try {
    if (isXlsx) {
      raw = parseXlsxWithHeaders(buffer);
    } else {
      const text = new TextDecoder("utf-8").decode(buffer);
      raw = parseCsvWithHeaders(text);
    }
  } catch {
    return {
      success: false,
      error: isXlsx
        ? "Could not parse the Excel file. Re-save it from Excel and try again."
        : "Could not parse the CSV file.",
    };
  }
  if (raw.length === 0) {
    return { success: false, error: "The file is empty (or has only headers)." };
  }

  const headerKeys = Object.keys(raw[0]);
  const recognized = ["studentName", "size", "price"].some((c) =>
    headerKeys.some((k) => COLUMN_ALIASES[c].includes(k.toLowerCase())),
  );
  if (!recognized) {
    return {
      success: false,
      error:
        `The column headers weren't recognized. Found: [${headerKeys.join(", ")}]. ` +
        `Expected at least one of: Student, Size, Price. ` +
        `Tip: download the template for the exact column names.`,
    };
  }

  // Resolve student full names → IDs. Match on an Arabic-normalized key so
  // visually-identical names with different Unicode shapes (alif variants,
  // taa marbuta vs haa, stray diacritics, etc.) still resolve.
  const allStudents = await studentsApi.list({}).catch(() => []);
  const byName = new Map(
    allStudents.map((s) => [normalizeArabic(s.fullName), s.id]),
  );

  const uniforms: unknown[] = [];
  const localErrors: { row: number; studentName: string; error: string }[] = [];

  raw.forEach((row, i) => {
    const rowNum = i + 2; // header row is 1
    const studentName = (findCol(row, "studentName") ?? "").trim();
    const sizeRaw = (findCol(row, "size") ?? "").trim();
    const priceRaw = (findCol(row, "price") ?? "").trim();

    if (!studentName || !sizeRaw || !priceRaw) {
      localErrors.push({
        row: rowNum,
        studentName: studentName || "(blank)",
        error: "Missing required field (student, size, price)",
      });
      return;
    }

    if (sizeRaw.length > 20) {
      localErrors.push({
        row: rowNum,
        studentName,
        error: `Size "${sizeRaw}" is longer than 20 characters`,
      });
      return;
    }

    const price = parseNumber(priceRaw);
    if (price === null || price < 0) {
      localErrors.push({
        row: rowNum,
        studentName,
        error: `Invalid price: "${priceRaw}"`,
      });
      return;
    }

    const studentId = byName.get(normalizeArabic(studentName));
    if (!studentId) {
      localErrors.push({
        row: rowNum,
        studentName,
        error: `Student "${studentName}" not found — add them first or fix the name`,
      });
      return;
    }

    uniforms.push({
      studentId,
      size: sizeRaw,
      price,
      isPaid: parseBoolean(findCol(row, "isPaid")),
      notes: findCol(row, "notes") || undefined,
    });
  });

  if (uniforms.length === 0) {
    return {
      success: true,
      created: 0,
      failed: localErrors.length,
      errors: localErrors,
    };
  }

  // Build a lookup so we can attach a human-friendly name to server-side errors,
  // which only return studentId.
  const idToName = new Map(allStudents.map((s) => [s.id, s.fullName]));

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
      error: err instanceof ApiError ? err.message : "Import request failed",
    };
  }

  revalidatePath("/uniforms");

  return {
    success: true,
    created: serverResult.created,
    failed: localErrors.length + serverResult.failed,
    errors: [
      ...localErrors,
      ...serverResult.errors.map((e) => ({
        row: e.row,
        studentName: idToName.get(e.studentId) ?? e.studentId,
        error: e.error,
      })),
    ],
  };
}
