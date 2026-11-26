"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/client";
import { Plus } from "lucide-react";
import { TrialDialog, type TrialGroupOption } from "./trial-dialog";

/** The page's main button (lives in the summary strip). */
export function NewTrialButton({
  groups,
  today,
}: {
  groups: TrialGroupOption[];
  today: string;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        {t("trials.action.new")}
      </Button>
      {open && <TrialDialog groups={groups} today={today} onClose={() => setOpen(false)} />}
    </>
  );
}
