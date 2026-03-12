"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, LayoutDashboard, CreditCard, History, LogOut, User } from "lucide-react";
import { useI18n } from "../components/LanguageProvider";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { Logo } from "../components/Logo";

export default function CabinetNav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const nav = [
    { href: "/cabinet", label: t("navOverview"), icon: LayoutDashboard },
    { href: "/cabinet/card", label: t("navCard"), icon: CreditCard },
    { href: "/cabinet/transactions", label: t("navHistory"), icon: History },
    { href: "/cabinet/profile", label: t("navProfile"), icon: User },
  ];

  return (
    <header className="border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur sticky top-0 z-50">
      <div className="container flex items-center justify-between gap-2 h-14 sm:h-16 min-h-[56px]">
        <Link href="/cabinet" className="flex items-center gap-2 font-semibold text-lg sm:text-xl shrink-0 min-w-0">
          <Logo variant="full" />
        </Link>

        {/* Desktop: nav + language + logout */}
        <div className="hidden md:flex items-center gap-2 shrink-0">
          <nav className="flex items-center gap-1" aria-label={t("ariaMenu")}>
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-[var(--radius)] text-sm font-medium ${
                  pathname === href
                    ? "bg-[var(--bg-elevated)] text-[var(--accent)]"
                    : "text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-elevated)]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>
          <LanguageSwitcher />
          <button type="button" onClick={logout} className="btn btn-ghost flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--danger)]" aria-label={t("navLogout")}>
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">{t("navLogout")}</span>
          </button>
        </div>

        {/* Mobile: language + logout in header */}
        <div className="flex md:hidden items-center gap-1 shrink-0">
          <LanguageSwitcher />
          <button type="button" onClick={logout} className="p-2.5 rounded-[var(--radius)] text-[var(--text-muted)] hover:text-[var(--danger)] hover:bg-[var(--bg-elevated)] touch-manipulation" aria-label={t("navLogout")}>
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile: horizontal nav tabs */}
      <div className="md:hidden border-t border-[var(--border)] overflow-x-auto overflow-y-hidden">
        <div className="container flex gap-1 py-2 min-w-0">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius)] text-sm font-medium whitespace-nowrap shrink-0 touch-manipulation ${
                pathname === href
                  ? "bg-[var(--bg-elevated)] text-[var(--accent)]"
                  : "text-[var(--text-muted)]"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
