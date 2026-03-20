import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getClientFromSheet, isSheetsConfigured } from "@/lib/sheets";
import { formatEur } from "@/lib/currency";
import { getT, getLocaleFromCookie } from "@/lib/i18n";
import Link from "next/link";
import { CreditCard, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { OverviewActions } from "./OverviewActions";
import { VisaLogo } from "@/app/components/VisaLogo";

export default async function CabinetPage() {
  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get("csob_locale")?.value);
  const t = getT(locale);

  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true, email: true },
  });
  if (!user) redirect("/login");

  let balance = 0;
  let cardNumber = "—";
  let cardValid = "—";
  let recentTransactions: { id: string; amount: number; type: string; description: string; date: string }[] = [];

  if (isSheetsConfigured()) {
    try {
      const sheet = await getClientFromSheet(userId);
      if (sheet) {
        balance = sheet.balance;
        cardNumber = sheet.cardNumber;
        cardValid = sheet.cardValid;
        recentTransactions = sheet.transactions.slice(0, 5);
      }
    } catch (e) {
      console.error(e);
    }
  }

  const name = `${user.firstName} ${user.lastName}`.trim() || user.email;

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-2 animate-fade-in-up">{t("welcome")}, {name}</h1>
      <p className="text-[var(--text-muted)] mb-8 animate-fade-in-up" style={{ animationDelay: "0.05s", opacity: 0 }}>{t("accountOverview")}</p>

      <div className="mb-8">
        <div className="grid md:grid-cols-2 gap-6 mb-4">
          <div className="card card-hover-lift animate-scale-in" style={{ animationDelay: "0.1s", opacity: 0 }}>
            <p className="text-sm text-[var(--text-muted)] mb-1">{t("balance")}</p>
            <p className="text-3xl font-bold mono">{formatEur(balance)}</p>
          </div>
          <div className="bank-card animate-float animate-scale-in" style={{ animationDelay: "0.2s", opacity: 0 }}>
            <span className="card-logo">CA</span>
            <div className="card-visa" aria-hidden>
              <VisaLogo />
            </div>
            <div className="card-number mono">{formatCardNumber(cardNumber)}</div>
            <div className="card-meta">
              <span>{t("cardValidUntil")} {cardValid}</span>
            </div>
          </div>
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: "0.25s", opacity: 0 }}>
          <OverviewActions />
        </div>
      </div>

      <div className="card animate-scale-in card-hover-lift" style={{ animationDelay: "0.3s", opacity: 0 }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">{t("lastOperations")}</h2>
          <Link href="/cabinet/transactions" className="text-sm text-[var(--accent)] hover:underline inline-flex items-center gap-1 transition-all">
            {t("allHistory")} →
          </Link>
        </div>
        {recentTransactions.length === 0 ? (
          <p className="text-[var(--text-muted)] py-6 text-center">{t("noTransactions")}</p>
        ) : (
          <ul className="divide-y divide-[var(--border)] cabinet-stagger">
            {recentTransactions.map((tx) => (
              <li key={tx.id} className="py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className={`p-2 rounded-[var(--radius)] ${tx.amount >= 0 ? "bg-[var(--accent)]/20 text-[var(--accent)]" : "bg-[var(--danger)]/20 text-[var(--danger)]"}`}>
                    {tx.amount >= 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </span>
                  <div>
                    <p className="font-medium">{tx.description || (tx.amount >= 0 ? t("credit") : t("debit"))}</p>
                    <p className="text-sm text-[var(--text-muted)]">{tx.date}</p>
                  </div>
                </div>
                <span className={`font-semibold mono ${tx.amount >= 0 ? "text-[var(--accent)]" : "text-[var(--danger)]"}`}>
                  {formatEur(tx.amount, { sign: true })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!isSheetsConfigured() && (
        <p className="mt-6 text-sm text-[var(--text-muted)]">
          {t("sheetsHint")}
        </p>
      )}
    </div>
  );
}

function formatCardNumber(num: string): string {
  if (num === "—" || !num) return "•••• •••• •••• ••••";
  const cleaned = num.replace(/\s/g, "");
  return cleaned.match(/.{1,4}/g)?.join(" ") ?? num;
}
