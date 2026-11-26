"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, ArrowRight } from "lucide-react";
import type { ScheduleSlot } from "@/lib/api/types";
import type { TranslationKey } from "@/lib/i18n";
import { useT } from "@/lib/i18n/client";

const DAYS: ScheduleSlot["day"][] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export function ScheduleEditor({ defaultValue }: { defaultValue?: ScheduleSlot[] }) {
  const t = useT();
  const [slots, setSlots] = useState<ScheduleSlot[]>(defaultValue ?? []);
  const dayLabel = (d: ScheduleSlot["day"]) => t(`day.${d}` as TranslationKey);

  const update = (i: number, patch: Partial<ScheduleSlot>) =>
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const remove = (i: number) => setSlots((prev) => prev.filter((_, idx) => idx !== i));

  const add = () =>
    setSlots((prev) => [...prev, { day: "Monday", startTime: "16:00", endTime: "17:30" }]);

  return (
    <div className="space-y-3">
      {slots.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("groups.schedule.empty")}</p>
      )}
      {slots.map((slot, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
          <Select value={slot.day} onValueChange={(v) => update(i, { day: v as ScheduleSlot["day"] })}>
            <SelectTrigger className="w-full sm:w-36" aria-label={t("groups.schedule.day")}>
              <SelectValue>{dayLabel(slot.day)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {DAYS.map((d) => (
                <SelectItem key={d} value={d}>
                  {dayLabel(d)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="time"
            value={slot.startTime}
            onChange={(e) => update(i, { startTime: e.target.value })}
            aria-label={t("groups.schedule.start")}
            className="min-w-0 flex-1 sm:w-32 sm:flex-none"
          />
          {/* Points from start to end time — flipped in RTL, where start is on the right. */}
          <ArrowRight aria-hidden className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" />
          <Input
            type="time"
            value={slot.endTime}
            onChange={(e) => update(i, { endTime: e.target.value })}
            aria-label={t("groups.schedule.end")}
            className="min-w-0 flex-1 sm:w-32 sm:flex-none"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(i)}
            aria-label={`${t("groups.schedule.remove")} (${dayLabel(slot.day)} ${slot.startTime}–${slot.endTime})`}
            title={t("groups.schedule.remove")}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="size-4" />
        {t("groups.schedule.add")}
      </Button>
      {/* Hidden input that the form submits — keeps schedule editing fully client-side. */}
      <input type="hidden" name="schedule" value={JSON.stringify(slots)} />
    </div>
  );
}
