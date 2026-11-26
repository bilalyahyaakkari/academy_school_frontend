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
import { Search, X, LogOut } from "lucide-react";
import { useT } from "@/lib/i18n/client";

type Group = { id: string; name: string };

export function StudentsFilterBar({
  groups,
  initialQ,
  initialGroupId,
  initialArchived,
}: {
  groups: Group[];
  initialQ?: string;
  initialGroupId?: string;
  initialArchived?: "only" | "include";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const t = useT();

  // The search box is local state while typing, but must follow the URL when
  // it changes from outside (back/forward, "Clear", a link). Adjusting state
  // during render when the URL value changes is React's recommended pattern
  // for this (no effect, no extra paint with a stale value).
  const urlQ = searchParams.get("q") ?? "";
  const [q, setQ] = useState(urlQ);
  const [syncedQ, setSyncedQ] = useState(urlQ);
  if (urlQ !== syncedQ) {
    setSyncedQ(urlQ);
    setQ(urlQ);
  }

  const update = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("status"); // retired filter — drop it from old bookmarks
    for (const [k, v] of Object.entries(patch)) {
      if (v === undefined || v === "" || v === "__all__") params.delete(k);
      else params.set(k, v);
    }
    startTransition(() => router.push(`/students?${params.toString()}`));
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    update({ q: q.trim() || undefined });
  };

  const hasFilters = !!(initialQ || initialGroupId || initialArchived);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <form onSubmit={onSearch} className="relative min-w-0 flex-1">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t("students.search.placeholder.v2")}
          aria-label={t("common.search")}
          type="search"
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
        value={initialArchived ?? "__all__"}
        onValueChange={(v) => update({ archived: v })}
      >
        <SelectTrigger className="sm:w-44">
          <SelectValue placeholder={t("students.filter.scope.current")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">
            {t("students.filter.scope.current")}
          </SelectItem>
          <SelectItem value="include">
            {t("students.filter.scope.include")}
          </SelectItem>
          <SelectItem value="only">
            <span className="inline-flex items-center gap-2">
              <LogOut className="size-3.5 rtl:rotate-180" />
              {t("students.filter.scope.left")}
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
