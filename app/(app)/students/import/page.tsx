import { ImportStudentsClient } from "@/components/students/import-students-client";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata() {
  const t = await getT();
  return { title: `${t("students.import.title")} — Academy` };
}

export default async function ImportStudentsPage() {
  const t = await getT();
  const required = t("students.import.required");
  const optional = t("students.import.optional");

  // Column names stay in English: they're the headers the importer matches
  // (the template uses them too).
  const fields: { name: string; required?: boolean; hint?: string }[] = [
    { name: "Full name", required: true, hint: t("students.import.col.fullName.hint") },
    { name: "Year of birth", required: true, hint: t("students.import.col.birthYear.hint") },
    { name: "Parent phone" },
    { name: "Group", hint: t("students.import.col.group.hint") },
    { name: "School" },
    { name: "Address" },
    { name: "Monthly fee (override)", hint: t("students.import.col.fee.hint") },
    { name: "Notes" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("students.import.title")}
        description={t("students.import.desc")}
        backHref="/students"
        backLabel={t("students.back")}
        actions={
          <Button asChild variant="outline">
            <a href="/api/students/template" download>
              <Download className="size-4" />
              {t("students.import.template")}
            </a>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("students.import.columns")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>{t("students.import.intro")}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {fields.map((f) => (
              <Field
                key={f.name}
                name={f.name}
                hint={f.hint}
                tag={f.required ? required : optional}
                required={f.required}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{t("students.import.dupHint")}</p>
          <p className="text-xs text-muted-foreground">{t("students.import.tip")}</p>
        </CardContent>
      </Card>

      <ImportStudentsClient />
    </div>
  );
}

function Field({
  name,
  required,
  tag,
  hint,
}: {
  name: string;
  required?: boolean;
  tag: string;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <p className="font-medium">
        <span dir="ltr">{name}</span>{" "}
        <span className={required ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
          {tag}
        </span>
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
