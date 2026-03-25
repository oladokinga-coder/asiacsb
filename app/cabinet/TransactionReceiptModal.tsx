"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useI18n } from "@/app/components/LanguageProvider";
import { formatEur } from "@/lib/currency";
import type { SheetTransaction } from "@/lib/sheets";

function receiptReferenceId(tx: SheetTransaction): string {
  const raw = tx.id.trim();
  if (raw) return raw;
  const amt = Math.round(tx.amount * 100) / 100;
  return `REF-${tx.date.replace(/\D/g, "")}-${String(amt).replace(".", "")}`;
}

function statusLabelForReceipt(tx: SheetTransaction, t: (k: string) => string): string {
  const isCredit = tx.amount >= 0;
  if (isCredit) return t("receiptStatusCompleted");
  if (tx.status === "pending") return t("txStatusPending");
  if (tx.status === "ok") return t("txStatusSent");
  if (tx.status === "no") return t("txStatusCancelled");
  return t("txStatusPending");
}

export function TransactionReceiptModal({
  tx,
  open,
  onClose,
}: {
  tx: SheetTransaction | null;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !tx) return null;

  const isCredit = tx.amount >= 0;
  const refId = receiptReferenceId(tx);

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label={t("receiptClose")}
      />
      <div
        className="relative z-10 w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] shadow-[0_-8px_40px_rgba(0,0,0,0.45)] sm:shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="receipt-heading"
      >
        <div className="sticky top-0 flex justify-end border-b border-[var(--border)] bg-[var(--bg-card)]/95 backdrop-blur-sm px-3 py-2 sm:absolute sm:right-2 sm:top-2 sm:border-0 sm:bg-transparent">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius)] p-2 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text)] transition-colors"
            aria-label={t("receiptClose")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-8 pt-2 sm:pt-8 sm:px-8">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-1">{t("bankName")}</p>
          <h2 id="receipt-heading" className="text-xl font-bold tracking-tight mb-1">
            {t("receiptTitle")}
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-6">{t("receiptSubtitle")}</p>

          <div className="h-px border-t border-dashed border-[var(--border)] mb-6" />

          <dl className="space-y-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--text-muted)] shrink-0">{t("receiptReference")}</dt>
              <dd className="font-mono text-right text-xs sm:text-sm break-all">{refId}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--text-muted)] shrink-0">{t("receiptDate")}</dt>
              <dd className="text-right">{tx.date || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--text-muted)] shrink-0">{t("receiptFlow")}</dt>
              <dd className="text-right font-medium">{isCredit ? t("receiptIncoming") : t("receiptOutgoing")}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--text-muted)] shrink-0">{t("receiptType")}</dt>
              <dd className="text-right">{tx.type?.trim() || "—"}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-[var(--text-muted)]">{t("receiptDescription")}</dt>
              <dd className="text-[var(--text)] leading-snug">{tx.description?.trim() || "—"}</dd>
            </div>
            <div className="h-px border-t border-[var(--border)] my-2" />
            <div className="flex justify-between gap-4 items-baseline">
              <dt className="text-[var(--text-muted)]">{t("receiptAmount")}</dt>
              <dd className={`font-semibold mono text-lg ${isCredit ? "text-[var(--accent)]" : "text-[var(--danger)]"}`}>
                {formatEur(tx.amount, { sign: true })}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--text-muted)] shrink-0">{t("receiptStatus")}</dt>
              <dd className="text-right font-medium">{statusLabelForReceipt(tx, t)}</dd>
            </div>
          </dl>

          <p className="mt-8 text-xs text-[var(--text-muted)] leading-relaxed border-t border-[var(--border)] pt-4">
            {t("receiptFooter")}
          </p>
        </div>
      </div>
    </div>
  );
}
