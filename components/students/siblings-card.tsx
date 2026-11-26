"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { unlinkSibling } from "@/lib/actions/students";
import { useT } from "@/lib/i18n/client";
import type { SiblingSuggestion, SiblingSummary } from "@/lib/api/types";
import { toast } from "sonner";
import { ArrowUpRight, Info, Link2, Loader2, Unlink } from "lucide-react";
import { LinkSiblingDialog } from "./link-sibling-dialog";

/** "Siblings" card on the student page: linked brothers/sisters + link / unlink. */
export function SiblingsCard({
  studentId,
  studentName,
  siblings,
  suggestions,
}: {
  studentId: string;
  studentName: string;
  siblings: SiblingSummary[];
  suggestions: SiblingSuggestion[];
}) {
  const t = useT();
  const [linking, setLinking] = useState(false);
  const [unlinkTarget, setUnlinkTarget] = useState<SiblingSummary | null>(null);
  const [pending, startTransition] = useTransition();

  const onUnlink = () => {
    const target = unlinkTarget;
    if (!target) return;
    startTransition(async () => {
      const res = await unlinkSibling(target.id);
      if (res.success === false) {
        toast.error(res.error);
        return;
      }
      toast.success(t("students.siblings.toast.unlinked", { name: target.fullName }));
      setUnlinkTarget(null);
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-base">{t("students.siblings.title")}</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setLinking(true)}>
          <Link2 className="size-4" />
          {t("students.siblings.link")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {siblings.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("students.siblings.empty")}</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {siblings.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-3 py-2">
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-2">
                    <Link
                      href={`/students/${s.id}`}
                      className="truncate font-medium hover:underline"
                    >
                      {s.fullName}
                    </Link>
                    {s.archived && (
                      <Badge variant="soft" className="shrink-0 rounded-full px-2 text-[10px]">
                        {t("students.badge.left")}
                      </Badge>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {s.group?.name ?? t("studentForm.group.placeholder")}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 shrink-0 sm:h-8"
                  aria-label={t("students.siblings.unlinkName", { name: s.fullName })}
                  onClick={() => setUnlinkTarget(s)}
                >
                  <Unlink className="size-4" />
                  <span className="max-sm:sr-only">{t("students.siblings.unlink")}</span>
                </Button>
              </li>
            ))}
          </ul>
        )}
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <Info aria-hidden className="mt-px size-3.5 shrink-0" />
          <span>
            {t("students.siblings.hint")}{" "}
            <Link
              href="/settings"
              className="inline-flex items-center gap-0.5 font-medium text-sea-700 hover:underline"
            >
              {t("nav.settings")}
              <ArrowUpRight aria-hidden className="size-3 rtl:-scale-x-100" />
            </Link>
          </span>
        </p>
      </CardContent>

      {linking && (
        <LinkSiblingDialog
          studentId={studentId}
          studentName={studentName}
          excludeIds={[studentId, ...siblings.map((s) => s.id)]}
          suggestions={suggestions}
          onClose={() => setLinking(false)}
        />
      )}

      <Dialog open={!!unlinkTarget} onOpenChange={(o) => !o && !pending && setUnlinkTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("students.siblings.unlink.title", { name: unlinkTarget?.fullName ?? "" })}
            </DialogTitle>
            <DialogDescription>
              {t("students.siblings.unlink.desc", {
                name: unlinkTarget?.fullName ?? "",
                student: studentName,
              })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setUnlinkTarget(null)} disabled={pending}>
              {t("common.cancel")}
            </Button>
            <Button onClick={onUnlink} disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Unlink className="size-4" />}
              {t("students.siblings.unlink")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
