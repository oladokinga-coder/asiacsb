"use client";

import { useState, useCallback } from "react";
import { useI18n } from "@/app/components/LanguageProvider";
import { CardReissueAlert } from "@/app/components/CardReissueAlert";
import { ConfirmDialog } from "@/app/components/ConfirmDialog";
import { useCardBlocked } from "@/hooks/useCardBlocked";
import { CardBankVisual } from "../CardBankVisual";
import { CardActions } from "./CardActions";

export function CardPageInteractive({
  userId,
  name,
  cardNumber,
  cardValid,
  cardCvv,
  cardDetailsHidden,
}: {
  userId: string;
  name: string;
  cardNumber: string;
  cardValid: string;
  cardCvv: string;
  cardDetailsHidden: boolean;
}) {
  const { t } = useI18n();
  const { blocked: isBlocked, setBlocked } = useCardBlocked(userId);
  const [unlockFlash, setUnlockFlash] = useState(false);
  const [confirmBlockOpen, setConfirmBlockOpen] = useState(false);
  const [confirmUnlockOpen, setConfirmUnlockOpen] = useState(false);

  const isEmpty =
    !cardDetailsHidden && (cardNumber === "—" || !cardNumber) && (cardValid === "—" || !cardValid);

  const confirmBlock = useCallback(() => {
    setBlocked(true);
    setConfirmBlockOpen(false);
  }, [setBlocked]);

  const confirmUnlock = useCallback(() => {
    setBlocked(false);
    setConfirmUnlockOpen(false);
    setUnlockFlash(true);
    window.setTimeout(() => setUnlockFlash(false), 900);
  }, [setBlocked]);

  return (
    <>
      <h1 className="text-2xl font-bold mb-2 animate-fade-in-up">{t("cardTitle")}</h1>
      <p className="text-[var(--text-muted)] mb-8 animate-fade-in-up" style={{ animationDelay: "0.05s", opacity: 0 }}>
        {t("cardSubtitle")}
      </p>

      {cardDetailsHidden && <CardReissueAlert />}

      <div className="max-w-md">
        <CardBankVisual
          isBlocked={isBlocked}
          unlockFlash={unlockFlash}
          name={name}
          cardNumber={cardNumber}
          cardValid={cardValid}
          cardCvv={cardCvv}
          cardDetailsHidden={cardDetailsHidden}
          className="animate-float animate-scale-in"
          style={{ animationDelay: "0.1s", opacity: 0 }}
        />

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
