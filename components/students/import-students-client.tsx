"use client";

import { useState, useTransition, useRef, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { importStudents, type ImportResult } from "@/lib/actions/import-students";
import { useT } from "@/lib/i18n/client";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { SummaryStrip } from "@/components/app/summary-strip";

export function ImportStudentsClient() {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const clearFile = () => {
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      toast.error(t("students.import.toast.noFile"));
      return;
    }
    const formData = new FormData();
    formData.set("file", file);
    startTransition(async () => {
      let res: ImportResult;
      try {
        res = await importStudents(formData);
      } catch {
        // Network failure, server crash, upload too large…
        toast.error(t("students.import.err.request"));
        return;
      }
      setResult(res);
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      // The file has been processed — clear it so a second click can't
      // import the same rows again.
      clearFile();
      if (res.created > 0 && res.failed === 0) {
        toast.success(
          res.created === 1
            ? t("students.import.toast.ok.one")
            : t("students.import.toast.ok", { count: res.created }),
        );
      } else if (res.created > 0) {
        toast.warning(t("students.import.toast.partial", { ok: res.created, failed: res.failed }));
      } else {
        toast.error(t("students.import.toast.none"));
      }
    });
  };

  const reset = () => {
    clearFile();
    setResult(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("students.import.upload")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              ref={inputRef}
              name="file"
              type="file"
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setResult(null);
              }}
              className="block w-full max-w-md cursor-pointer rounded-md border border-input bg-background px-3 py-2 text-sm file:me-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80"
            />
            <Button type="submit" disabled={pending || !file}>
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Upload className="size-4" />
              )}
              {t("students.import.btn")}
            </Button>
            {(file || result) && !pending && (
              <Button type="button" variant="ghost" size="sm" onClick={reset}>
                {t("common.reset")}
              </Button>
            )}
          </div>
          {file && (
            <p className="text-xs text-muted-foreground">
              {t("students.import.selected", {
                name: file.name,
                kb: Math.round(file.size / 1024),
              })}
            </p>
          )}
        </form>

        {result && result.success && (
          <div className="space-y-3">
            <SummaryStrip
              className="shadow-none"
              items={[
                {
                  label: t("students.import.created"),
                  value: result.created,
                  tone: result.created > 0 && result.failed === 0 ? "positive" : "default",
                },
                {
                  label: t("students.import.failed"),
                  value: result.failed,
                  // Rows that didn't import need attention.
                  tone: result.failed > 0 ? "alert" : "default",
                },
              ]}
            />

            {result.errors.length > 0 && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <p className="mb-2 text-sm font-medium text-destructive">
                  {t("students.import.errorsHeader", { count: result.errors.length })}
                </p>
                <ul className="space-y-1 text-xs">
                  {result.errors.slice(0, 50).map((e, i) => (
                    <li key={`${i}-${e.row}`} className="flex flex-wrap gap-x-2">
                      <span className="font-mono text-muted-foreground">
                        {t("students.import.row", { row: e.row })}
                      </span>
                      <span className="font-medium">{e.fullName}</span>
                      <span className="text-destructive">— {e.error}</span>
                    </li>
                  ))}
                  {result.errors.length > 50 && (
                    <li className="text-muted-foreground">
                      {t("students.import.moreErrors", { count: result.errors.length - 50 })}
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
