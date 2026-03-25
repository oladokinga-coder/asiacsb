"use client";

import { useState } from "react";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { useI18n } from "@/app/components/LanguageProvider";
import { formatEur } from "@/lib/currency";
import type { SheetTransaction } from "@/lib/sheets";
import { TransactionReceiptModal } from "./TransactionReceiptModal";

export function TransactionRow({ tx }: { tx: SheetTransaction }) {
  const { t } = useI18n();
  const [receiptOpen, setReceiptOpen] = useState(false);
  const isCredit = tx.amount >= 0;
  const debitPending = !isCredit && tx.status === "pending";
  const debitOk = !isCredit && tx.status === "ok";
  const debitNo = !isCredit && tx.status === "no";

  let iconWrap = "bg-[var(--accent)]/20 text-[var(--accent)]";
  let Icon = ArrowDownLeft;
  if (!isCredit) {
    Icon = ArrowUpRight;
    if (debitPending) iconWrap = "bg-amber-500/20 text-amber-400";
    else if (debitOk) iconWrap = "bg-[var(--danger)]/20 text-[var(--danger)]";
    else if (debitNo) iconWrap = "bg-[var(--text-muted)]/25 text-[var(--text-muted)]";
    else iconWrap = "bg-[var(--danger)]/20 text-[var(--danger)]";
  }

  let amountClass = isCredit ? "text-[var(--accent)]" : "text-[var(--danger)]";
  if (debitPending) amountClass = "text-amber-400";
  if (debitOk) amountClass = "text-[var(--danger)]";
  if (debitNo) amountClass = "text-[var(--text-muted)] line-through decoration-[var(--text-muted)]";

  let statusLabel: string | null = null;
  if (!isCredit) {
    if (debitPending) statusLabel = t("txStatusPending");
    else if (debitOk) statusLabel = t("txStatusSent");
    else if (debitNo) statusLabel = t("txStatusCancelled");
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => setReceiptOpen(true)}
        className="w-full py-4 flex items-center justify-between gap-4 text-left rounded-[var(--radius)] -mx-1 px-1 hover:bg-[var(--bg-elevated)]/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className={`p-2 rounded-[var(--radius)] shrink-0 ${iconWrap}`}>
            <Icon className="w-4 h-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-medium truncate">{tx.description || (isCredit ? t("credit") : t("debit"))}</p>
            <p className="text-sm text-[var(--text-muted)]">{tx.date}</p>
            {statusLabel && (
              <p className="text-xs font-medium mt-1 text-[var(--text-muted)]">{statusLabel}</p>
            )}
          </div>
        </div>
        <span className={`font-semibold mono shrink-0 ${amountClass}`}>{formatEur(tx.amount, { sign: true })}</span>
      </button>
      <TransactionReceiptModal tx={tx} open={receiptOpen} onClose={() => setReceiptOpen(false)} />
    </li>
  );
}
