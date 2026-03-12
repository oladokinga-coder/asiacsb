"use client";

import { useId } from "react";

/**
 * Логотип ČSOB Asia: абстрактная синяя форма (сфера + волна), текст ČSOB, Asia с солнцем и волной.
 * Варианты: iconOnly (только иконка), full (иконка + текст), для светлого/тёмного фона.
 */
export function Logo({
  variant = "full",
  className = "",
  dark = true,
}: {
  variant?: "iconOnly" | "full";
  className?: string;
  dark?: boolean;
}) {
  const id = useId().replace(/:/g, "");
  const blueLight = dark ? "#7dd3fc" : "#0ea5e9";
  const blueDark = dark ? "#1e3a5f" : "#1e40af";
  const csobColor = dark ? "#f0f6fc" : "#0f172a";
  const asiaRed = "#dc2626";
  const sunYellow = "#fbbf24";
  const sunOrange = "#f59e0b";

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={variant === "iconOnly" ? 40 : 44}
        height={variant === "iconOnly" ? 40 : 44}
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden
      >
        <defs>
          <linearGradient id={`${id}-sphere`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={blueLight} stopOpacity={1} />
            <stop offset="100%" stopColor={blueDark} stopOpacity={0.9} />
          </linearGradient>
          <linearGradient id={`${id}-bar`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#93c5fd" stopOpacity={0.95} />
            <stop offset="100%" stopColor={blueDark} stopOpacity={1} />
          </linearGradient>
          <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25" />
          </filter>
          <linearGradient id={`${id}-sun`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={sunYellow} />
            <stop offset="100%" stopColor={sunOrange} />
          </linearGradient>
        </defs>
        <circle cx="22" cy="14" r="10" fill={`url(#${id}-sphere)`} filter={`url(#${id}-shadow)`} />
        <path
          d="M6 28 Q14 24 22 28 T38 28 L40 32 L4 32 Z"
          fill={`url(#${id}-bar)`}
          filter={`url(#${id}-shadow)`}
        />
      </svg>

      {variant === "full" && (
        <span className="flex flex-col leading-none">
          <span
            className="font-bold text-lg sm:text-xl tracking-tight"
            style={{ color: csobColor }}
          >
            ČSOB
          </span>
          <span className="relative inline-block">
            <span className="flex items-baseline gap-0.5">
              <span className="font-bold text-lg sm:text-xl tracking-tight" style={{ color: asiaRed }}>
                Asi
              </span>
              <span className="relative inline-flex">
                <span
                  className="font-bold text-lg sm:text-xl tracking-tight align-bottom"
                  style={{ color: asiaRed }}
                >
                  a
                </span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 10 10"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full"
                  aria-hidden
                >
                  <circle cx="5" cy="5" r="2.5" fill={`url(#${id}-sun)`} />
                  <path
                    d="M5 1 L5 2 M5 8 L5 9 M1 5 L2 5 M8 5 L9 5 M2.2 2.2 L2.8 2.8 M7.2 7.2 L7.8 7.8 M7.2 2.2 L7.8 2.8 M2.2 7.2 L2.8 7.8"
                    stroke={sunOrange}
                    strokeWidth="0.6"
                    fill="none"
                  />
                </svg>
              </span>
            </span>
            <span
              className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full opacity-70"
              style={{ background: `linear-gradient(90deg, transparent, ${asiaRed}, transparent)` }}
            />
          </span>
        </span>
      )}
    </div>
  );
}
