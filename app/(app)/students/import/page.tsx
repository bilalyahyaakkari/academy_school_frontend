import { ImportStudentsClient } from "@/components/students/import-students-client";
import { PageHeader } from "@/components/app/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export const metadata = { title: "Import students — Academy" };

export default function ImportStudentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Import students"
        description="Bulk-create students from a CSV file."
        backHref="/students"
        backLabel="Back to students"
        actions={
          <Button asChild variant="outline">
            <a href="/api/students/template" download>
              <Download className="size-4" />
              Download template
            </a>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Required columns</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            Upload an <strong>Excel file (.xlsx)</strong> or a <strong>CSV file</strong>.
            The first row must be the header. Each remaining row creates one student.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field name="Full name" required />
            <Field name="Year of birth" required hint="4-digit year, e.g. 2015" />
            <Field name="Parent phone" />
            <Field name="Group" hint="must match an existing group name; blank = no group" />
            <Field name="Status" hint='"Active" or "Inactive"; defaults to Active' />
            <Field name="Monthly fee (override)" hint="number; blank = inherit from group" />
            <Field name="Notes" />
          </div>
          <p className="text-xs text-muted-foreground">
            Tip: download the template above and fill it in. Arabic names are supported
            (the file uses UTF-8 with BOM, which Excel respects).
          </p>
        </CardContent>
      </Card>

      <ImportStudentsClient />
    </div>
  );
}

function Field({ name, required, hint }: { name: string; required?: boolean; hint?: string }) {
  return (
    <div className="rounded-md border border-border bg-card p-3">
      <p className="font-medium">
        {name}{" "}
        {required ? (
          <span className="text-xs text-destructive">required</span>
        ) : (
          <span className="text-xs text-muted-foreground">optional</span>
        )}
      </p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
