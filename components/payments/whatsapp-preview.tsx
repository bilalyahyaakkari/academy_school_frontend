"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { ACADEMY_TZ, cn } from "@/lib/utils";

const noopSubscribe = () => () => {};

/** "HH:MM" now in Beirut — browser only, so it can't mismatch the server HTML. */
export function useClientTime(): string {
  return useSyncExternalStore(
    noopSubscribe,
    () =>
      new Intl.DateTimeFormat("en-GB", {
        timeZone: ACADEMY_TZ,
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date()),
    () => "",
  );
}

/**
 * Lightweight WhatsApp formatting renderer for previews only — turns
 * `*bold*` into actual bold text inside the chat bubble.
 */
export function renderWhatsAppFormatting(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const re = /\*([^*\n]+?)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <strong key={`b-${i++}`} className="font-bold">
        {match[1]}
      </strong>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

/**
 * A WhatsApp-style chat panel with one outgoing (Arabic) message bubble.
 * Shared by the settings template previews and the "Send receipt" dialog.
 */
export function WhatsAppBubble({
  text,
  time,
  footer,
  className,
}: {
  text: string;
  /** "HH:MM" under the message; omit to hide. */
  time?: string;
  /** Small centred note under the bubble (e.g. "Sample · …"). */
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("relative rounded-2xl bg-sea-100 p-4 text-sea-900 shadow-inner", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-[0.06]"
        style={{
          backgroundImage: "radial-gradient(circle at 4px 4px, currentColor 1px, transparent 0)",
          backgroundSize: "12px 12px",
        }}
      />
      {/* The message is Arabic: the bubble is laid out right-to-left whatever the UI language. */}
      <div dir="rtl" className="relative">
        <div className="me-auto max-w-[90%] rounded-2xl rounded-ss-sm bg-white p-3 text-sm text-sea-950 shadow-sm ring-1 ring-sea-300/50">
          <p className="whitespace-pre-wrap text-start">{renderWhatsAppFormatting(text)}</p>
          {time !== undefined && (
            <p className="mt-1 text-start text-[10px] text-sea-700">
              ✓✓ <span>{time}</span>
            </p>
          )}
        </div>
      </div>
      {footer && <p className="relative mt-3 text-center text-[10px] text-sea-900/80">{footer}</p>}
    </div>
  );
}
