import * as XLSX from "xlsx";

/**
 * Converts one raw worksheet cell to the string a CSV cell would hold.
 *
 * We read the cell's *raw* value, never its formatted text (`raw: false`),
 * because Excel's display format loses data:
 *   - a 12+ digit phone stored as a number displays as "9.63912E+11"
 *   - a date displays as "3/21/15"
 *   - a "#,##0.00" number displays as "1,234.50"
 *
 * Rules:
 *   - numbers   → plain digits ("963912345678", "1234.5"): no exponent, no
 *                 thousands separators
 *   - real dates (a number with a date format) → "YYYY-MM-DD", decoded from
 *                 the serial itself, so the host timezone can't shift the day
 *   - booleans  → "true" / "false"
 *   - text      → the text, trimmed
 *   - errors / blanks → ""
 */
export function cellToString(cell: XLSX.CellObject | undefined, date1904 = false): string {
  if (!cell || cell.v == null) return "";
  switch (cell.t) {
    case "s":
      return String(cell.v).trim();
    case "b":
      return cell.v ? "true" : "false";
    case "d": {
      // Only produced with `cellDates: true`; handled for safety. Read the UTC
      // parts: SheetJS builds these at UTC midnight for date-only cells.
      const d = cell.v instanceof Date ? cell.v : new Date(String(cell.v));
      if (Number.isNaN(d.getTime())) return "";
      return isoDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
    }
    case "n": {
      const n = Number(cell.v);
      if (!Number.isFinite(n)) return "";
      if (cell.z != null && XLSX.SSF.is_date(cell.z)) {
        const p = XLSX.SSF.parse_date_code(n, { date1904 });
        if (p && p.y) return isoDate(p.y, p.m, p.d);
      }
      return plainNumber(n);
    }
    case "e":
    case "z":
    default:
      return "";
  }
}

function isoDate(y: number, m: number, d: number): string {
  const pad = (v: number) => String(v).padStart(2, "0");
  return `${String(y).padStart(4, "0")}-${pad(m)}-${pad(d)}`;
}

/** A number as plain decimal digits — never "1.2E+11", never "1,234". */
export function plainNumber(n: number): string {
  if (Number.isInteger(n)) {
    return Math.abs(n) <= Number.MAX_SAFE_INTEGER
      ? String(n)
      : BigInt(Math.round(n)).toString();
  }
  // Excel keeps 15 significant digits; dropping float noise (0.1 + 0.2).
  const clean = Number(n.toPrecision(15));
  const s = String(clean);
  if (!/e/i.test(s)) return s;
  // Tiny values ("1e-7") — expand without the exponent.
  return clean.toFixed(20).replace(/\.?0+$/, "");
}

export type XlsxRow = {
  /** 1-based row number as Excel shows it. */
  row: number;
  data: Record<string, string>;
};

/**
 * Parse the first sheet of an .xlsx file into rows keyed by the header labels,
 * each tagged with its real spreadsheet row number (for error messages).
 *
 * The header is the first non-blank row; blank rows after it are skipped.
 */
export function parseXlsxRows(buffer: ArrayBuffer): { headers: string[]; rows: XlsxRow[] } {
  // cellNF: keep each cell's number format, so date cells can be recognised.
  // cellDates: false → dates stay as serial numbers we decode ourselves.
  const wb = XLSX.read(buffer, { type: "array", cellNF: true, cellDates: false });
  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) return { headers: [], rows: [] };
  const sheet = wb.Sheets[firstSheetName];
  const ref = sheet?.["!ref"];
  if (!ref) return { headers: [], rows: [] };

  const date1904 = !!wb.Workbook?.WBProps?.date1904;
  const range = XLSX.utils.decode_range(ref);

  let headers: string[] | null = null;
  const rows: XlsxRow[] = [];

  for (let r = range.s.r; r <= range.e.r; r++) {
    const cells: string[] = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r, c })] as XLSX.CellObject | undefined;
      cells.push(cellToString(cell, date1904));
    }
    if (!cells.some((v) => v !== "")) continue; // blank row

    if (headers === null) {
      headers = cells;
      continue;
    }
    const data: Record<string, string> = {};
    headers.forEach((h, i) => {
      data[h] = cells[i] ?? "";
    });
    rows.push({ row: r + 1, data });
  }

  return { headers: headers ?? [], rows };
}

/**
 * Parse the first sheet of an .xlsx file (as ArrayBuffer) into the same shape
 * `parseCsvWithHeaders` produces: an array of objects keyed by the first-row
 * header labels. Empty rows are skipped. See `cellToString` for how cell
 * values are turned into strings (dates → "YYYY-MM-DD", numbers → digits).
 */
export function parseXlsxWithHeaders(buffer: ArrayBuffer): Record<string, string>[] {
  return parseXlsxRows(buffer).rows.map((r) => r.data);
}

/** Quick sniff: does the file's start match the .xlsx (ZIP) magic bytes "PK"? */
export function looksLikeXlsx(firstBytes: Uint8Array): boolean {
  return firstBytes.length >= 2 && firstBytes[0] === 0x50 && firstBytes[1] === 0x4b;
}
