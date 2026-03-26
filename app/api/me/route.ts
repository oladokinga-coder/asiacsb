import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getClientFromSheet, isSheetsConfigured } from "@/lib/sheets";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Не авторизован" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true, lastName: true },
  });
  if (!user) return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });

  let balance = 0;
  let cardNumber = "—";
  let cardValid = "—";
  let transferAllowed = false;
  let cardDetailsHidden = false;
  let transactions: {
    id: string;
    amount: number;
    type: string;
    description: string;
    date: string;
    status: "pending" | "ok" | "no";
  }[] = [];

  if (isSheetsConfigured()) {
    try {
      const sheetData = await getClientFromSheet(userId);
      if (sheetData) {
        balance = sheetData.balance;
        transferAllowed = sheetData.transferAllowed;
        cardDetailsHidden = sheetData.cardDetailsHidden;
        if (sheetData.cardDetailsHidden) {
          cardNumber = "••••••••••••••••";
          cardValid = "••/••";
        } else {
          cardNumber = sheetData.cardNumber;
          cardValid = sheetData.cardValid;
        }
        transactions = sheetData.transactions;
      }
    } catch (e) {
      console.error("Sheets getClient error:", e);
    }
  }

  return NextResponse.json({
    user,
    balance,
    cardNumber,
    cardValid,
    transferAllowed,
    cardDetailsHidden,
    transactions,
    sheetConnected: isSheetsConfigured(),
  });
}
