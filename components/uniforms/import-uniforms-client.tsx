"use client";

import { useState, useTransition, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  importUniforms,
  type ImportUniformsResult,
} from "@/lib/actions/import-uniforms";
import { useT } from "@/lib/i18n/client";
import { toast } from "sonner";
import { Loader2, Upload, CheckCircle2, AlertCircle } from "lucide-react";

export function ImportUniformsClient() {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportUniformsResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onSubmit = (formData: FormData) => {
    if (!file) {
      toast.error(t("uniforms.import.toast.noFile"));
      return;
    }
    startTransition(async () => {
      const res = await importUniforms(formData);
      setResult(res);
      if (!res.success) {
        toast.error(res.error);
      } else if (res.created > 0 && res.failed === 0) {
        toast.success(t("uniforms.import.toast.ok", { count: res.created }));
      } else if (res.created > 0) {
        toast.warning(
          t("uniforms.import.toast.partial", {
            ok: res.created,
            failed: res.failed,
          }),
        );
      } else {
        toast.error(t("uniforms.import.toast.none"));
      }
    });
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("uniforms.import.upload")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form action={onSubmit} className="space-y-4">
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
              {t("uniforms.import.btn")}
            </Button>
            {file && !pending && (
              <Button type="button" variant="ghost" size="sm" onClick={reset}>
                {t("common.reset")}
              </Button>
            )}
          </div>
          {file && (
            <p className="text-xs text-muted-foreground">
              {t("uniforms.import.selected", {
                name: file.name,
                kb: Math.round(file.size / 1024),
              })}
            </p>
          )}
        </form>

        {result && result.success && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <Stat
                tone="ok"
                icon={<CheckCircle2 className="size-4" />}
                label={t("uniforms.import.created")}
                value={result.created}
              />
              <Stat
                tone={result.failed > 0 ? "warn" : "muted"}
                icon={<AlertCircle className="size-4" />}
                label={t("uniforms.import.failed")}
                value={result.failed}
              />
            </div>

            {result.errors.length > 0 && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <p className="mb-2 text-sm font-medium text-destructive">
                  {t("uniforms.import.errorsHeader", {
                    count: result.errors.length,
                  })}
                </p>
                <ul className="space-y-1 text-xs">
                  {result.errors.slice(0, 50).map((e) => (
                    <li key={`${e.row}-${e.studentName}`} className="flex gap-2">
                      <span className="font-mono text-muted-foreground">
                        {t("uniforms.import.row", { row: e.row })}
                      </span>
                      <span className="font-medium">{e.studentName}</span>
                      <span className="text-destructive">— {e.error}</span>
                    </li>
                  ))}
                  {result.errors.length > 50 && (
                    <li className="text-muted-foreground">
                      {t("uniforms.import.moreErrors", {
                        count: result.errors.length - 50,
                      })}
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

function Stat({
  tone,
  icon,
  label,
  value,
}: {
  tone: "ok" | "warn" | "muted";
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  const cls =
    tone === "ok"
      ? "border-success/30 bg-success/10 text-success"
      : tone === "warn"
        ? "border-warning/30 bg-warning/10 text-warning"
        : "border-border bg-muted text-muted-foreground";
  return (
    <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${cls}`}>
      {icon}
      <span className="font-semibold">{value}</span>
      <span>{label}</span>
    </div>
  );
}
