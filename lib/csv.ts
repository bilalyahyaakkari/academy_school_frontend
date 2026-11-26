/**
 * Minimal CSV helpers — no dependencies.
 * - Auto-detects `,`, `;`, or tab as the column separator.
 * - Handles quoted fields, embedded delimiters/newlines, escaped quotes ("").
 * - Strips a leading UTF-8 BOM and accepts CRLF or LF line endings.
 */

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv(rows: Record<string, unknown>[], headers: { key: string; label: string }[]): string {
  const lines: string[] = [];
  lines.push(headers.map((h) => escapeCell(h.label)).join(","));
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCell(row[h.key])).join(","));
  }
  // BOM so Excel auto-detects UTF-8 (important for Arabic names).
  return "﻿" + lines.join("\r\n");
}

/**
 * Pick the most likely column separator by counting candidates on the first
 * non-empty line (the header). Excel in Arabic/European locales saves CSV with
 * `;` because the comma is the decimal mark.
 */
function detectDelimiter(text: string): "," | ";" | "\t" {
  const firstLine = (text.match(/[^\r\n]+/) ?? [""])[0];
  const counts: Record<string, number> = {
    ",": (firstLine.match(/,/g) ?? []).length,
    ";": (firstLine.match(/;/g) ?? []).length,
    "\t": (firstLine.match(/\t/g) ?? []).length,
  };
  // Pick the highest-count delimiter, breaking ties in favor of comma.
  const ordered = (Object.entries(counts) as [string, number][]).sort(
    (a, b) => b[1] - a[1] || (a[0] === "," ? -1 : 1),
  );
  const [winner, winnerCount] = ordered[0];
  // If nothing was found on the header line, default to comma.
  if (winnerCount === 0) return ",";
  return winner as "," | ";" | "\t";
}

/**
 * Parse CSV text into records, each tagged with its 1-based record number as a
 * spreadsheet would show it (blank lines count, so the numbers match the row
 * numbers the user sees when opening the file in Excel). Blank records are
 * dropped from the result.
 */
function parseCsvRecords(
  text: string,
  delimiter?: "," | ";" | "\t",
): { row: number; cells: string[] }[] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const sep = delimiter ?? detectDelimiter(text);

  const rows: { row: number; cells: string[] }[] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  let recordNo = 1;

  const endRecord = () => {
    row.push(cell);
    if (row.some((v) => v !== "")) rows.push({ row: recordNo, cells: row });
    recordNo++;
    row = [];
    cell = "";
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += c;
      }
    } else if (c === '"' && cell === "") {
      inQuotes = true;
    } else if (c === sep) {
      row.push(cell);
      cell = "";
    } else if (c === "\r" || c === "\n") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      endRecord();
    } else {
      cell += c;
    }
  }
  if (cell !== "" || row.length > 0) endRecord();
  return rows;
}

/**
 * Parse CSV text into rows of cells. The delimiter is auto-detected from the
 * first non-empty line unless explicitly passed.
 */
export function parseCsv(text: string, delimiter?: "," | ";" | "\t"): string[][] {
  return parseCsvRecords(text, delimiter).map((r) => r.cells);
}

/**
 * Parse CSV with first-row headers into objects, each tagged with its row
 * number in the file (header = row 1 when the file starts with it).
 */
export function parseCsvRows(text: string): {
  headers: string[];
  rows: { row: number; data: Record<string, string> }[];
} {
  const records = parseCsvRecords(text);
  if (records.length === 0) return { headers: [], rows: [] };
  const [header, ...body] = records;
  const headers = header.cells.map((h) => h.trim());
  return {
    headers,
    rows: body.map(({ row, cells }) => {
      const data: Record<string, string> = {};
      headers.forEach((h, i) => {
        data[h] = (cells[i] ?? "").trim();
      });
      return { row, data };
    }),
  };
}

/** Parse CSV with first-row headers into an array of objects. */
export function parseCsvWithHeaders(text: string): Record<string, string>[] {
  return parseCsvRows(text).rows.map((r) => r.data);
}
