"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, MessageCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getReceipt, type ReceiptMessage } from "@/lib/actions/payments";
import { formatCurrency } from "@/lib/utils";
import { useT } from "@/lib/i18n/client";
import { WhatsAppBubble } from "./whatsapp-preview";

export type ReceiptKind = "FEE" | "UNIFORM";

/** Fetches a receipt through the server action; toasts and returns null on failure. */
export async function loadReceipt(kind: ReceiptKind, id: string): Promise<ReceiptMessage | null> {
  const res = await getReceipt(kind, id);
  if (res.success === false) {
    toast.error(res.error);
    return null;
  }
  return res.data ?? null;
}

/** The amounts, the message preview — or why there's nothing to send. */
export function ReceiptBody({ receipt }: { receipt: ReceiptMessage }) {
  const t = useT();
  if (!receipt.message) {
    return <p className="text-sm text-muted-foreground">{t("payments.receipt.nothingPaid")}</p>;
  }
  return (
    <div className="space-y-3">
      <p className="text-sm">
        <span className="font-medium">
          {t("payments.receipt.received", { amount: formatCurrency(receipt.amount) })}
        </span>
        <span className="text-muted-foreground"> · </span>
        {receipt.remaining > 0.004 ? (
          <span className="text-alert">
            {t("payments.receipt.remaining", { amount: formatCurrency(receipt.remaining) })}
          </span>
        ) : (
          <span className="text-sea-700">{t("payments.receipt.fullyPaid")}</span>
        )}
      </p>
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {t("payments.receipt.preview")}
        </p>
        <WhatsAppBubble text={receipt.message} />
      </div>
      {!receipt.url && (
        <p className="text-sm text-muted-foreground">
          {t("payments.receipt.noPhone", { name: receipt.studentName })}
        </p>
      )}
    </div>
  );
}

/**
 * The "Open WhatsApp" link. A real <a target="_blank"> the admin clicks, so
 * the browser treats it as a user gesture (no popup blocking).
 */
export function OpenWhatsAppButton({
  receipt,
  onClick,
}: {
  receipt: ReceiptMessage;
  onClick?: () => void;
}) {
  const t = useT();
  if (!receipt.url || !receipt.message) return null;
  return (
    <Button asChild>
      <a href={receipt.url} target="_blank" rel="noopener noreferrer" onClick={onClick}>
        <MessageCircle className="size-4" />
        {t("payments.receipt.open")}
      </a>
    </Button>
  );
}

/** Stand-alone "Send receipt" dialog for an already-loaded receipt. */
export function ReceiptDialog({
  receipt,
  onClose,
}: {
  receipt: ReceiptMessage | null;
  onClose: () => void;
}) {
  const t = useT();
  return (
    <Dialog open={receipt !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("payments.receipt.send")}</DialogTitle>
          <DialogDescription>{receipt?.studentName}</DialogDescription>
        </DialogHeader>
        {receipt && <ReceiptBody receipt={receipt} />}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("payments.receipt.done")}
          </Button>
          {receipt && <OpenWhatsAppButton receipt={receipt} onClick={onClose} />}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Second step of a "Record payment" dialog: the payment is saved, and the
 * admin may now send the parent a receipt (or just close).
 */
export function PaymentRecordedDialog({
  studentName,
  receipt,
  onClose,
}: {
  studentName: string;
  receipt: ReceiptMessage;
  onClose: () => void;
}) {
  const t = useT();
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 shrink-0 text-sea-700" aria-hidden />
            {t("payments.receipt.recorded")}
          </DialogTitle>
          <DialogDescription>
            {studentName} · {t("payments.receipt.offer")}
          </DialogDescription>
        </DialogHeader>
        <ReceiptBody receipt={receipt} />
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            {t("payments.receipt.done")}
          </Button>
          <OpenWhatsAppButton receipt={receipt} onClick={onClose} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * "Send receipt" for row actions and toast actions: `send(kind, id)` loads the
 * receipt, then opens the dialog. Render `dialog` once in the component.
 */
export function useReceiptSender() {
  const [receipt, setReceipt] = useState<ReceiptMessage | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const send = (kind: ReceiptKind, id: string) => {
    setLoadingId(id);
    startTransition(async () => {
      const r = await loadReceipt(kind, id);
      setLoadingId(null);
      if (r) setReceipt(r);
    });
  };

  const dialog = <ReceiptDialog receipt={receipt} onClose={() => setReceipt(null)} />;

  return { send, loadingId, dialog };
}
