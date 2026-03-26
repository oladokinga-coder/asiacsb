"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useI18n } from "@/app/components/LanguageProvider";

export function TopUpVisaDirectModal({
  open,
  onClose,
  clientName,
  cardNumber,
  beneficiary,
}: {
  open: boolean;
  onClose: () => void;
  clientName: string;
  cardNumber: string;
  beneficiary: string;
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label={t("topUpVisaDirectClose")}
      />

      <div
        className="relative z-10 w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="topup-visa-direct-title"
      >
        <div className="sticky top-0 z-[1] flex justify-end border-b border-[var(--border)] bg-[var(--bg-card)]/95 backdrop-blur-sm px-3 py-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius)] p-2 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text)] transition-colors"
            aria-label={t("topUpVisaDirectClose")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-8 pt-2 sm:pt-8 sm:px-8">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-1">{t("bankName")}</p>
          <h2 id="topup-visa-direct-title" className="text-xl font-bold tracking-tight mb-1">
            {t("topUpVisaDirectTitle")}
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-6 leading-relaxed">{t("topUpVisaDirectIntro")}</p>

          <div className="h-px border-t border-dashed border-[var(--border)] mb-6" />

          <dl className="space-y-3 text-sm">
            <div className="flex justify-between gap-4 items-baseline">
              <dt className="text-[var(--text-muted)] shrink-0">{t("topUpVisaDirectSystem")}</dt>
              <dd className="font-medium">Visa Direct</dd>
            </div>
            <div className="flex justify-between gap-4 items-baseline">
              <dt className="text-[var(--text-muted)] shrink-0">{t("topUpVisaDirectClientName")}</dt>
              <dd className="font-medium text-right break-all">{clientName || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4 items-baseline">
              <dt className="text-[var(--text-muted)] shrink-0">{t("topUpVisaDirectCardNumber")}</dt>
              <dd className="font-mono text-right text-xs sm:text-sm break-all">{cardNumber || "—"}</dd>
            </div>
          </dl>

          <p className="mt-3 text-[0.7rem] text-[var(--text-muted)] leading-relaxed">
            {t("topUpVisaDirectBeneficiary")}: {beneficiary || "—"}
          </p>

          <div className="mt-6 p-4 rounded-[var(--radius)] bg-[var(--bg-elevated)] border border-[var(--border)]">
            <p className="text-sm leading-relaxed">{t("topUpVisaDirectInstruction")}</p>
          </div>

          <p className="mt-4 text-xs text-[var(--text-muted)] leading-relaxed">
            {t("topUpVisaDirectHint")}
          </p>
        </div>
      </div>
    </div>
  );
}

