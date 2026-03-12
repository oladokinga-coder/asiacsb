"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { LOCALES, LOCALE_NAMES, getT, type Locale } from "@/lib/i18n";

const COOKIE_NAME = "csob_locale";

function getStoredLocale(): Locale {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(new RegExp(`(?:^| )${COOKIE_NAME}=([^;]+)`));
  const value = match?.[1] as Locale | undefined;
  return value && LOCALES.includes(value) ? value : "en";
}

function setLocaleCookie(locale: Locale) {
  document.cookie = `${COOKIE_NAME}=${locale};path=/;max-age=31536000`;
}

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  localeNames: typeof LOCALE_NAMES;
  locales: Locale[];
};

const I18nContext = createContext<I18nContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(getStoredLocale());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const lang = locale === "cs" ? "cs" : "en";
      document.documentElement.lang = lang;
    }
  }, [locale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    setLocaleCookie(newLocale);
  }, []);

  const t = getT(locale);

  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t,
        localeNames: LOCALE_NAMES,
        locales: LOCALES,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    return {
      locale: "en" as Locale,
      setLocale: () => {},
      t: (key: string) => key,
      localeNames: LOCALE_NAMES,
      locales: LOCALES,
    };
  }
  return ctx;
}
