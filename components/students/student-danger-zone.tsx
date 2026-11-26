"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteStudent } from "@/lib/actions/students";
import { useT } from "@/lib/i18n/client";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";

export function StudentDangerZone({
  studentId,
  fullName,
}: {
  studentId: string;
  fullName: string;
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);

  const onDelete = () => {
    startTransition(async () => {
      const res = await deleteStudent(studentId);
      if (res && res.success === false) toast.error(res.error);
      // Redirect will navigate away on success.
    });
  };

  return (
    <Card className="border-destructive/30">
      <CardHeader>
        <CardTitle className="text-base text-destructive">{t("students.danger.title")}</CardTitle>
        <CardDescription>{t("students.danger.desc")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">
              <Trash2 className="size-4" />
              {t("students.danger.delete")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("students.delete.title", { name: fullName })}</DialogTitle>
              <DialogDescription>{t("students.delete.desc")}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
                {t("common.cancel")}
              </Button>
              <Button variant="destructive" onClick={onDelete} disabled={pending}>
                {pending && <Loader2 className="size-4 animate-spin" />}
                {t("common.delete")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
