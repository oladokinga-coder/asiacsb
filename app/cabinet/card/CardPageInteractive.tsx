"use client";

import { useState, useCallback } from "react";
import { Lock } from "lucide-react";
import { useI18n } from "@/app/components/LanguageProvider";
import { formatCardNumberForDisplay } from "@/lib/card-format";
import { VisaLogo } from "@/app/components/VisaLogo";
import { CardReissueAlert } from "@/app/components/CardReissueAlert";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { CardActions } from "./CardActions";

export function CardPageInteractive({
  name,
  cardNumber,
  cardValid,
  cardCvv,
  cardDetailsHidden,
}: {
  name: string;
  cardNumber: string;
  cardValid: string;
  cardCvv: string;
  cardDetailsHidden: boolean;
}) {
  const { t } = useI18n();
  const [isBlocked, setIsBlocked] = useState(false);
  const [unlockFlash, setUnlockFlash] = useState(false);
  const [confirmBlockOpen, setConfirmBlockOpen] = useState(false);
  const [confirmUnlockOpen, setConfirmUnlockOpen] = useState(false);

  const isEmpty =
    !cardDetailsHidden && (cardNumber === "—" || !cardNumber) && (cardValid === "—" || !cardValid);

  const confirmBlock = useCallback(() => {
    setIsBlocked(true);
    setConfirmBlockOpen(false);
  }, []);

  const confirmUnlock = useCallback(() => {
    setIsBlocked(false);
    setConfirmUnlockOpen(false);
    setUnlockFlash(true);
    window.setTimeout(() => setUnlockFlash(false), 900);
  }, []);

  const displayNumber = cardDetailsHidden ? cardNumber : formatCardNumberForDisplay(cardNumber);

  return (
    <>
      <h1 className="text-2xl font-bold mb-2 animate-fade-in-up">{t("cardTitle")}</h1>
      <p className="text-[var(--text-muted)] mb-8 animate-fade-in-up" style={{ animationDelay: "0.05s", opacity: 0 }}>
        {t("cardSubtitle")}
      </p>

      {cardDetailsHidden && <CardReissueAlert />}

      <div className="max-w-md">
        <div
          className={`bank-card relative overflow-hidden animate-float animate-scale-in card-hover-lift transition-[box-shadow,filter] duration-500 ${
            isBlocked ? "card-bank-locked" : ""
          } ${unlockFlash ? "card-bank-unlock-flash" : ""}`}
          style={{ animationDelay: "0.1s", opacity: 0 }}
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
          <p className="text-sm text-[var(--text-muted)] mb-1">{t("cardNameLabel")}</p>
          <p className="font-semibold mb-4">{name.toUpperCase()}</p>
          <div className={`card-number mono ${isBlocked ? "blur-[1px] opacity-90" : ""}`}>{displayNumber}</div>
          <div className={`card-meta flex flex-wrap items-center gap-x-4 gap-y-1 ${isBlocked ? "blur-[1px] opacity-90" : ""}`}>
            <span>
              {t("cardValidUntil")} {cardValid}
            </span>
            {cardCvv !== "—" && cardCvv && (
              <span>
                {t("cardCvv")}: {cardCvv}
              </span>
            )}
          </div>
        </div>

        {cardDetailsHidden ? (
          <p className="mt-4 text-sm text-[var(--text-muted)] animate-fade-in-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
            {t("cardReissuePendingNote")}
          </p>
        ) : isEmpty ? (
          <p className="mt-4 text-sm text-[var(--text-muted)] animate-fade-in-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
            {t("cardEmpty")}
          </p>
        ) : (
          <p className="mt-4 text-sm text-[var(--text-muted)] animate-fade-in-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
            {t("cardBound")}
          </p>
        )}

        <div className="animate-fade-in-up" style={{ animationDelay: "0.25s", opacity: 0 }}>
          <CardActions
            reissueFlowActive={cardDetailsHidden}
            isBlocked={isBlocked}
            onBlockRequest={() => setConfirmBlockOpen(true)}
            onUnlockRequest={() => setConfirmUnlockOpen(true)}
          />
        </div>
      </div>

      <ConfirmDialog
        open={confirmBlockOpen}
        onClose={() => setConfirmBlockOpen(false)}
        title={t("cardBlockConfirmTitle")}
        message={t("cardBlockConfirmMessage")}
        confirmLabel={t("dialogConfirm")}
        cancelLabel={t("dialogCancel")}
        onConfirm={confirmBlock}
        variant="danger"
      />
      <ConfirmDialog
        open={confirmUnlockOpen}
        onClose={() => setConfirmUnlockOpen(false)}
        title={t("cardUnlockConfirmTitle")}
        message={t("cardUnlockConfirmMessage")}
        confirmLabel={t("dialogConfirm")}
        cancelLabel={t("dialogCancel")}
        onConfirm={confirmUnlock}
        variant="default"
      />
    </>
  );
}
