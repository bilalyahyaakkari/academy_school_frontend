import * as XLSX from "xlsx";
import { auth } from "@/auth";
import { getLocale, getT } from "@/lib/i18n/server";

/**
 * GET /api/uniforms/template
 *
 * Downloads an empty .xlsx template with the column headers and one example row,
 * so the user can fill it in and re-upload via /uniforms/import.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  // Headers in the admin's language — the importer accepts both the English
  // and the Arabic names.
  const locale = await getLocale();
  const t = await getT();
  const headers = [
    t("uniforms.import.col.student"),
    t("uniforms.import.col.size"),
    t("uniforms.import.col.price"),
    t("uniforms.import.col.paid"),
    t("uniforms.import.col.received"),
    t("uniforms.import.col.notes"),
  ];
  const example =
    locale === "ar"
      ? ["علي حسن", "M", 50, "لا", "لا", ""]
      : ["Ali Hassan", "M", 50, "no", "no", ""];

  const ws = XLSX.utils.aoa_to_sheet([headers, example]);

  ws["!cols"] = [
    { wch: 24 }, // Student
    { wch: 10 }, // Size
    { wch: 10 }, // Price
    { wch: 8 }, // Paid
    { wch: 10 }, // Received
    { wch: 30 }, // Notes
  ];
  if (locale === "ar") ws["!views"] = [{ RTL: true }];

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
