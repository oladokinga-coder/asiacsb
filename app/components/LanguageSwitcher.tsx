"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "./LanguageProvider";
import { Globe } from "lucide-react";
import type { Locale } from "@/lib/i18n";

export function LanguageSwitcher() {
  const router = useRouter();
  const { locale, setLocale, locales, localeNames, t } = useI18n();

  function handleLocaleChange(loc: Locale) {
    setLocale(loc);
    router.refresh();
  }

  return (
    <div className="relative group">
      <button
        type="button"
        className="flex items-center gap-2 px-3 py-2 rounded-[var(--radius)] text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)] text-sm font-medium"
        aria-label={t("ariaLanguage")}
      >
        <Globe className="w-4 h-4" />
        <span>{localeNames[locale]}</span>
      </button>
      <div className="absolute top-full right-0 mt-1 py-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-[var(--radius)] shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 min-w-[140px]">
        {locales.map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => handleLocaleChange(loc)}
            className={`block w-full text-left px-4 py-2 text-sm hover:bg-[var(--bg-elevated)] ${
              locale === loc ? "text-[var(--accent)] font-medium" : "text-[var(--text)]"
            }`}
          >
            {localeNames[loc]}
          </button>
        ))}
      </div>
    </div>
  );
}
