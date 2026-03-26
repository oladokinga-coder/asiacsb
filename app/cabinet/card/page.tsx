import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getClientFromSheet, isSheetsConfigured } from "@/lib/sheets";
import { getT, getLocaleFromCookie } from "@/lib/i18n";
import { MASKED_CARD_NUMBER, MASKED_CARD_VALID, MASKED_CARD_CVV } from "@/lib/card-format";
import { CardPageInteractive } from "./CardPageInteractive";

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

  return (
    <div className="container py-8">
      <CardPageInteractive
        userId={userId}
        name={name}
        cardNumber={cardNumber}
        cardValid={cardValid}
        cardCvv={cardCvv}
        cardDetailsHidden={cardDetailsHidden}
      />
    </div>
  );
}
