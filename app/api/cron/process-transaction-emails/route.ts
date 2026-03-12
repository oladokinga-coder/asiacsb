import { NextResponse } from "next/server";
import { getTransactionRowsForNotifications, isSheetsConfigured, setTransactionRowSendStatus } from "@/lib/sheets";
import { sendTransactionCreditEmail } from "@/lib/email";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Проверяет лист «Транзакции»: для каждой строки, где в колонке send написано "ok",
 * заполнены id, email, amount, description, date и amount > 0, отправляет письмо о поступлении.
 * Рекомендуется вызывать каждую минуту по крону.
 *
 * GET или POST /api/cron/process-transaction-emails
 * Заголовок (если задан CRON_SECRET/ADMIN_SECRET): x-cron-secret или x-admin-secret
 */
export async function GET(req: Request) {
  return processTransactionEmails(req);
}

export async function POST(req: Request) {
  return processTransactionEmails(req);
}

async function processTransactionEmails(req: Request) {
  const secret = process.env.CRON_SECRET || process.env.ADMIN_SECRET;
  if (secret) {
    const headerSecret = req.headers.get("x-cron-secret") || req.headers.get("x-admin-secret");
    if (headerSecret !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!isSheetsConfigured()) {
    return NextResponse.json(
      { error: "Google Sheet is not configured", sent: 0 },
      { status: 503 }
    );
  }

  const url = new URL(req.url);
  const debug = url.searchParams.get("debug") === "1" || url.searchParams.get("debug") === "true";

  let sent = 0;
  const errors: string[] = [];

  const delegate = prisma?.processedTransactionNotification;
  let processedSet: Set<string> = new Set();
  if (delegate) {
    try {
      const processed = await delegate.findMany({ select: { sheetRowKey: true } });
      processedSet = new Set(processed.map((p) => p.sheetRowKey));
    } catch (e) {
      console.warn("ProcessedTransactionNotification unavailable, sending without dedup:", e);
    }
  }

  try {
    const rows = await getTransactionRowsForNotifications();

    const sendOk = (s: string) => s.trim().toLowerCase() === "ok";

    if (debug) {
      const debugRows = rows.map((row) => {
        const key = `Tx_${row.rowNumber}`;
        const alreadySent = processedSet.has(key);
        const validEmail = EMAIL_REGEX.test(row.email);
        const hasAll = !!(row.id && row.email && row.description && row.date && row.amount > 0);
        const hasSendOk = sendOk(row.send);
        const wouldSend = hasSendOk && hasAll && validEmail && row.amount > 0 && !alreadySent;
        let skipReason: string | null = !hasSendOk ? "send_not_ok" : !hasAll ? "missing_field" : !validEmail ? "invalid_email" : row.amount <= 0 ? "amount_not_positive" : alreadySent ? "already_sent" : null;
        return {
          rowNumber: row.rowNumber,
          id: row.id,
          email: row.email,
          amount: row.amount,
          description: row.description,
          date: row.date,
          send: row.send,
          sendOk: hasSendOk,
          alreadySent,
          validEmail,
          hasAllFields: hasAll,
          wouldSend,
          skipReason,
        };
      });
      return NextResponse.json({ debug: true, rows: debugRows, processedCount: processedSet.size });
    }

    for (const row of rows) {
      if (!sendOk(row.send)) continue;
      if (row.amount <= 0) continue;
      if (!row.id || !row.email || !row.description || !row.date) continue;
      if (!EMAIL_REGEX.test(row.email)) {
        errors.push(`Row ${row.rowNumber}: invalid email ${row.email}`);
        continue;
      }

      const key = `Tx_${row.rowNumber}`;
      if (processedSet.has(key)) continue;

      const result = await sendTransactionCreditEmail(
        row.email,
        row.amount,
        row.date,
        row.description
      );
      if (!result.ok) {
        errors.push(`Row ${row.rowNumber}: ${result.error}`);
        continue;
      }

      if (delegate) {
        try {
          await delegate.create({ data: { sheetRowKey: key } });
        } catch (_) {}
        processedSet.add(key);
      }
      try {
        await setTransactionRowSendStatus(row.rowNumber, "отправлено");
      } catch (_) {}
      sent++;
    }

    return NextResponse.json({
      ok: true,
      sent,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Process transaction emails error:", e);
    return NextResponse.json(
      { error: "Processing failed", detail: message, sent },
      { status: 500 }
    );
  }
}
