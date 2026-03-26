"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "../components/LanguageProvider";
import { ArrowLeftRight, CreditCard, PlusCircle, History, UserPlus, Split } from "lucide-react";

type ActionItem = {
  key: string;
  icon: typeof ArrowLeftRight;
  href?: string;
};

const ACTIONS: ActionItem[] = [
  { key: "overviewTransfer", icon: ArrowLeftRight, href: "/cabinet/transfer" },
  { key: "overviewPay", icon: CreditCard },
  { key: "overviewTopUp", icon: PlusCircle },
  { key: "overviewHistory", icon: History, href: "/cabinet/transactions" },
  { key: "overviewRequest", icon: UserPlus },
  { key: "overviewSplit", icon: Split },
];

const btnClass =
  "w-full flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-[var(--radius)] bg-[var(--bg-elevated)] border border-[var(--border)] hover:border-[var(--accent)]/50 hover:bg-[var(--bg-card)] transition-colors text-[var(--text)]";

export function OverviewActions({
  transferAllowed,
  cardDetailsHidden = false,
}: {
  transferAllowed: boolean;
  cardDetailsHidden?: boolean;
}) {
  const { t } = useI18n();
  const [errorUnder, setErrorUnder] = useState<string | null>(null);

  function handleAction(key: string) {
    setErrorUnder(key);
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
      {ACTIONS.map(({ key, icon: Icon, href }) => {
        const transferOk = transferAllowed && !cardDetailsHidden;
        const effectiveHref =
          key === "overviewTransfer" && href ? (transferOk ? href : undefined) : href;
        if (effectiveHref) {
          return (
            <Link key={key} href={effectiveHref} className={btnClass}>
              <span className="p-2.5 rounded-xl bg-[var(--bg)] border border-[var(--border)]">
                <Icon className="w-5 h-5 text-[var(--accent)]" />
              </span>
              <span className="text-xs font-medium text-center leading-tight">
                {t(key)}
              </span>
            </Link>
          );
        }
        return (
          <div key={key}>
            <button
              type="button"
              onClick={() => handleAction(key)}
              className={btnClass}
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
                {key === "overviewTransfer" ? t("cardReissueUnavailableNow") : t("cardErrorUnavailable")}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
