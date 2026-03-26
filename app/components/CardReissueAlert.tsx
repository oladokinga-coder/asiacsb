"use client";

import { AlertTriangle } from "lucide-react";
import { useI18n } from "@/app/components/LanguageProvider";

export function CardReissueAlert() {
  const { t } = useI18n();
  return (
    <div
      className="mb-6 p-4 rounded-[var(--radius)] border border-amber-500/35 bg-amber-500/[0.08] text-[var(--text)]"
      role="alert"
    >
      <div className="flex gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" aria-hidden />
        <div>
          <p className="font-semibold text-amber-200/95">{t("cardReissueRequiredTitle")}</p>
          <p className="text-sm text-[var(--text-muted)] mt-2 leading-relaxed">{t("cardReissueRequiredBody")}</p>
        </div>
      </div>
    </div>
  );
}
