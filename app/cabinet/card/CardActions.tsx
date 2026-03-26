"use client";

import { useState } from "react";
import { useI18n } from "../../components/LanguageProvider";
import { Lock, Snowflake, Sliders, KeyRound, RefreshCw, CreditCard, Unlock } from "lucide-react";
import { CardReissueBankModal } from "@/app/components/CardReissueBankModal";

const OTHER_ACTIONS = [
  { key: "cardFreeze", icon: Snowflake },
  { key: "cardLimits", icon: Sliders },
  { key: "cardChangePin", icon: KeyRound },
  { key: "cardReissue", icon: RefreshCw },
  { key: "cardAddCard", icon: CreditCard },
] as const;

export function CardActions({
  reissueFlowActive = false,
  isBlocked = false,
  onBlockRequest,
  onUnlockRequest,
}: {
  reissueFlowActive?: boolean;
  isBlocked?: boolean;
  onBlockRequest?: () => void;
  onUnlockRequest?: () => void;
}) {
  const { t } = useI18n();
  const [errorUnder, setErrorUnder] = useState<string | null>(null);
  const [reissueModalOpen, setReissueModalOpen] = useState(false);

  const blockInteractive = Boolean(onBlockRequest && onUnlockRequest);

  function handleAction(key: string) {
    if (key === "cardReissue" && reissueFlowActive) {
      setReissueModalOpen(true);
      setErrorUnder(null);
      return;
    }
    setErrorUnder(key);
  }

  return (
    <div className="mt-8 max-w-md">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {blockInteractive ? (
          <div>
            <button
              type="button"
              onClick={() => (isBlocked ? onUnlockRequest?.() : onBlockRequest?.())}
              className={`w-full flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-[var(--radius)] bg-[var(--bg-elevated)] border transition-colors text-[var(--text)] ${
                isBlocked
                  ? "border-[var(--accent)]/45 ring-2 ring-[var(--accent)]/20 hover:border-[var(--accent)]/55 hover:bg-[var(--bg-card)]"
                  : "border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]"
              }`}
            >
              <span className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                {isBlocked ? (
                  <Unlock className="w-5 h-5 text-[var(--accent)]" />
                ) : (
                  <Lock className="w-5 h-5 text-[var(--accent)]" />
                )}
              </span>
              <span className="text-xs font-medium text-center leading-tight">
                {isBlocked ? t("cardUnlock") : t("cardBlock")}
              </span>
            </button>
          </div>
        ) : (
          <div>
            <button
              type="button"
              onClick={() => handleAction("cardBlock")}
              className="w-full flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-[var(--radius)] bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)] transition-colors text-[var(--text)]"
            >
              <span className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                <Lock className="w-5 h-5 text-[var(--accent)]" />
              </span>
              <span className="text-xs font-medium text-center leading-tight">{t("cardBlock")}</span>
            </button>
            {errorUnder === "cardBlock" && (
              <p className="mt-2 text-sm text-[var(--danger)] font-medium">{t("cardServiceBranchOnly")}</p>
            )}
          </div>
        )}

        {OTHER_ACTIONS.map(({ key, icon: Icon }) => (
          <div key={key}>
            <button
              type="button"
              onClick={() => handleAction(key)}
              className={`w-full flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-[var(--radius)] bg-[var(--bg-elevated)] border transition-colors text-[var(--text)] ${
                key === "cardReissue" && reissueFlowActive
                  ? "border-[var(--accent)]/45 ring-2 ring-[var(--accent)]/25 hover:border-[var(--accent)]/60 hover:bg-[var(--bg-card)]"
                  : "border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)]"
              }`}
            >
              <span className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                <Icon className="w-5 h-5 text-[var(--accent)]" />
              </span>
              <span className="text-xs font-medium text-center leading-tight">{t(key)}</span>
            </button>
            {errorUnder === key && (
              <p className="mt-2 text-sm text-[var(--danger)] font-medium">{t("cardServiceBranchOnly")}</p>
            )}
          </div>
        ))}
      </div>
      <CardReissueBankModal open={reissueModalOpen} onClose={() => setReissueModalOpen(false)} />
    </div>
  );
}
