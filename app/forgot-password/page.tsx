"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { useI18n } from "../components/LanguageProvider";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { Logo } from "../components/Logo";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setSent(false);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.errorKey ? t(data.errorKey) : (data.error || t("errorForgotPassword")));
        return;
      }
      setSent(true);
    } catch {
      setError(t("errorConnection"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-[var(--border)]">
        <div className="container flex items-center justify-between gap-2 h-14 sm:h-16 min-h-[56px]">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg sm:text-xl shrink-0 min-w-0">
            <Logo variant="full" />
          </Link>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <LanguageSwitcher />
            <Link href="/login" className="btn btn-secondary text-sm sm:text-base touch-manipulation">{t("navLogin")}</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="card w-full max-w-md">
          <h1 className="text-2xl font-bold mb-2">{t("forgotPasswordTitle")}</h1>
          <p className="text-[var(--text-muted)] text-sm mb-6">{t("forgotPasswordDesc")}</p>
          {sent ? (
            <p className="text-[var(--success)] text-sm mb-6">{t("forgotPasswordSuccess")}</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label>{t("email")}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  required
                  autoComplete="email"
                />
              </div>
              {error && <p className="text-[var(--danger)] text-sm mb-4">{error}</p>}
              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                <Mail className="w-4 h-4" />
                {loading ? t("forgotPasswordSending") : t("forgotPasswordSubmit")}
              </button>
            </form>
          )}
          <p className="mt-6 text-center text-[var(--text-muted)] text-sm">
            <Link href="/login" className="text-[var(--accent)]">{t("backToLogin")}</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
