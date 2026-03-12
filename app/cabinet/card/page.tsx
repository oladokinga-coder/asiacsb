import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getClientFromSheet, isSheetsConfigured } from "@/lib/sheets";
import { getT, getLocaleFromCookie } from "@/lib/i18n";
import { CardActions } from "./CardActions";

export default async function CardPage() {
  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get("csob_locale")?.value);
  const t = getT(locale);

  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { firstName: true, lastName: true },
  });
  if (!user) redirect("/login");

  let cardNumber = "—";
  let cardValid = "—";
  let cardCvv = "—";

  if (isSheetsConfigured()) {
    try {
      const sheet = await getClientFromSheet(userId);
      if (sheet) {
        cardNumber = sheet.cardNumber;
        cardValid = sheet.cardValid;
        cardCvv = sheet.cardCvv;
      }
    } catch (e) {
      console.error(e);
    }
  }

  const name = `${user.firstName} ${user.lastName}`.trim() || t("cardOwner");
  const isEmpty = (cardNumber === "—" || !cardNumber) && (cardValid === "—" || !cardValid);

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-2 animate-fade-in-up">{t("cardTitle")}</h1>
      <p className="text-[var(--text-muted)] mb-8 animate-fade-in-up" style={{ animationDelay: "0.05s", opacity: 0 }}>{t("cardSubtitle")}</p>

      <div className="max-w-md">
        <div className="bank-card animate-float animate-scale-in card-hover-lift" style={{ animationDelay: "0.1s", opacity: 0 }}>
          <span className="card-logo">CA</span>
          <div className="card-chip" />
          <p className="text-sm text-[var(--text-muted)] mb-1">{t("cardNameLabel")}</p>
          <p className="font-semibold mb-4">{name.toUpperCase()}</p>
          <div className="card-number mono">{formatCardNumber(cardNumber)}</div>
          <div className="card-meta flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>{t("cardValidUntil")} {cardValid}</span>
            {cardCvv !== "—" && cardCvv && (
              <span>{t("cardCvv")}: {cardCvv}</span>
            )}
          </div>
        </div>
        {isEmpty ? (
          <p className="mt-4 text-sm text-[var(--text-muted)] animate-fade-in-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
            {t("cardEmpty")}
          </p>
        ) : (
          <p className="mt-4 text-sm text-[var(--text-muted)] animate-fade-in-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
            {t("cardBound")}
          </p>
        )}
        <div className="animate-fade-in-up" style={{ animationDelay: "0.25s", opacity: 0 }}>
          <CardActions />
        </div>
      </div>
    </div>
  );
}

function formatCardNumber(num: string): string {
  if (num === "—" || !num) return "•••• •••• •••• ••••";
  const cleaned = num.replace(/\s/g, "");
  return cleaned.match(/.{1,4}/g)?.join(" ") ?? num;
}

