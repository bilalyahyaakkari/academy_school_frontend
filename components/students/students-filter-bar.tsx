"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Archive } from "lucide-react";
import { useT } from "@/lib/i18n/client";

type Group = { id: string; name: string };

export function StudentsFilterBar({
  groups,
  initialQ,
  initialGroupId,
  initialStatus,
  initialArchived,
}: {
  groups: Group[];
  initialQ?: string;
  initialGroupId?: string;
  initialStatus?: string;
  initialArchived?: "only" | "include";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(initialQ ?? "");
  const t = useT();

  const update = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "" || v === "__all__") params.delete(k);
      else params.set(k, v);
    }
    startTransition(() => router.push(`/students?${params.toString()}`));
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    update({ q: q || undefined });
  };

  const hasFilters = !!(initialQ || initialGroupId || initialStatus || initialArchived);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <form onSubmit={onSearch} className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("students.search.placeholder")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="ps-9"
        />
      </form>
      <Select
        value={initialGroupId ?? "__all__"}
        onValueChange={(v) => update({ groupId: v })}
      >
        <SelectTrigger className="sm:w-48">
          <SelectValue placeholder={t("students.filter.allGroups")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">
            {t("students.filter.allGroups")}
          </SelectItem>
          <SelectItem value="__none__">
            {t("students.filter.unassigned")}
          </SelectItem>
          {groups.map((g) => (
            <SelectItem key={g.id} value={g.id}>
              {g.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select
        value={initialStatus ?? "__all__"}
        onValueChange={(v) => update({ status: v })}
      >
        <SelectTrigger className="sm:w-40">
          <SelectValue placeholder={t("students.filter.all")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">{t("students.filter.all")}</SelectItem>
          <SelectItem value="active">{t("students.filter.active")}</SelectItem>
          <SelectItem value="inactive">
            {t("students.filter.inactive")}
          </SelectItem>
        </SelectContent>
      </Select>
      <Select
        value={initialArchived ?? "__all__"}
        onValueChange={(v) => update({ archived: v })}
      >
        <SelectTrigger className="sm:w-44">
          <SelectValue placeholder={t("students.filter.archive.activeOnly")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">
            <span className="inline-flex items-center gap-2">
              {t("students.filter.archive.activeOnly")}
            </span>
          </SelectItem>
          <SelectItem value="include">
            {t("students.filter.archive.all")}
          </SelectItem>
          <SelectItem value="only">
            <span className="inline-flex items-center gap-2">
              <Archive className="size-3.5" />
              {t("students.filter.archive.onlyArchived")}
            </span>
          </SelectItem>
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setQ("");
            startTransition(() => router.push("/students"));
          }}
          disabled={pending}
        >
          <X className="size-4" />
          {t("common.clear")}
        </Button>
      )}
    </div>
  );
}
