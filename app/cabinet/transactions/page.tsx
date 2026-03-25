import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { getClientFromSheet, isSheetsConfigured } from "@/lib/sheets";
import { getT, getLocaleFromCookie } from "@/lib/i18n";
import { TransactionRow } from "../TransactionRow";
import type { SheetTransaction } from "@/lib/sheets";

export default async function TransactionsPage() {
  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get("csob_locale")?.value);
  const t = getT(locale);

  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  let transactions: SheetTransaction[] = [];

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
              <TransactionRow key={tx.id} tx={tx} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
