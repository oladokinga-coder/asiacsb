import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getClientFromSheet, isSheetsConfigured } from "@/lib/sheets";
import { formatEur } from "@/lib/currency";
import { formatCardNumberForDisplay, MASKED_CARD_NUMBER, MASKED_CARD_VALID } from "@/lib/card-format";
import { getT, getLocaleFromCookie } from "@/lib/i18n";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { VisaLogo } from "@/app/components/VisaLogo";
import { CardReissueAlert } from "@/app/components/CardReissueAlert";
import { OverviewActions } from "./OverviewActions";
import { TransactionRow } from "./TransactionRow";
import type { SheetTransaction } from "@/lib/sheets";

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
  let recentTransactions: SheetTransaction[] = [];
  let transferAllowed = false;
  let cardDetailsHidden = false;

  if (isSheetsConfigured()) {
    try {
      const sheet = await getClientFromSheet(userId);
      if (sheet) {
        balance = sheet.balance;
        cardDetailsHidden = sheet.cardDetailsHidden;
        cardNumber = sheet.cardDetailsHidden ? MASKED_CARD_NUMBER : sheet.cardNumber;
        cardValid = sheet.cardDetailsHidden ? MASKED_CARD_VALID : sheet.cardValid;
        transferAllowed = sheet.transferAllowed;
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

      {cardDetailsHidden && <CardReissueAlert />}

      <div className="mb-8">
        <div className="grid md:grid-cols-2 gap-6 mb-4">
          <div className="card card-hover-lift animate-scale-in" style={{ animationDelay: "0.1s", opacity: 0 }}>
            <p className="text-sm text-[var(--text-muted)] mb-1">{t("balance")}</p>
            <p className="text-3xl font-bold mono">{formatEur(balance)}</p>
          </div>
          <div className="bank-card animate-float animate-scale-in" style={{ animationDelay: "0.2s", opacity: 0 }}>
            <span className="card-logo">
              <VisaLogo />
            </span>
            <div className="card-chip" />
            <div className="card-number mono">
              {cardDetailsHidden ? cardNumber : formatCardNumberForDisplay(cardNumber)}
            </div>
            <div className="card-meta">
              <span>{t("cardValidUntil")} {cardValid}</span>
            </div>
          </div>
        </div>
        <div className="animate-fade-in-up" style={{ animationDelay: "0.25s", opacity: 0 }}>
          <OverviewActions transferAllowed={transferAllowed} cardDetailsHidden={cardDetailsHidden} />
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
              <TransactionRow key={tx.id} tx={tx} />
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
