import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { getClientFromSheet, isSheetsConfigured } from "@/lib/sheets";
import { formatEur } from "@/lib/currency";
import { getT, getLocaleFromCookie } from "@/lib/i18n";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

export default async function TransactionsPage() {
  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get("csob_locale")?.value);
  const t = getT(locale);

  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  let transactions: { id: string; amount: number; type: string; description: string; date: string }[] = [];

  if (isSheetsConfigured()) {
    try {
      const sheet = await getClientFromSheet(userId);
      if (sheet) transactions = sheet.transactions;
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-2 animate-fade-in-up">{t("transactionsTitle")}</h1>
      <p className="text-[var(--text-muted)] mb-8 animate-fade-in-up" style={{ animationDelay: "0.05s", opacity: 0 }}>{t("transactionsSubtitle")}</p>

      <div className="card animate-scale-in card-hover-lift" style={{ animationDelay: "0.1s", opacity: 0 }}>
        {transactions.length === 0 ? (
          <p className="text-[var(--text-muted)] py-12 text-center">
            {t("noTransactionsFull")}
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)] cabinet-stagger">
            {transactions.map((tx) => (
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
    </div>
  );
}
