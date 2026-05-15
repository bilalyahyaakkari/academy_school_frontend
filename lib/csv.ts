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
 * Parse CSV text into rows of cells. The delimiter is auto-detected from the
 * first non-empty line unless explicitly passed.
 */
export function parseCsv(text: string, delimiter?: "," | ";" | "\t"): string[][] {
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const sep = delimiter ?? detectDelimiter(text);

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

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
      row.push(cell);
      if (row.some((v) => v !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += c;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    if (row.some((v) => v !== "")) rows.push(row);
  }
  return rows;
}

/** Parse CSV with first-row headers into an array of objects. */
export function parseCsvWithHeaders(text: string): Record<string, string>[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const [header, ...body] = rows;
  const headers = header.map((h) => h.trim());
  return body.map((cells) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (cells[i] ?? "").trim();
    });
    return obj;
  });
}
