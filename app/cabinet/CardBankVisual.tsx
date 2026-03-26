"use client";

import type { CSSProperties } from "react";
import { Lock } from "lucide-react";
import { useI18n } from "@/app/components/LanguageProvider";
import { formatCardNumberForDisplay } from "@/lib/card-format";
import { VisaLogo } from "@/app/components/VisaLogo";

type Props = {
  isBlocked: boolean;
  unlockFlash?: boolean;
  name?: string;
  cardNumber: string;
  cardValid: string;
  cardCvv?: string;
  cardDetailsHidden: boolean;
  /** обзор: только номер и срок */
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function CardBankVisual({
  isBlocked,
  unlockFlash = false,
  name,
  cardNumber,
  cardValid,
  cardCvv,
  cardDetailsHidden,
  compact = false,
  className = "",
  style,
}: Props) {
  const { t } = useI18n();
  const displayNumber = cardDetailsHidden ? cardNumber : formatCardNumberForDisplay(cardNumber);

  return (
    <div
      className={`bank-card relative overflow-hidden card-hover-lift transition-[box-shadow,filter] duration-500 ${
        isBlocked ? "card-bank-locked" : ""
      } ${unlockFlash ? "card-bank-unlock-flash" : ""} ${className}`}
      style={style}
    >
      {isBlocked && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[inherit] bg-[#0a0e14]/88 backdrop-blur-[4px] border-2 border-[var(--danger)]/45 animate-card-lock-overlay"
          aria-hidden
        >
          <div className="rounded-full bg-[var(--danger)]/15 p-4 mb-2 ring-2 ring-[var(--danger)]/30 card-lock-icon">
            <Lock className="w-14 h-14 text-[var(--danger)]" strokeWidth={1.5} />
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[var(--text-muted)]">
            {t("cardLockedLabel")}
          </p>
        </div>
      )}

      <span className="card-logo">
        <VisaLogo />
      </span>
      <div className="card-chip" />
      {!compact && (
        <>
          <p className="text-sm text-[var(--text-muted)] mb-1">{t("cardNameLabel")}</p>
          <p className="font-semibold mb-4">{name?.toUpperCase() ?? ""}</p>
        </>
      )}
      <div className={`card-number mono ${isBlocked ? "blur-[1px] opacity-90" : ""}`}>{displayNumber}</div>
      <div className={`card-meta flex flex-wrap items-center gap-x-4 gap-y-1 ${isBlocked ? "blur-[1px] opacity-90" : ""}`}>
        <span>
          {t("cardValidUntil")} {cardValid}
        </span>
        {!compact && cardCvv && cardCvv !== "—" && (
          <span>
            {t("cardCvv")}: {cardCvv}
          </span>
        )}
      </div>
    </div>
  );
}
