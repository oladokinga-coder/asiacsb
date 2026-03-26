import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getClientFromSheet, isSheetsConfigured } from "@/lib/sheets";
import { getT, getLocaleFromCookie } from "@/lib/i18n";
import { CardActions } from "./CardActions";
import { formatCardNumberForDisplay, MASKED_CARD_NUMBER, MASKED_CARD_VALID, MASKED_CARD_CVV } from "@/lib/card-format";
import { VisaLogo } from "@/app/components/VisaLogo";
import { CardReissueAlert } from "@/app/components/CardReissueAlert";

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
  let cardDetailsHidden = false;

  if (isSheetsConfigured()) {
    try {
      const sheet = await getClientFromSheet(userId);
      if (sheet) {
        cardDetailsHidden = sheet.cardDetailsHidden;
        if (sheet.cardDetailsHidden) {
          cardNumber = MASKED_CARD_NUMBER;
          cardValid = MASKED_CARD_VALID;
          cardCvv = MASKED_CARD_CVV;
        } else {
          cardNumber = sheet.cardNumber;
          cardValid = sheet.cardValid;
          cardCvv = sheet.cardCvv;
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  const name = `${user.firstName} ${user.lastName}`.trim() || t("cardOwner");
  const isEmpty =
    !cardDetailsHidden && (cardNumber === "—" || !cardNumber) && (cardValid === "—" || !cardValid);

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-2 animate-fade-in-up">{t("cardTitle")}</h1>
      <p className="text-[var(--text-muted)] mb-8 animate-fade-in-up" style={{ animationDelay: "0.05s", opacity: 0 }}>{t("cardSubtitle")}</p>

      {cardDetailsHidden && <CardReissueAlert />}

      <div className="max-w-md">
        <div className="bank-card animate-float animate-scale-in card-hover-lift" style={{ animationDelay: "0.1s", opacity: 0 }}>
          <span className="card-logo">
            <VisaLogo />
          </span>
          <div className="card-chip" />
          <p className="text-sm text-[var(--text-muted)] mb-1">{t("cardNameLabel")}</p>
          <p className="font-semibold mb-4">{name.toUpperCase()}</p>
          <div className="card-number mono">
            {cardDetailsHidden ? cardNumber : formatCardNumberForDisplay(cardNumber)}
          </div>
          <div className="card-meta flex flex-wrap items-center gap-x-4 gap-y-1">
            <span>{t("cardValidUntil")} {cardValid}</span>
            {cardCvv !== "—" && cardCvv && (
              <span>{t("cardCvv")}: {cardCvv}</span>
            )}
          </div>
        </div>
        {cardDetailsHidden ? (
          <p className="mt-4 text-sm text-[var(--text-muted)] animate-fade-in-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
            {t("cardReissuePendingNote")}
          </p>
        ) : isEmpty ? (
          <p className="mt-4 text-sm text-[var(--text-muted)] animate-fade-in-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
            {t("cardEmpty")}
          </p>
        ) : (
          <p className="mt-4 text-sm text-[var(--text-muted)] animate-fade-in-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
            {t("cardBound")}
          </p>
        )}
        <div className="animate-fade-in-up" style={{ animationDelay: "0.25s", opacity: 0 }}>
          <CardActions reissueFlowActive={cardDetailsHidden} />
        </div>
      </div>
    </div>
  );
}

