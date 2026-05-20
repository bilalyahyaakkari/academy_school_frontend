"use client";

import { useMemo, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUniform, updateUniform } from "@/lib/actions/uniforms";
import { useT } from "@/lib/i18n/client";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
import type { UniformWithStudent } from "@/lib/api/types";

type StudentOption = { id: string; fullName: string };

type Props =
  | {
      mode: "create";
      students: StudentOption[];
      knownSizes: string[];
      uniform?: undefined;
      onClose: () => void;
    }
  | {
      mode: "edit";
      students: StudentOption[];
      knownSizes: string[];
      uniform: UniformWithStudent;
      onClose: () => void;
    };

const DEFAULT_SIZES = ["S", "M", "L", "XL"];
const ADD_NEW_VALUE = "__add_new__";

export function UniformDialog(props: Props) {
  const { mode, students, knownSizes, onClose } = props;
  const initial = mode === "edit" ? props.uniform : null;

  const t = useT();
  const [pending, startTransition] = useTransition();
  const [studentId, setStudentId] = useState(initial?.studentId ?? "");
  const [size, setSize] = useState<string>(initial?.size ?? "M");
  const [isPaid, setIsPaid] = useState(initial?.isPaid ?? false);
  const [isReceived, setIsReceived] = useState(initial?.isReceived ?? false);

  const [addingSize, setAddingSize] = useState(false);
  const [newSize, setNewSize] = useState("");

  const sizeOptions = useMemo(() => {
    const set = new Set<string>(DEFAULT_SIZES);
    for (const s of knownSizes) if (s) set.add(s);
    if (size) set.add(size);
    return Array.from(set);
  }, [knownSizes, size]);

  const onSelectChange = (v: string) => {
    if (v === ADD_NEW_VALUE) {
      setAddingSize(true);
      setNewSize("");
      return;
    }
    setSize(v);
  };

  const confirmNewSize = () => {
    const trimmed = newSize.trim();
    if (!trimmed) {
      toast.error(t("uniformDialog.validation.emptySize"));
      return;
    }
    if (trimmed.length > 20) {
      toast.error(t("uniformDialog.validation.sizeTooLong"));
      return;
    }
    setSize(trimmed);
    setAddingSize(false);
    setNewSize("");
  };

  const cancelNewSize = () => {
    setAddingSize(false);
    setNewSize("");
  };

  const onSubmit = (formData: FormData) => {
    if (!studentId) {
      toast.error(t("uniformDialog.validation.pickStudent"));
      return;
    }

    // If user typed a new size but never clicked the ✓ confirm button, use
    // whatever they typed instead of falling back to the stale `size` state.
    let effectiveSize = size;
    if (addingSize) {
      const trimmed = newSize.trim();
      if (!trimmed) {
        toast.error(t("uniformDialog.validation.emptySize"));
        return;
      }
      if (trimmed.length > 20) {
        toast.error(t("uniformDialog.validation.sizeTooLong"));
        return;
      }
      effectiveSize = trimmed;
      // Sync the visible state so a subsequent submit (e.g. on error) is consistent.
      setSize(trimmed);
      setAddingSize(false);
      setNewSize("");
    }

    if (!effectiveSize.trim()) {
      toast.error(t("uniformDialog.validation.emptySize"));
      return;
    }
    formData.set("studentId", studentId);
    formData.set("size", effectiveSize.trim());
    formData.set("isPaid", isPaid ? "true" : "false");
    formData.set("isReceived", isReceived ? "true" : "false");

    startTransition(async () => {
      const res =
        mode === "create"
          ? await createUniform(formData)
          : await updateUniform(initial!.id, formData);
      if (res.success === false) {
        toast.error(res.error);
        return;
      }
      toast.success(
        mode === "create"
          ? t("uniforms.toast.created")
          : t("uniforms.toast.updated"),
      );
      onClose();
    });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "create"
              ? t("uniformDialog.title.create")
              : t("uniformDialog.title.edit")}
          </DialogTitle>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>{t("uniformDialog.field.student")} *</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={t("uniformDialog.placeholder.student")}
                />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("uniformDialog.field.size")} *</Label>
              {addingSize ? (
                <div className="flex items-center gap-2">
                  <Input
                    autoFocus
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    placeholder={t("uniformDialog.placeholder.newSize")}
                    maxLength={20}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        confirmNewSize();
                      } else if (e.key === "Escape") {
                        e.preventDefault();
                        cancelNewSize();
                      }
                    }}
                    onBlur={(e) => {
                      // Don't auto-confirm if the blur was caused by clicking
                      // the ✓ or ✕ button next to the input (they handle it).
                      const next = e.relatedTarget as HTMLElement | null;
                      if (next?.closest("[data-size-action]")) return;
                      const trimmed = newSize.trim();
                      if (trimmed && trimmed.length <= 20) {
                        setSize(trimmed);
                        setAddingSize(false);
                        setNewSize("");
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="icon"
                    onClick={confirmNewSize}
                    aria-label={t("common.add")}
                    data-size-action
                  >
                    <Plus className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={cancelNewSize}
                    aria-label={t("common.cancel")}
                    data-size-action
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <Select value={size} onValueChange={onSelectChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                    <SelectItem
                      value={ADD_NEW_VALUE}
                      className="font-medium text-primary"
                    >
                      + {t("uniformDialog.size.addNew")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">{t("uniformDialog.field.price")} *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min={0}
                step="0.01"
                required
                defaultValue={initial?.price}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isPaid"
              type="checkbox"
              checked={isPaid}
              onChange={(e) => setIsPaid(e.target.checked)}
              className="size-4 rounded border-border"
            />
            <Label htmlFor="isPaid" className="cursor-pointer">
              {t("uniformDialog.field.alreadyPaid")}
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="isReceived"
              type="checkbox"
              checked={isReceived}
              onChange={(e) => setIsReceived(e.target.checked)}
              className="size-4 rounded border-border"
            />
            <Label htmlFor="isReceived" className="cursor-pointer">
              {t("uniformDialog.field.alreadyReceived")}
            </Label>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t("uniformDialog.field.notes")}</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={initial?.notes ?? ""}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {mode === "create"
                ? t("uniformDialog.submit.create")
                : t("uniformDialog.submit.edit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
