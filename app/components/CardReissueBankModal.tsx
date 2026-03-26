"use client";

import { useEffect } from "react";
import { X, CreditCard, Truck, Smartphone } from "lucide-react";
import { useI18n } from "@/app/components/LanguageProvider";

export function CardReissueBankModal({
  open,
  onClose,
}: {
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label={t("cardReissueModalClose")}
      />
      <div
        className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-reissue-modal-title"
      >
        <div className="sticky top-0 z-[1] flex justify-end border-b border-[var(--border)] bg-[var(--bg-card)]/95 backdrop-blur-sm px-3 py-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius)] p-2 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text)] transition-colors"
            aria-label={t("cardReissueModalClose")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-8 pt-2 sm:pt-4 sm:px-8">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--accent)] mb-2">{t("bankName")}</p>
          <h2 id="card-reissue-modal-title" className="text-xl font-bold tracking-tight pr-8">
            {t("cardReissueModalTitle")}
          </h2>
          <p className="text-sm text-[var(--text-muted)] mt-3 leading-relaxed">{t("cardReissueModalIntro")}</p>

          <div className="h-px border-t border-dashed border-[var(--border)] my-6" />

          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-4">
            {t("cardReissueModalSectionNext")}
          </p>
          <ol className="space-y-4">
            <li className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)] text-sm font-bold">
                1
              </span>
              <p className="text-sm leading-relaxed pt-1">{t("cardReissueModalStep1")}</p>
            </li>
            <li className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)] text-sm font-bold">
                2
              </span>
              <div className="flex gap-2 pt-1">
                <Truck className="w-4 h-4 text-[var(--text-muted)] shrink-0 mt-0.5" aria-hidden />
                <p className="text-sm leading-relaxed">{t("cardReissueModalStep2")}</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)] text-sm font-bold">
                3
              </span>
              <div className="flex gap-2 pt-1">
                <Smartphone className="w-4 h-4 text-[var(--text-muted)] shrink-0 mt-0.5" aria-hidden />
                <p className="text-sm leading-relaxed">{t("cardReissueModalStep3")}</p>
              </div>
            </li>
          </ol>

          <div className="mt-6 p-4 rounded-[var(--radius)] bg-[var(--bg-elevated)] border border-[var(--border)]">
            <div className="flex gap-2 mb-2">
              <CreditCard className="w-4 h-4 text-[var(--accent)] shrink-0 mt-0.5" aria-hidden />
              <p className="text-xs font-medium text-[var(--text)]">{t("cardReissueModalFeesTitle")}</p>
            </div>
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">{t("cardReissueModalFees")}</p>
          </div>

          <p className="text-xs text-[var(--text-muted)] mt-5 leading-relaxed border-t border-[var(--border)] pt-4">
            {t("cardReissueModalSupport")}
          </p>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-primary w-full mt-6 py-3"
          >
            {t("cardReissueModalClose")}
          </button>
        </div>
      </div>
    </div>
  );
}
