"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useI18n } from "@/app/components/LanguageProvider";
import { COUNTRIES } from "@/lib/countries";
import { formatEur } from "@/lib/currency";

type MeResponse = {
  balance: number;
  cardNumber: string;
  cardValid: string;
  sheetConnected: boolean;
  transferAllowed: boolean;
};

type Phase = "form" | "processing" | "done";

function maskCard(num: string): string {
  const d = num.replace(/\s/g, "");
  if (!d || d === "—") return "•••• •••• •••• ••••";
  const last4 = d.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function TransferForm() {
  const { t } = useI18n();
  const router = useRouter();
  const [loadingMe, setLoadingMe] = useState(true);
  const [balance, setBalance] = useState(0);
  const [cardNumber, setCardNumber] = useState("—");
  const [cardValid, setCardValid] = useState("—");
  const [sheetConnected, setSheetConnected] = useState(false);
  const [transferAllowed, setTransferAllowed] = useState(false);
  const [phase, setPhase] = useState<Phase>("form");

  const [beneficiaryName, setBeneficiaryName] = useState("");
  const [beneficiaryCountry, setBeneficiaryCountry] = useState("");
  const [transferType, setTransferType] = useState<"sepa" | "domestic" | "international">("sepa");
  const [recipientCard, setRecipientCard] = useState("");
  const [recipientExpiry, setRecipientExpiry] = useState("");
  const [amountStr, setAmountStr] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/me");
        if (!res.ok) return;
        const data = (await res.json()) as MeResponse & { error?: string };
        if (cancelled) return;
        setBalance(data.balance ?? 0);
        setCardNumber(data.cardNumber ?? "—");
        setCardValid(data.cardValid ?? "—");
        setSheetConnected(!!data.sheetConnected);
        setTransferAllowed(!!data.transferAllowed);
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoadingMe(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sourceOk =
    transferAllowed &&
    sheetConnected &&
    cardNumber.replace(/\s/g, "") !== "" &&
    cardNumber !== "—" &&
    /^\d{12,19}$/.test(cardNumber.replace(/\s/g, ""));
  const maxAmount = roundMoney(balance);

  function mapError(code: string): string {
    switch (code) {
      case "INSUFFICIENT_FUNDS":
        return t("transferErrorBalance");
      case "NO_SOURCE_CARD":
        return t("transferErrorNoCard");
      case "INVALID_CARD":
        return t("transferErrorInvalidCard");
      case "SHEETS_NOT_CONFIGURED":
        return t("transferErrorSheets");
      case "NO_CLIENT_ROW":
        return t("transferErrorNoRow");
      case "TRANSFER_NOT_ALLOWED":
        return t("cardErrorUnavailable");
      default:
        return t("transferErrorGeneric");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!sheetConnected) {
      setError(t("transferRequiresSheets"));
      return;
    }
    if (!transferAllowed) {
      setError(t("cardErrorUnavailable"));
      return;
    }

    const amount = roundMoney(parseFloat(amountStr.replace(",", ".")));
    if (Number.isNaN(amount) || amount < 0.01) {
      setError(t("transferErrorGeneric"));
      return;
    }
    if (amount > maxAmount) {
      setError(t("transferErrorBalance"));
      return;
    }

    setSubmitting(true);
    setPhase("processing");
    try {
      const res = await fetch("/api/cabinet/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          beneficiaryName: beneficiaryName.trim(),
          beneficiaryCountry,
          transferType,
          recipientCardNumber: recipientCard.replace(/\s/g, ""),
          recipientCardExpiry: recipientExpiry.trim(),
          sourceCardId: "primary",
          amount,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setPhase("form");
        const code = typeof data.error === "string" ? data.error : "";
        setError(code ? mapError(code) : t("transferErrorGeneric"));
        return;
      }
      await new Promise((r) => setTimeout(r, 2000));
      setBalance(typeof data.newBalance === "number" ? data.newBalance : roundMoney(maxAmount - amount));
      setAmountStr("");
      setPhase("done");
      router.refresh();
    } catch {
      setPhase("form");
      setError(t("transferErrorGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  const selectClass =
    "w-full px-4 py-3 rounded-[var(--radius)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text)]";

  return (
    <div className="container py-8 max-w-lg mx-auto">
      {phase === "form" && (
        <Link
          href="/cabinet"
          className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("transferBack")}
        </Link>
      )}

      {phase === "form" && (
        <>
          <h1 className="text-2xl font-bold mb-2">{t("transferTitle")}</h1>
          <p className="text-[var(--text-muted)] mb-8">{t("transferSubtitle")}</p>
        </>
      )}

      {!sheetConnected && !loadingMe && (
        <p className="mb-6 p-4 rounded-[var(--radius)] bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] text-sm">
          {t("transferRequiresSheets")}
        </p>
      )}

      {sheetConnected && !loadingMe && !transferAllowed && (
        <p className="mb-6 p-4 rounded-[var(--radius)] bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] text-sm font-medium">
          {t("cardErrorUnavailable")}
        </p>
      )}

      {phase === "processing" && (
        <div className="mb-8 p-8 rounded-[var(--radius-lg)] bg-[var(--bg-elevated)] border border-[var(--border)] text-center">
          <Loader2 className="w-10 h-10 text-[var(--accent)] animate-spin mx-auto mb-4" aria-hidden />
          <p className="font-semibold text-lg">{t("transferProcessingTitle")}</p>
          <p className="text-sm text-[var(--text-muted)] mt-2">{t("transferProcessingHint")}</p>
        </div>
      )}

      {phase === "done" && (
        <div className="mb-8 p-8 rounded-[var(--radius-lg)] bg-[var(--accent)]/10 border border-[var(--accent)]/35 text-center">
          <p className="font-semibold text-lg text-[var(--accent)]">{t("transferDoneTitle")}</p>
          <p className="text-sm text-[var(--text-muted)] mt-2 mb-6">{t("transferDoneSubtitle")}</p>
          <Link href="/cabinet" className="btn btn-primary inline-flex px-8 py-3">
            {t("transferReturnCabinet")}
          </Link>
        </div>
      )}

      {error && (
        <p className="mb-6 p-4 rounded-[var(--radius)] bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] text-sm">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className={`card space-y-2 ${phase !== "form" ? "hidden" : ""}`}
        aria-hidden={phase !== "form"}
      >
        <div className="input-group">
          <label>{t("transferBeneficiaryName")}</label>
          <input
            value={beneficiaryName}
            onChange={(e) => setBeneficiaryName(e.target.value)}
            required
            autoComplete="name"
            maxLength={120}
            disabled={submitting}
          />
        </div>

        <div className="input-group">
          <label>{t("transferBeneficiaryCountry")}</label>
          <select
            className={selectClass}
            value={beneficiaryCountry}
            onChange={(e) => setBeneficiaryCountry(e.target.value)}
            required
            disabled={submitting}
          >
            <option value="">{t("countryPlaceholder")}</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="input-group">
          <label>{t("transferType")}</label>
          <select
            className={selectClass}
            value={transferType}
            onChange={(e) => setTransferType(e.target.value as typeof transferType)}
            required
            disabled={submitting}
          >
            <option value="sepa">{t("transferTypeSepa")}</option>
            <option value="domestic">{t("transferTypeDomestic")}</option>
            <option value="international">{t("transferTypeInternational")}</option>
          </select>
        </div>

        <div className="input-group">
          <label>{t("transferRecipientCard")}</label>
          <input
            className="mono"
            value={recipientCard}
            onChange={(e) => setRecipientCard(e.target.value)}
            required
            inputMode="numeric"
            autoComplete="off"
            placeholder="0000 0000 0000 0000"
            disabled={submitting}
          />
        </div>

        <div className="input-group">
          <label>{t("transferRecipientExpiry")}</label>
          <input
            className="mono"
            value={recipientExpiry}
            onChange={(e) => setRecipientExpiry(e.target.value)}
            required
            placeholder={t("transferRecipientExpiryPlaceholder")}
            pattern="^(0[1-9]|1[0-2])\/[0-9]{2}$"
            autoComplete="cc-exp"
            disabled={submitting}
          />
        </div>

        <div className="pt-2 pb-2">
          <p className="text-sm text-[var(--text-muted)] mb-3">{t("transferFromCard")}</p>
          <div
            className={`p-4 rounded-[var(--radius)] border transition-colors ${
              sourceOk ? "border-[var(--accent)]/40 bg-[var(--bg-elevated)]" : "border-[var(--border)] opacity-70"
            }`}
            role="group"
            aria-label={t("transferFromCard")}
          >
            <p className="font-medium">{t("transferPrimaryCard")}</p>
            <p className="mono text-sm text-[var(--text-muted)] mt-1">{maskCard(cardNumber)}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">
              {t("cardValidUntil")} {cardValid}
            </p>
          </div>
          {!sourceOk && !loadingMe && sheetConnected && transferAllowed && (
            <p className="mt-2 text-sm text-[var(--danger)]">{t("transferErrorNoCard")}</p>
          )}
        </div>

        <div className="input-group">
          <label>
            {t("transferAmount")}{" "}
            <span className="text-[var(--text-muted)] font-normal">
              ({t("transferMaxAvailable")}: {formatEur(maxAmount)})
            </span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            max={maxAmount > 0 ? maxAmount : undefined}
            value={amountStr}
            onChange={(e) => setAmountStr(e.target.value)}
            required
            disabled={submitting || !sourceOk}
            className="mono"
          />
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="btn btn-primary w-full py-3"
            disabled={submitting || !sourceOk || loadingMe || maxAmount <= 0 || phase !== "form"}
          >
            {submitting ? t("transferSubmitting") : t("transferSubmit")}
          </button>
        </div>
      </form>
    </div>
  );
}
