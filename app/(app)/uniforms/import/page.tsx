import { ImportUniformsClient } from "@/components/uniforms/import-uniforms-client";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { getT } from "@/lib/i18n/server";

export const metadata = { title: "Import uniforms — Academy" };

export default async function ImportUniformsPage() {
  const t = await getT();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("uniforms.import.title")}
        description={t("uniforms.import.desc")}
        backHref="/uniforms"
        backLabel={t("uniforms.import.back")}
        actions={
          <Button asChild variant="outline">
            <a href="/api/uniforms/template" download>
              <Download className="size-4" />
              {t("uniforms.import.template")}
            </a>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {t("uniforms.import.columns")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>{t("uniforms.import.intro")}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              name={t("uniforms.import.col.student")}
              required
              requiredLabel={t("uniforms.import.required")}
              optionalLabel={t("uniforms.import.optional")}
              hint={t("uniforms.import.col.student.hint")}
            />
            <Field
              name={t("uniforms.import.col.size")}
              required
              requiredLabel={t("uniforms.import.required")}
              optionalLabel={t("uniforms.import.optional")}
              hint={t("uniforms.import.col.size.hint")}
            />
            <Field
              name={t("uniforms.import.col.price")}
              required
              requiredLabel={t("uniforms.import.required")}
              optionalLabel={t("uniforms.import.optional")}
              hint={t("uniforms.import.col.price.hint")}
            />
            <Field
              name={t("uniforms.import.col.paid")}
              requiredLabel={t("uniforms.import.required")}
              optionalLabel={t("uniforms.import.optional")}
              hint={t("uniforms.import.col.paid.hint")}
            />
            <Field
              name={t("uniforms.import.col.notes")}
              requiredLabel={t("uniforms.import.required")}
              optionalLabel={t("uniforms.import.optional")}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {t("uniforms.import.tip")}
          </p>
        </CardContent>
      </Card>

      <ImportUniformsClient />
    </div>
  );
}

function Field({
  name,
  required,
  requiredLabel,
  optionalLabel,
  hint,
}: {
  name: string;
  required?: boolean;
  requiredLabel: string;
  optionalLabel: string;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <p className="font-medium">
        {name}{" "}
        {required ? (
          <span className="text-xs text-destructive">{requiredLabel}</span>
        ) : (
          <span className="text-xs text-muted-foreground">{optionalLabel}</span>
        )}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
