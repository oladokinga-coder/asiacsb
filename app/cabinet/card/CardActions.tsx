"use client";

import { useState } from "react";
import { useI18n } from "../../components/LanguageProvider";
import { Lock, Snowflake, Sliders, KeyRound, RefreshCw, CreditCard } from "lucide-react";

const ACTIONS = [
  { key: "cardBlock", icon: Lock },
  { key: "cardFreeze", icon: Snowflake },
  { key: "cardLimits", icon: Sliders },
  { key: "cardChangePin", icon: KeyRound },
  { key: "cardReissue", icon: RefreshCw },
  { key: "cardAddCard", icon: CreditCard },
] as const;

export function CardActions() {
  const { t } = useI18n();
  const [errorUnder, setErrorUnder] = useState<string | null>(null);

  function handleAction(key: string) {
    setErrorUnder(key);
  }

  return (
    <div className="mt-8 max-w-md">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ACTIONS.map(({ key, icon: Icon }) => (
          <div key={key}>
            <button
              type="button"
              onClick={() => handleAction(key)}
              className="w-full flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-[var(--radius)] bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)] transition-colors text-[var(--text)]"
            >
              <span className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                <Icon className="w-5 h-5 text-[var(--accent)]" />
              </span>
              <span className="text-xs font-medium text-center leading-tight">
                {t(key)}
              </span>
            </button>
            {errorUnder === key && (
              <p className="mt-2 text-sm text-[var(--danger)] font-medium">
                {t("cardErrorUnavailable")}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
