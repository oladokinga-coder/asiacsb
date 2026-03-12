"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, LogIn } from "lucide-react";
import { useI18n } from "../components/LanguageProvider";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { Logo } from "../components/Logo";

export default function LoginPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.errorKey ? t(data.errorKey) : (data.error || t("errorLogin")));
        return;
      }
      router.push("/cabinet");
      router.refresh();
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
            <Link href="/register" className="btn btn-secondary text-sm sm:text-base touch-manipulation">{t("navRegister")}</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="card w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6">{t("loginTitle")}</h1>
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
            <div className="input-group">
              <div className="flex items-center justify-between gap-2">
                <label>{t("password")}</label>
                <Link href="/forgot-password" className="text-sm text-[var(--accent)]">{t("forgotPassword")}</Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            {error && <p className="text-[var(--danger)] text-sm mb-4">{error}</p>}
            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              <LogIn className="w-4 h-4" />
              {loading ? t("signingIn") : t("signIn")}
            </button>
          </form>
          <p className="mt-6 text-center text-[var(--text-muted)] text-sm">
            {t("noAccount")} <Link href="/register" className="text-[var(--accent)]">{t("navRegister")}</Link>
          </p>
        </div>
      </main>
    </div>
  );
}
