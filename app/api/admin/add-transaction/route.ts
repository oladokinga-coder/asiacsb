import { NextResponse } from "next/server";
import { appendTransactionToSheet, isSheetsConfigured } from "@/lib/sheets";
import { sendTransactionCreditEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Добавить транзакцию в Google Таблицу и отправить клиенту письмо о зачислении (если amount > 0).
 * POST /api/admin/add-transaction
 * Body: { userId?: string; email?: string; amount: number; type?: string; description?: string; date?: string }
 * Заголовок x-admin-secret: значение ADMIN_SECRET из .env (если переменная задана).
 * Письма (регистрация и зачисление) отправляются на английском.
 */
export async function POST(req: Request) {
  const adminSecret = process.env.ADMIN_SECRET;
  if (adminSecret) {
    const headerSecret = req.headers.get("x-admin-secret");
    if (headerSecret !== adminSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!isSheetsConfigured()) {
    return NextResponse.json(
      { error: "Google Sheet is not configured" },
      { status: 503 }
    );
  }

  let body: {
    userId?: string;
    email?: string;
    amount?: number;
    type?: string;
    description?: string;
    date?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const amount = Number(body.amount);
  if (Number.isNaN(amount)) {
    return NextResponse.json(
      { error: "Missing or invalid amount" },
      { status: 400 }
    );
  }
  if (!body.email && !body.userId) {
    return NextResponse.json(
      { error: "Provide email or userId" },
      { status: 400 }
    );
  }

  const date =
    body.date && String(body.date).trim()
      ? String(body.date).trim()
      : new Date().toISOString().split("T")[0];
  const description = (body.description && String(body.description).trim()) || (amount >= 0 ? "Credit" : "Debit");
  const type = (body.type && String(body.type).trim()) || (amount >= 0 ? "Credit" : "Debit");

  try {
    const { email } = await appendTransactionToSheet({
      userId: body.userId?.trim(),
      email: body.email?.trim(),
      amount,
      type,
      description,
      date,
    });

    if (!email) {
      return NextResponse.json(
        { error: "Client not found (email could not be resolved)" },
        { status: 404 }
      );
    }

    if (amount > 0) {
      const result = await sendTransactionCreditEmail(email, amount, date, description);
      if (!result.ok) console.error("Transaction credit email failed:", result.error);
    }

    return NextResponse.json({
      ok: true,
      email,
      amount,
      date,
      description,
      emailSent: amount > 0,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Add transaction error:", e);
    return NextResponse.json(
      { error: "Failed to add transaction", detail: message },
      { status: 500 }
    );
  }
}
