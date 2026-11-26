"use client";

import { useRef, useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, whatsappShareUrl } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import type { TranslationKey } from "@/lib/i18n";
import type { SupplierOrderState } from "@/lib/api/types";
import { STATE_LABEL } from "./supplier-order-text";

const STATE_CLASS: Record<SupplierOrderState, string> = {
  DRAFT: "border-dashed border-sea-300 bg-transparent text-muted-foreground",
  ORDERED: "border-transparent bg-sea-100 text-sea-900",
  PARTIAL: "border-transparent bg-sea-300/60 text-sea-950",
  RECEIVED: "border-transparent bg-sea-700/10 text-sea-700",
};

/** Draft · Sent to supplier · Partly received · Received */
export function SupplierOrderStateChip({
  state,
  className,
}: {
  state: SupplierOrderState;
  className?: string;
}) {
  const t = useT();
  return (
    <Badge
      variant="outline"
      className={cn("shrink-0 rounded-full px-2.5 whitespace-nowrap", STATE_CLASS[state], className)}
    >
      {t(STATE_LABEL[state])}
    </Badge>
  );
}

/**
 * A message for the supplier: shown as-is, with "Copy" and a WhatsApp share
 * link (no recipient — WhatsApp asks who to send it to).
 */
export function SupplierShareText({
  text,
  copyLabel,
}: {
  text: string;
  copyLabel: TranslationKey;
}) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onCopy = async () => {
    try {
      if (!navigator.clipboard) throw new Error("no clipboard");
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(t("uniforms.supplier.copied"));
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("uniforms.supplier.copyFailed"));
    }
  };

  return (
    <div className="space-y-3">
      <p
        dir="auto"
        className="rounded-lg border border-border bg-muted/40 p-3 text-sm leading-relaxed break-words whitespace-pre-wrap"
      >
        {text}
      </p>
      <div className="flex flex-wrap gap-2 [&>*]:flex-1 sm:[&>*]:flex-none">
        <Button type="button" variant="outline" onClick={onCopy}>
          {copied ? <Check /> : <Copy />}
          {copied ? t("uniforms.supplier.copiedShort") : t(copyLabel)}
        </Button>
        <Button asChild variant="outline">
          <a href={whatsappShareUrl(text)} target="_blank" rel="noopener noreferrer">
            <MessageCircle />
            {t("uniforms.supplier.whatsapp")}
          </a>
        </Button>
      </div>
    </div>
  );
}
