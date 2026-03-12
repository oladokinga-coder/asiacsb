import { NextResponse } from "next/server";
import { sendRegistrationSuccessEmail, sendTransactionCreditEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

/**
 * Отправка тестового письма. Только в development или с ?secret=...
 * POST /api/test-email
 * Регистрация: body: { "to": "email@example.com", "firstName": "Имя" }
 * Зачисление:   body: { "to": "email@example.com", "type": "transaction", "amount": 500, "date": "09.03.2026", "description": "Test credit" }
 */
export async function POST(req: Request) {
  const isDev = process.env.NODE_ENV === "development";
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  if (!isDev && secret !== process.env.TEST_EMAIL_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { to?: string; firstName?: string; type?: string; amount?: number; date?: string; description?: string } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const to = (body.to ?? "cikola321@gmail.com").trim().toLowerCase();
  if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return NextResponse.json({ error: "Укажите корректный email в body: { \"to\": \"...\" }" }, { status: 400 });
  }

  if (body.type === "transaction") {
    const amount = Number(body.amount) || 500;
    const date = (body.date ?? "09.03.2026").trim();
    const description = (body.description ?? "Test credit").trim();
    const result = await sendTransactionCreditEmail(to, amount, date, description);
    if (!result.ok) {
      return NextResponse.json({ error: result.error ?? "Ошибка отправки" }, { status: 500 });
    }
    return NextResponse.json({ ok: true, message: "Письмо о зачислении отправлено на " + to });
  }

  const firstName = (body.firstName ?? "Тест").trim();
  const result = await sendRegistrationSuccessEmail(to, firstName);
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? "Ошибка отправки" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, message: "Письмо о регистрации отправлено на " + to });
}
