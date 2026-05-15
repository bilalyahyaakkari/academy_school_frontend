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
import { Trash2, Plus } from "lucide-react";
import type { ScheduleSlot } from "@/lib/api/types";

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
  const [slots, setSlots] = useState<ScheduleSlot[]>(defaultValue ?? []);

  const update = (i: number, patch: Partial<ScheduleSlot>) =>
    setSlots((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));

  const remove = (i: number) => setSlots((prev) => prev.filter((_, idx) => idx !== i));

  const add = () =>
    setSlots((prev) => [...prev, { day: "Monday", startTime: "16:00", endTime: "17:30" }]);

  return (
    <div className="space-y-3">
      {slots.length === 0 && (
        <p className="text-sm text-muted-foreground">No sessions yet. Add one below.</p>
      )}
      {slots.map((slot, i) => (
        <div key={i} className="flex items-center gap-2">
          <Select value={slot.day} onValueChange={(v) => update(i, { day: v as ScheduleSlot["day"] })}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAYS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="time"
            value={slot.startTime}
            onChange={(e) => update(i, { startTime: e.target.value })}
            className="w-32"
          />
          <span className="text-muted-foreground">→</span>
          <Input
            type="time"
            value={slot.endTime}
            onChange={(e) => update(i, { endTime: e.target.value })}
            className="w-32"
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <Plus className="size-4" />
        Add session
      </Button>
      {/* Hidden input that the form submits — keeps schedule editing fully client-side. */}
      <input type="hidden" name="schedule" value={JSON.stringify(slots)} />
    </div>
  );
}
