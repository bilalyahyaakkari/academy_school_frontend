"use server";

import { revalidatePath } from "next/cache";
import { studentsApi } from "@/lib/api/students";
import { groupsApi } from "@/lib/api/groups";
import { ApiError } from "@/lib/api/client";
import { parseCsvWithHeaders } from "@/lib/csv";
import { parseXlsxWithHeaders, looksLikeXlsx } from "@/lib/xlsx";
import { normalizeArabic } from "@/lib/arabic";

export type ImportResult =
  | {
      success: true;
      created: number;
      failed: number;
      errors: { row: number; fullName: string; error: string }[];
    }
  | { success: false; error: string };

const COLUMN_ALIASES: Record<string, string[]> = {
  fullName: ["full name", "fullname", "name", "student"],
  birthYear: [
    "year of birth",
    "birth year",
    "birthyear",
    "yearofbirth",
    "year",
    // Back-compat with files that still have a full date column.
    "date of birth",
    "dob",
    "birth date",
    "birthdate",
    "dateofbirth",
  ],
  parentPhone: ["parent phone", "phone", "phone number", "phonenumber", "parentphone"],
  group: ["group", "group name", "groupname"],
  isActive: ["status", "active", "isactive"],
  monthlyFeeOverride: [
    "monthly fee (override)",
    "monthly fee override",
    "monthlyfee",
    "monthly fee",
    "fee",
    "monthlyfeeoverride",
  ],
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
  if (input == null || input === "") return true;
  const s = input.toLowerCase().trim();
  if (["false", "0", "no", "n", "inactive"].includes(s)) return false;
  return true;
}

function parseNumber(input: string | undefined): number | null {
  if (input == null || input.trim() === "") return null;
  const n = Number(input);
  return Number.isFinite(n) ? n : null;
}

export async function importStudents(formData: FormData): Promise<ImportResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "No file selected." };
  }

  // Sniff the first 2 bytes to decide xlsx vs csv (extension can lie). xlsx
  // is a ZIP container — magic bytes "PK". Anything else is treated as text.
  const buffer = await file.arrayBuffer();
  const firstBytes = new Uint8Array(buffer.slice(0, 2));
  const isXlsx = looksLikeXlsx(firstBytes) ||
    file.name.toLowerCase().endsWith(".xlsx");

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

  // Sanity check: if NONE of the required columns are recognized, the file is
  // probably an .xlsx (binary), uses an unknown delimiter we couldn't detect,
  // or has headers in a language/spelling we don't have aliases for.
  const headerKeys = Object.keys(raw[0]);
  const recognized = ["fullName", "birthYear"].some((c) =>
    headerKeys.some((k) => COLUMN_ALIASES[c].includes(k.toLowerCase())),
  );
  if (!recognized) {
    return {
      success: false,
      error:
        `The column headers weren't recognized. Found: [${headerKeys.join(", ")}]. ` +
        `Expected at least one of: Full name, Year of birth. ` +
        `Tip: download the template for the exact column names.`,
    };
  }

  // Resolve group names → group IDs.
  const groups = await groupsApi.list().catch(() => []);
  const byName = new Map(groups.map((g) => [normalizeArabic(g.name), g.id]));

  const students: unknown[] = [];
  const localErrors: { row: number; fullName: string; error: string }[] = [];

  raw.forEach((row, i) => {
    const rowNum = i + 2; // header row is 1
    const fullName = (findCol(row, "fullName") ?? "").trim();
    const birthRaw = (findCol(row, "birthYear") ?? "").trim();

    if (!fullName || !birthRaw) {
      localErrors.push({
        row: rowNum,
        fullName: fullName || "(blank)",
        error: "Missing required field (fullName, birthYear)",
      });
      return;
    }

    // Accept either a 4-digit year or a full ISO date.
    let dateOfBirth: string;
    if (/^\d{4}$/.test(birthRaw)) {
      dateOfBirth = `${birthRaw}-01-01`;
    } else if (/^\d{4}-\d{2}-\d{2}/.test(birthRaw)) {
      dateOfBirth = birthRaw.slice(0, 10);
    } else {
      localErrors.push({
        row: rowNum,
        fullName,
        error: `Invalid year of birth: "${birthRaw}" (expected YYYY)`,
      });
      return;
    }

    const groupNameRaw = (findCol(row, "group") ?? "").trim();
    let groupId: string | null = null;
    if (groupNameRaw) {
      const id = byName.get(normalizeArabic(groupNameRaw));
      if (!id) {
        localErrors.push({
          row: rowNum,
          fullName,
          error: `Group "${groupNameRaw}" not found — create it first or leave blank`,
        });
        return;
      }
      groupId = id;
    }

    students.push({
      fullName,
      dateOfBirth,
      phoneNumber: findCol(row, "parentPhone") || undefined,
      groupId,
      isActive: parseBoolean(findCol(row, "isActive")),
      monthlyFee: parseNumber(findCol(row, "monthlyFeeOverride")),
      notes: findCol(row, "notes") || undefined,
    });
  });

  if (students.length === 0) {
    return {
      success: true,
      created: 0,
      failed: localErrors.length,
      errors: localErrors,
    };
  }

  let serverResult: { created: number; failed: number; errors: { row: number; fullName: string; error: string }[] };
  try {
    serverResult = await studentsApi.importMany(students);
  } catch (err) {
    return {
      success: false,
      error: err instanceof ApiError ? err.message : "Import request failed",
    };
  }

  revalidatePath("/students");
  revalidatePath("/dashboard");

  return {
    success: true,
    created: serverResult.created,
    failed: localErrors.length + serverResult.failed,
    // Server errors are 1-indexed in *its* batch; rebase to user's CSV row numbers.
    // Since we filtered local errors out, the i-th valid student maps to a user row.
    errors: [...localErrors, ...serverResult.errors],
  };
}
