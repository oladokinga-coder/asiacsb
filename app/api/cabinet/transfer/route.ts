import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserId } from "@/lib/auth";
import { appendTransactionToSheet, getClientFromSheet, isSheetsConfigured } from "@/lib/sheets";

export const dynamic = "force-dynamic";

const transferSchema = z.object({
  beneficiaryName: z.string().trim().min(2).max(120),
  beneficiaryCountry: z.string().length(2),
  transferType: z.enum(["sepa", "domestic", "international"]),
  recipientCardNumber: z.string().min(1),
  recipientCardExpiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/),
  sourceCardId: z.literal("primary"),
  amount: z.number().finite().min(0.01).max(1_000_000),
});

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
  const amount = roundMoney(body.amount);
  if (amount < 0.01) {
    return NextResponse.json({ error: "INVALID_AMOUNT" }, { status: 400 });
  }

  const pan = body.recipientCardNumber.replace(/\s/g, "");
  if (!/^\d+$/.test(pan) || !luhnCheck(pan)) {
    return NextResponse.json({ error: "INVALID_CARD" }, { status: 400 });
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

  const last4 = pan.slice(-4);
  const typeLabel =
    body.transferType === "sepa"
      ? "SEPA"
      : body.transferType === "domestic"
        ? "Domestic"
        : "International";
  const description = `Transfer (${typeLabel}) to ${body.beneficiaryName} · *${last4}`;

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
