import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { auth } from "@/auth";
import { studentsApi } from "@/lib/api/students";

/**
 * GET /api/students/export?q=&groupId=&status=
 *
 * Returns a real .xlsx workbook of (optionally filtered) students.
 * Auth.js cookie carries the session, so a plain <a href> link works.
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const sp = request.nextUrl.searchParams;
  const groupParam = sp.get("groupId") === "__none__" ? "none" : sp.get("groupId") || undefined;
  const status = (sp.get("status") as "active" | "inactive" | null) || undefined;
  const q = sp.get("q") || undefined;

  const students = await studentsApi.list({ q, groupId: groupParam, status });
  const currentYear = new Date().getFullYear();

  const rows = students.map((s) => {
    const year = new Date(s.dateOfBirth).getFullYear();
    return {
      "Full name": s.fullName,
      "Year of birth": year,
      Age: currentYear - year,
      "Parent phone": s.phoneNumber ?? "",
      Group: s.group?.name ?? "",
      Status: s.isActive ? "Active" : "Inactive",
      "Monthly fee (override)": s.monthlyFee ?? "",
      Notes: s.notes ?? "",
    };
  });

  const headers = [
    "Full name",
    "Year of birth",
    "Age",
    "Parent phone",
    "Group",
    "Status",
    "Monthly fee (override)",
    "Notes",
  ];

  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });

  ws["!cols"] = [
    { wch: 24 }, // Full name
    { wch: 14 }, // Year of birth
    { wch: 6 }, // Age
    { wch: 18 }, // Parent phone
    { wch: 20 }, // Group
    { wch: 10 }, // Status
    { wch: 20 }, // Monthly fee (override)
    { wch: 30 }, // Notes
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Students");

  const arrayBuffer = XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;

  const today = new Date().toISOString().slice(0, 10);
  const filename = `students-${today}.xlsx`;

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
