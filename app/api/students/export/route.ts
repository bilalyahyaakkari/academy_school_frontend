import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { auth } from "@/auth";
import { studentsApi } from "@/lib/api/students";
import { birthYear, currentYearMonth, todayIso } from "@/lib/utils";

/**
 * GET /api/students/export?q=&groupId=&archived=
 *
 * Returns a real .xlsx workbook of (optionally filtered) students.
 * Auth.js cookie carries the session, so a plain <a href> link works.
 *
 * Columns match the importer's, so an export can be edited and re-imported
 * (the extra "Age" and "Left the academy" columns are ignored on import).
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const groupParam = sp.get("groupId") === "__none__" ? "none" : sp.get("groupId") || undefined;
  const q = sp.get("q") || undefined;
  const archivedRaw = sp.get("archived");
  const archived =
    archivedRaw === "only" || archivedRaw === "include" ? archivedRaw : undefined;

  const students = await studentsApi.list({
    q,
    groupId: groupParam,
    archived,
  });
  const currentYear = currentYearMonth().year;

  const headers = [
    "Full name",
    "Year of birth",
    "Age",
    "Parent phone",
    "Group",
    "School",
    "Address",
    "Monthly fee (override)",
    "Left the academy",
    "Notes",
  ];

  const rows = students.map((s) => {
    // Dates of birth are stored at UTC midnight → read the UTC year.
    const year = Number(birthYear(s.dateOfBirth)) || "";
    return {
      "Full name": s.fullName,
      "Year of birth": year,
      Age: typeof year === "number" ? currentYear - year : "",
      "Parent phone": s.phoneNumber ?? "",
      Group: s.group?.name ?? "",
      School: s.school ?? "",
      Address: s.address ?? "",
      "Monthly fee (override)": s.monthlyFee ?? "",
      "Left the academy": s.archived ? "Yes" : "No",
      Notes: s.notes ?? "",
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });

  ws["!cols"] = [
    { wch: 24 }, // Full name
    { wch: 14 }, // Year of birth
    { wch: 6 }, // Age
    { wch: 18 }, // Parent phone
    { wch: 20 }, // Group
    { wch: 20 }, // School
    { wch: 28 }, // Address
    { wch: 20 }, // Monthly fee (override)
    { wch: 16 }, // Left the academy
    { wch: 30 }, // Notes
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");

  const arrayBuffer = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;

  const filename = `students-${todayIso()}.xlsx`;

  return new Response(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
