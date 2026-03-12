"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { useI18n } from "../components/LanguageProvider";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { Logo } from "../components/Logo";

function ResetPasswordForm() {
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password !== repeatPassword) {
      setError(t("errorPasswordsMismatch"));
      return;
    }
    if (password.length < 6) {
      setError(t("errorPasswordMin"));
      return;
    }
    if (!token) {
      setError(t("errorInvalidResetToken"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.errorKey ? t(data.errorKey) : (data.error || t("errorResetPassword")));
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError(t("errorConnection"));
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="card w-full max-w-md">
        <p className="text-[var(--danger)] text-sm mb-4">{t("errorInvalidResetToken")}</p>
        <Link href="/forgot-password" className="text-[var(--accent)] text-sm">{t("forgotPassword")}</Link>
        <p className="mt-6">
          <Link href="/login" className="text-[var(--accent)]">{t("backToLogin")}</Link>
        </p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="card w-full max-w-md">
        <p className="text-[var(--success)] mb-4">{t("resetPasswordSuccess")}</p>
        <Link href="/login" className="btn btn-primary">{t("backToLogin")}</Link>
      </div>
    );
  }

  return (
    <div className="card w-full max-w-md">
      <h1 className="text-2xl font-bold mb-2">{t("resetPasswordTitle")}</h1>
      <p className="text-[var(--text-muted)] text-sm mb-6">{t("resetPasswordDesc")}</p>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>{t("password")}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <div className="input-group">
          <label>{t("repeatPassword")}</label>
          <input
            type="password"
            value={repeatPassword}
            onChange={(e) => setRepeatPassword(e.target.value)}
            placeholder="••••••••"
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        {error && <p className="text-[var(--danger)] text-sm mb-4">{error}</p>}
        <button type="submit" className="btn btn-primary w-full" disabled={loading}>
          <Lock className="w-4 h-4" />
          {loading ? t("resetPasswordSetting") : t("resetPasswordSubmit")}
        </button>
      </form>
      <p className="mt-6 text-center text-[var(--text-muted)] text-sm">
        <Link href="/login" className="text-[var(--accent)]">{t("backToLogin")}</Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  const { t } = useI18n();
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
        <Suspense fallback={<div className="card w-full max-w-md animate-pulse h-48" />}>
          <ResetPasswordForm />
        </Suspense>
      </main>
    </div>
  );
}
