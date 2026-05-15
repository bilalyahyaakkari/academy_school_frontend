import * as XLSX from "xlsx";
import { auth } from "@/auth";

/**
 * GET /api/uniforms/template
 *
 * Downloads an empty .xlsx template with the column headers and one example row,
 * so the user can fill it in and re-upload via /uniforms/import.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const headers = ["Student", "Size", "Price", "Paid", "Notes"];

  const rows = [
    {
      Student: "Ali Hassan",
      Size: "M",
      Price: 50,
      Paid: "no", // or "yes" / "true"
      Notes: "",
    },
  ];

  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });

  ws["!cols"] = [
    { wch: 24 }, // Student
    { wch: 10 }, // Size
    { wch: 10 }, // Price
    { wch: 8 }, // Paid
    { wch: 30 }, // Notes
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Uniforms");

  const arrayBuffer = XLSX.write(wb, {
    type: "array",
    bookType: "xlsx",
  }) as ArrayBuffer;

  return new Response(arrayBuffer, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="uniforms-template.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
