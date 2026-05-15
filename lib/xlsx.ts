import * as XLSX from "xlsx";

/**
 * Parse the first sheet of an .xlsx file (as ArrayBuffer) into the same shape
 * `parseCsvWithHeaders` produces: an array of objects keyed by the first-row
 * header labels.
 *
 * Empty rows are skipped. Date cells are formatted as strings ("2015-03-21")
 * so downstream code can treat them like CSV strings.
 */
export function parseXlsxWithHeaders(buffer: ArrayBuffer): Record<string, string>[] {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) return [];
  const sheet = wb.Sheets[firstSheetName];

  // header: 1 → array-of-arrays. raw: false → values as formatted strings.
  // defval: "" → blank cells become "" instead of being omitted.
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: false,
  });

  if (aoa.length === 0) return [];

  const [headerRow, ...bodyRows] = aoa;
  const headers = headerRow.map((h) => String(h ?? "").trim());

  return bodyRows
    .filter((row) => row.some((cell) => String(cell ?? "").trim() !== ""))
    .map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        const cell = row[i];
        let value: string;
        if (cell instanceof Date) {
          // Excel-stored dates → ISO `YYYY-MM-DD`.
          value = cell.toISOString().slice(0, 10);
        } else if (cell == null) {
          value = "";
        } else {
          value = String(cell).trim();
        }
        obj[h] = value;
      });
      return obj;
    });
}

/** Quick sniff: does the file's start match the .xlsx (ZIP) magic bytes "PK"? */
export function looksLikeXlsx(firstBytes: Uint8Array): boolean {
  return firstBytes.length >= 2 && firstBytes[0] === 0x50 && firstBytes[1] === 0x4b;
}
