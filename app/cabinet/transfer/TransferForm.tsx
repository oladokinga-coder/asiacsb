"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/app/components/LanguageProvider";
import { COUNTRIES } from "@/lib/countries";
import { formatEur } from "@/lib/currency";

type MeResponse = {
  balance: number;
  cardNumber: string;
  cardValid: string;
  sheetConnected: boolean;
};

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
  const [loadingMe, setLoadingMe] = useState(true);
  const [balance, setBalance] = useState(0);
  const [cardNumber, setCardNumber] = useState("—");
  const [cardValid, setCardValid] = useState("—");
  const [sheetConnected, setSheetConnected] = useState(false);

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

  const sourceOk = sheetConnected && cardNumber.replace(/\s/g, "") !== "" && cardNumber !== "—" && /^\d{12,19}$/.test(cardNumber.replace(/\s/g, ""));
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
      default:
        return t("transferErrorGeneric");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!sheetConnected) {
      setError(t("transferRequiresSheets"));
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
        const code = typeof data.error === "string" ? data.error : "";
        setError(code ? mapError(code) : t("transferErrorGeneric"));
        return;
      }
      setSuccess(true);
      setBalance(typeof data.newBalance === "number" ? data.newBalance : roundMoney(maxAmount - amount));
      setAmountStr("");
    } catch {
      setError(t("transferErrorGeneric"));
    } finally {
      setSubmitting(false);
    }
  }

  const selectClass =
    "w-full px-4 py-3 rounded-[var(--radius)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text)]";

  return (
    <div className="container py-8 max-w-lg mx-auto">
      <Link
        href="/cabinet"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--accent)] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("transferBack")}
      </Link>

      <h1 className="text-2xl font-bold mb-2">{t("transferTitle")}</h1>
      <p className="text-[var(--text-muted)] mb-8">{t("transferSubtitle")}</p>

      {!sheetConnected && !loadingMe && (
        <p className="mb-6 p-4 rounded-[var(--radius)] bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] text-sm">
          {t("transferRequiresSheets")}
        </p>
      )}

      {success && (
        <p className="mb-6 p-4 rounded-[var(--radius)] bg-[var(--accent)]/15 border border-[var(--accent)]/40 text-[var(--accent)] text-sm font-medium">
          {t("transferSuccess")}
        </p>
      )}

      {error && (
        <p className="mb-6 p-4 rounded-[var(--radius)] bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] text-sm">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="card space-y-2">
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
          {!sourceOk && !loadingMe && sheetConnected && (
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
            disabled={submitting || !sourceOk || loadingMe || maxAmount <= 0}
          >
            {submitting ? t("transferSubmitting") : t("transferSubmit")}
          </button>
        </div>
      </form>
    </div>
  );
}
