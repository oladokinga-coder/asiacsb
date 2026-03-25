import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/auth";
import { appendTransactionToSheet, getClientFromSheet, isSheetsConfigured } from "@/lib/sheets";
import { isValidBic, isValidIban, normalizeBic, normalizeIban } from "@/lib/iban";

export const dynamic = "force-dynamic";

const baseFields = {
  beneficiaryName: z.string().trim().min(2).max(120),
  beneficiaryCountry: z.string().length(2),
  paymentPurpose: z.string().trim().min(2).max(200),
  sourceCardId: z.literal("primary"),
  amount: z.number().finite().min(0.01).max(1_000_000),
};

const transferSchema = z.discriminatedUnion("transferType", [
  z.object({
    ...baseFields,
    transferType: z.literal("sepa"),
    iban: z.string().min(1),
    bic: z
      .preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().optional())
      .optional(),
  }),
  z.object({
    ...baseFields,
    transferType: z.literal("domestic"),
    beneficiaryCountry: z.literal("CZ"),
    iban: z.string().min(1),
    bic: z.string().min(8).max(11),
  }),
  z.object({
    ...baseFields,
    transferType: z.literal("international"),
    recipientCardNumber: z.string().min(1),
  }),
]);

function luhnCheck(pan: string): boolean {
  const digits = pan.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  let sum = 0;
  let isSecond = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (isSecond) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    isSecond = !isSecond;
  }
  return sum % 10 === 0;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

function truncate(s: string, max: number): string {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max - 1)}…`;
}

export async function POST(req: Request) {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  if (!isSheetsConfigured()) {
    return NextResponse.json({ error: "SHEETS_NOT_CONFIGURED" }, { status: 503 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
  }

  const parsed = transferSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_BODY", details: parsed.error.flatten() }, { status: 400 });
  }

  const body = parsed.data;
  if (body.transferType === "domestic") {
    return NextResponse.json({ error: "DOMESTIC_CZK_CARD_REQUIRED" }, { status: 400 });
  }
  const amount = roundMoney(body.amount);
  if (amount < 0.01) {
    return NextResponse.json({ error: "INVALID_AMOUNT" }, { status: 400 });
  }

  const purposeShort = truncate(body.paymentPurpose, 80);

  let description: string;

  if (body.transferType === "international") {
    const pan = body.recipientCardNumber.replace(/\D/g, "");
    if (!/^\d+$/.test(pan) || !luhnCheck(pan)) {
      return NextResponse.json({ error: "INVALID_CARD" }, { status: 400 });
    }
    const last4 = pan.slice(-4);
    description = `Intl card · ${body.beneficiaryName} · *${last4} · ${purposeShort}`;
  } else {
    const iban = normalizeIban(body.iban);
    if (!isValidIban(iban)) {
      return NextResponse.json({ error: "INVALID_IBAN" }, { status: 400 });
    }
    const ibanLast4 = iban.slice(-4);
    if (body.bic) {
      const bic = normalizeBic(body.bic);
      if (!isValidBic(bic)) {
        return NextResponse.json({ error: "INVALID_BIC" }, { status: 400 });
      }
      description = `SEPA · ${body.beneficiaryName} · IBAN *${ibanLast4} · BIC ${bic} · ${purposeShort}`;
    } else {
      description = `SEPA · ${body.beneficiaryName} · IBAN *${ibanLast4} · ${purposeShort}`;
    }
  }

  const client = await getClientFromSheet(userId);
  if (!client) {
    return NextResponse.json({ error: "NO_CLIENT_ROW" }, { status: 404 });
  }

  if (!client.transferAllowed) {
    return NextResponse.json({ error: "TRANSFER_NOT_ALLOWED" }, { status: 403 });
  }

  const sourceDigits = client.cardNumber.replace(/\s/g, "");
  if (!sourceDigits || sourceDigits === "—" || !/^\d{12,19}$/.test(sourceDigits)) {
    return NextResponse.json({ error: "NO_SOURCE_CARD" }, { status: 400 });
  }

  const oldBalance = roundMoney(client.balance);
  if (amount > oldBalance) {
    return NextResponse.json({ error: "INSUFFICIENT_FUNDS", balance: oldBalance }, { status: 400 });
  }

  const date = new Date().toISOString().split("T")[0];

  try {
    const { email } = await appendTransactionToSheet({
      userId,
      amount: -amount,
      type: "Transfer",
      description,
      date,
    });
    if (!email) {
      return NextResponse.json({ error: "TRANSACTION_APPEND_FAILED" }, { status: 500 });
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Transfer append error:", e);
    return NextResponse.json({ error: "TRANSACTION_APPEND_FAILED", detail: message }, { status: 500 });
  }

  const clientAfter = await getClientFromSheet(userId);

  return NextResponse.json({
    ok: true,
    newBalance: clientAfter ? roundMoney(clientAfter.balance) : roundMoney(oldBalance - amount),
    description,
    date,
  });
}
