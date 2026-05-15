import { auth } from "@/auth";
import { toCsv } from "@/lib/csv";

/**
 * GET /api/students/template
 *
 * Downloads an empty template CSV with the column headers and one example row,
 * so the user can fill it in and re-upload via /students/import.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const headers = [
    { key: "fullName", label: "Full name" },
    { key: "birthYear", label: "Year of birth" },
    { key: "parentPhone", label: "Parent phone" },
    { key: "group", label: "Group" },
    { key: "isActive", label: "Status" },
    { key: "monthlyFeeOverride", label: "Monthly fee (override)" },
    { key: "notes", label: "Notes" },
  ];

  const example = [
    {
      fullName: "Ali Hassan",
      birthYear: "2015",
      parentPhone: "+963900000000",
      group: "", // optional — leave blank to skip
      isActive: "Active", // or "Inactive"
      monthlyFeeOverride: "", // optional — blank means inherit from group
      notes: "",
    },
  ];

  const csv = toCsv(example, headers);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="students-template.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
