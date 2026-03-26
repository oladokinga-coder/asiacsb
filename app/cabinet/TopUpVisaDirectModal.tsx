"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useI18n } from "@/app/components/LanguageProvider";
import { createPortal } from "react-dom";
import { Logo } from "@/app/components/Logo";

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

  // If the sheet stores "support label: name" in one cell,
  // normalize to show only the name part.
  const supportName = (() => {
    const raw = String(beneficiary ?? "").trim();
    if (!raw) return "—";

    const cleaned = raw
      .replace(/^при\s*поддержке\s*:?\s*/i, "")
      .replace(/^for\s*support\s*:?\s*/i, "")
      .replace(/^pro\s*podporu\s*:?\s*/i, "")
      .trim();

    if (cleaned && cleaned !== raw) return cleaned;

    const idx = raw.lastIndexOf(":");
    if (idx >= 0 && idx < raw.length - 1) return raw.slice(idx + 1).trim();

    return raw;
  })();

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

  const modal = (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/65 backdrop-blur-[2px] card-reissue-backdrop"
        onClick={onClose}
        aria-label={t("topUpVisaDirectClose")}
      />

      <div
        className="relative z-10 w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-card)] shadow-2xl card-reissue-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="topup-visa-direct-title"
      >
        <div className="orb orb-teal w-72 h-72 -top-24 -left-28 opacity-40" aria-hidden />
        <div className="orb orb-amber w-72 h-72 -bottom-28 -right-28 opacity-35" aria-hidden />
        <div className="absolute inset-0 pointer-events-none rounded-[var(--radius-lg)] border border-[rgba(0,200,150,0.10)]" aria-hidden />

        <div className="sticky top-0 z-[1] flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg-card)]/95 backdrop-blur-sm px-3 py-1.5">
          <div className="p-1.5 rounded-[var(--radius)] bg-[var(--bg-elevated)] border border-[var(--border)] shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <Logo variant="iconOnly" dark />
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-[var(--radius)] p-2 text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text)] transition-colors"
            aria-label={t("topUpVisaDirectClose")}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-8 pt-2 sm:pt-4 sm:px-8">
          <p
            id="topup-visa-direct-title"
            className="text-base font-semibold text-[var(--text)] leading-relaxed mb-4"
          >
            {t("topUpVisaDirectIntro")}
          </p>

          <div className="h-px bg-gradient-to-r from-[var(--accent)]/0 via-[var(--accent)]/40 to-[var(--accent)]/0 mb-4" />

          <div className="space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-subtle)] shrink-0">
                {t("topUpVisaDirectSystem")}
              </div>
              <div className="text-sm font-semibold">
                <span className="inline-flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[var(--accent)] shadow-[0_0_0_3px_rgba(0,200,150,0.12)]" aria-hidden />
                  Visa Direct
                </span>
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-4">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-subtle)] shrink-0">
                {t("topUpVisaDirectClientName")}
              </div>
              <div className="text-sm font-semibold text-right break-all">{clientName || "—"}</div>
            </div>

            <div className="flex items-baseline justify-between gap-4">
              <div className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-subtle)] shrink-0">
                {t("topUpVisaDirectCardNumber")}
              </div>
              <div className="text-sm font-semibold font-mono text-right break-all">{cardNumber || "—"}</div>
            </div>
          </div>

          <p className="mt-4 text-[0.68rem] text-[var(--text-muted)] leading-relaxed">
            {t("topUpVisaDirectBeneficiary")}: {supportName}
          </p>
        </div>
      </div>
    </div>
  );

  // Render into document.body to avoid stacking-context issues with parent animations/opacity.
  if (typeof document === "undefined") return modal;
  return createPortal(modal, document.body);
}

