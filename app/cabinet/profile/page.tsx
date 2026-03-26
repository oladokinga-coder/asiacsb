import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getClientFromSheet, isSheetsConfigured } from "@/lib/sheets";
import { formatEur } from "@/lib/currency";
import { getT, getLocaleFromCookie, LOCALE_INTL } from "@/lib/i18n";
import { COUNTRIES } from "@/lib/countries";
import { MASKED_SENSITIVE } from "@/lib/card-format";
import { CardReissueAlert } from "@/app/components/CardReissueAlert";

function formatDate(value: string, intlLocale: string): string {
  if (!value || value === "—") return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString(intlLocale, { day: "numeric", month: "long", year: "numeric" });
}

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const locale = getLocaleFromCookie(cookieStore.get("csob_locale")?.value);
  const t = getT(locale);
  const intlLocale = LOCALE_INTL[locale];

  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, firstName: true, lastName: true, createdAt: true },
  });
  if (!user) redirect("/login");

  let sheet = null;
  if (isSheetsConfigured()) {
    try {
      sheet = await getClientFromSheet(userId);
    } catch (e) {
      console.error(e);
    }
  }

  const email = sheet?.email && sheet.email !== "—" ? sheet.email : user.email;
  const fullName = sheet?.fullName && sheet.fullName !== "—" ? sheet.fullName : `${user.firstName} ${user.lastName}`.trim();
  const balance = sheet?.balance ?? 0;
  const countryCode = sheet?.country && sheet.country !== "—" ? sheet.country : "";
  const countryDisplay = countryCode ? (COUNTRIES.find((c) => c.code === countryCode)?.name ?? countryCode) : "—";
  const passportSeries = sheet?.passportSeries && sheet.passportSeries !== "—" ? sheet.passportSeries : "—";
  const passportNumber = sheet?.passportNumber && sheet.passportNumber !== "—" ? sheet.passportNumber : "—";
  const passportDisplay = passportSeries !== "—" || passportNumber !== "—" ? `${passportSeries} ${passportNumber}`.trim() : "—";
  const birthDateDisplay = sheet?.birthDate && sheet.birthDate !== "—" ? formatDate(sheet.birthDate, intlLocale) : "—";
  const createdAtDisplay = sheet?.createdAt && sheet.createdAt !== "—" ? formatDate(sheet.createdAt, intlLocale) : formatDate(user.createdAt.toString(), intlLocale);
  const beneficiaryDisplay = sheet?.beneficiary && sheet.beneficiary !== "—" ? sheet.beneficiary : null;
  const accountNumberDisplay = sheet?.accountNumber && sheet.accountNumber !== "—" ? sheet.accountNumber : null;

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-2 animate-fade-in-up">{t("profileTitle")}</h1>
      <p className="text-[var(--text-muted)] mb-8 animate-fade-in-up" style={{ animationDelay: "0.05s", opacity: 0 }}>{t("profileSubtitle")}</p>

      {!sheet && isSheetsConfigured() && (
        <p className="text-sm text-[var(--text-muted)] mb-4 animate-fade-in-up" style={{ animationDelay: "0.08s", opacity: 0 }}>{t("profileNoSheet")}</p>
      )}

      {sheet?.cardDetailsHidden && <CardReissueAlert />}

      <div className="card max-w-lg animate-scale-in card-hover-lift" style={{ animationDelay: "0.1s", opacity: 0 }}>
        <dl className="space-y-4 cabinet-stagger">
          <div>
            <dt className="text-sm text-[var(--text-muted)]">{t("profileFullName")}</dt>
            <dd className="font-medium">{fullName || "—"}</dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--text-muted)]">{t("email")}</dt>
            <dd className="font-medium mono">{email}</dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--text-muted)]">{t("balance")}</dt>
            <dd className="font-semibold mono">{formatEur(balance)}</dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--text-muted)]">{t("country")}</dt>
            <dd className="font-medium">{countryDisplay}</dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--text-muted)]">{t("profilePassport")}</dt>
            <dd className="font-medium mono">{passportDisplay}</dd>
          </div>
          <div>
            <dt className="text-sm text-[var(--text-muted)]">{t("profileBirthDate")}</dt>
            <dd className="font-medium">{birthDateDisplay}</dd>
          </div>
          {beneficiaryDisplay != null && (
            <div>
              <dt className="text-sm text-[var(--text-muted)]">{t("profileBeneficiary")}</dt>
              <dd className="font-medium">
                {sheet?.cardDetailsHidden ? MASKED_SENSITIVE : beneficiaryDisplay}
              </dd>
            </div>
          )}
          {accountNumberDisplay != null && (
            <div>
              <dt className="text-sm text-[var(--text-muted)]">{t("profileAccountNumber")}</dt>
              <dd className="font-medium">{accountNumberDisplay}</dd>
            </div>
          )}
          <div>
            <dt className="text-sm text-[var(--text-muted)]">{t("accountOpened")}</dt>
            <dd className="font-medium">{createdAtDisplay}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
