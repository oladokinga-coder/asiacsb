/**
 * Работа с Google Таблицей.
 * Таблица должна содержать листы:
 * - "Клиенты": … колонка trans = ok — разрешены переводы; пусто — нет.
 *   При регистрации заполняются: userId, email, fullName, passportSeries, passportNumber, birthDate, country, createdAt. Карта (cardNumber, cardValid, cardCvv) — вручную.
 * - "Транзакции": id, email (или userId), amount, type, description, date, status (пусто — в обработке; ok — отправлено; no — отменено, возврат на баланс)
 *
 * Настройка: GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY (или JSON ключ в одной переменной).
 */

import { Prisma } from "@prisma/client";
import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { normalizeCardNumberFromSheet } from "@/lib/card-format";
import { prisma } from "@/lib/db";

/** Статус строки в листе «Транзакции»: колонка status — пусто / ok / no */
export type SheetTransaction = {
  id: string;
  amount: number;
  type: string;
  description: string;
  date: string;
  status: "pending" | "ok" | "no";
};

export type SheetClient = {
  balance: number;
  cardNumber: string;
  cardValid: string;
  cardCvv: string;
  fullName: string;
  email: string;
  country: string;
  passportSeries: string;
  passportNumber: string;
  birthDate: string;
  createdAt: string;
  beneficiary: string;
  accountNumber: string;
  /** Лист «Клиенты»: колонка trans = ok — разрешены переводы */
  transferAllowed: boolean;
  transactions: SheetTransaction[];
};

function normalizeTxStatus(raw: unknown): SheetTransaction["status"] {
  const s = String(raw ?? "").trim().toLowerCase();
  if (s === "ok") return "ok";
  if (s === "no") return "no";
  return "pending";
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

let doc: GoogleSpreadsheet | null = null;

function getDoc(): GoogleSpreadsheet | null {
  const sheetId = process.env.GOOGLE_SHEET_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!sheetId || !email || !key) return null;

  if (!doc) {
    const auth = new JWT({
      email,
      key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    doc = new GoogleSpreadsheet(sheetId, auth);
  }
  return doc;
}

export async function appendClientToSheet(
  userId: string,
  email: string,
  fullName: string,
  passportSeries: string,
  passportNumber: string,
  birthDate: string,
  country: string
): Promise<void> {
  const spreadsheet = getDoc();
  if (!spreadsheet) return;

  await spreadsheet.loadInfo();
  const sheet = spreadsheet.sheetsByTitle["Клиенты"] ?? spreadsheet.sheetsByIndex[0];
  await sheet.addRow({
    userId,
    email,
    fullName,
    balance: 0,
    cardNumber: "",
    cardValid: "",
    cardCvv: "",
    passportSeries,
    passportNumber,
    birthDate,
    country,
    createdAt: new Date().toISOString(),
  });
}

export async function getClientFromSheet(userId: string): Promise<SheetClient | null> {
  const spreadsheet = getDoc();
  if (!spreadsheet) return null;

  await spreadsheet.loadInfo();
  const clientsSheet = spreadsheet.sheetsByTitle["Клиенты"];
  if (!clientsSheet) return null;

  const rows = await clientsSheet.getRows();
  const row = rows.find((r) => (r.get("userId") ?? r.get("userId")) === userId);
  if (!row) return null;

  const balance = Number(row.get("balance") ?? 0);
  const cardNumber = normalizeCardNumberFromSheet(row.get("cardNumber")) || "—";
  const cardValid = String(row.get("cardValid") ?? "").trim() || "—";
  const cardCvvRaw = row.get("cardCvv") ?? row.get("CardCvv") ?? row.get("CVV") ?? row.get("cvv") ?? "";
  const cardCvv = String(cardCvvRaw).trim() || "—";
  const fullName = String(row.get("fullName") ?? "").trim() || "—";
  const clientEmail = String(row.get("email") ?? "").trim();
  const country = String(row.get("country") ?? "").trim() || "—";
  const passportSeries = String(row.get("passportSeries") ?? "").trim() || "—";
  const passportNumber = String(row.get("passportNumber") ?? "").trim() || "—";
  const birthDate = String(row.get("birthDate") ?? "").trim() || "—";
  const createdAt = String(row.get("createdAt") ?? "").trim() || "—";
  const beneficiary = String(row.get("beneficiary") ?? "").trim() || "—";
  const accountNumberRaw = row.get("accountNumber") ?? row.get("account number") ?? row.get("Account Number") ?? "";
  const accountNumber = String(accountNumberRaw).trim() || "—";
  const transRaw = String(row.get("trans") ?? "").trim().toLowerCase();
  const transferAllowed = transRaw === "ok";

  const txSheet = spreadsheet.sheetsByTitle["Транзакции"];
  let transactions: SheetClient["transactions"] = [];
  if (txSheet && clientEmail) {
    const txRows = await txSheet.getRows();
    transactions = txRows
      .filter((r) => {
        const rowEmail = String(r.get("email") ?? "").trim();
        const rowUserId = String(r.get("userId") ?? r.get("id") ?? "").trim();
        return rowEmail === clientEmail || rowUserId === userId;
      })
      .map((r) => ({
        id: String(r.get("id") ?? r.get("rowIndex") ?? ""),
        amount: Number(r.get("amount") ?? 0),
        type: String(r.get("type") ?? ""),
        description: String(r.get("description") ?? ""),
        date: String(r.get("date") ?? ""),
        status: normalizeTxStatus(r.get("status")),
      }))
      .sort((a, b) => (b.date > a.date ? 1 : -1))
      .slice(0, 100);
  }

  let adjustedBalance = roundMoney(balance);
  try {
    adjustedBalance = await applyPendingTransferRefunds(userId, transactions, adjustedBalance);
  } catch (e) {
    console.error("applyPendingTransferRefunds:", e);
  }

  return {
    balance: adjustedBalance,
    cardNumber,
    cardValid,
    cardCvv,
    fullName,
    email: clientEmail,
    country,
    passportSeries,
    passportNumber,
    birthDate,
    createdAt,
    beneficiary,
    accountNumber,
    transferAllowed,
    transactions,
  };
}

/**
 * Обновить колонку balance в строке клиента по userId (лист «Клиенты»).
 */
export async function updateClientBalanceInSheet(userId: string, newBalance: number): Promise<boolean> {
  const spreadsheet = getDoc();
  if (!spreadsheet) return false;

  await spreadsheet.loadInfo();
  const clientsSheet = spreadsheet.sheetsByTitle["Клиенты"];
  if (!clientsSheet) return false;

  const rows = await clientsSheet.getRows();
  const row = rows.find((r) => String(r.get("userId") ?? "").trim() === userId);
  if (!row) return false;

  const raw = row as { set: (key: string, value: string | number) => void; save: () => Promise<void> };
  raw.set("balance", newBalance);
  await raw.save();
  return true;
}

/**
 * При status=no в таблице возвращает сумму на баланс (один раз на id; сначала запись в БД — меньше гонок).
 */
async function applyPendingTransferRefunds(
  userId: string,
  transactions: SheetTransaction[],
  currentBalance: number
): Promise<number> {
  let balance = roundMoney(currentBalance);

  for (const tx of transactions) {
    if (tx.status !== "no") continue;
    if (tx.amount >= 0) continue;
    const id = tx.id?.trim();
    if (!id) continue;

    const refund = roundMoney(Math.abs(tx.amount));
    const newBal = roundMoney(balance + refund);

    try {
      await prisma.processedTransferRefund.create({
        data: { transactionId: id, userId },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        continue;
      }
      throw e;
    }

    const ok = await updateClientBalanceInSheet(userId, newBal);
    if (!ok) {
      await prisma.processedTransferRefund.deleteMany({ where: { transactionId: id } });
      continue;
    }
    balance = newBal;
  }

  return balance;
}

/**
 * Добавить транзакцию в лист «Транзакции». Если передан только userId, email берётся из листа «Клиенты».
 * Возвращает email клиента (для отправки уведомления о зачислении).
 */
export async function appendTransactionToSheet(params: {
  userId?: string;
  email?: string;
  amount: number;
  type: string;
  description: string;
  date: string;
}): Promise<{ email: string | null }> {
  const spreadsheet = getDoc();
  if (!spreadsheet) return { email: null };

  await spreadsheet.loadInfo();
  const clientsSheet = spreadsheet.sheetsByTitle["Клиенты"];
  const txSheet = spreadsheet.sheetsByTitle["Транзакции"];
  if (!txSheet) return { email: null };

  let email = params.email?.trim().toLowerCase() || null;
  if (!email && params.userId && clientsSheet) {
    const client = await getClientFromSheet(params.userId);
    email = client?.email?.trim() || null;
  }
  if (!email) return { email: null };

  const row: Record<string, string | number> = {
    id: params.date + "-" + Math.random().toString(36).slice(2, 9),
    email,
    amount: params.amount,
    type: params.type || (params.amount >= 0 ? "Credit" : "Debit"),
    description: params.description || "",
    date: params.date,
    status: "",
  };
  await txSheet.addRow(row);
  return { email };
}

/**
 * Список всех строк из листа «Транзакции» для проверки отправки писем о зачислении.
 * Колонки: id, email, amount, description, date, send. Письмо уходит только если в колонке send написано "ok".
 */
export async function getTransactionRowsForNotifications(): Promise<
  { rowNumber: number; id: string; email: string; amount: number; description: string; date: string; send: string }[]
> {
  const spreadsheet = getDoc();
  if (!spreadsheet) return [];

  await spreadsheet.loadInfo();
  const txSheet = spreadsheet.sheetsByTitle["Транзакции"];
  if (!txSheet) return [];

  const rows = await txSheet.getRows();
  const result: { rowNumber: number; id: string; email: string; amount: number; description: string; date: string; send: string }[] = [];

  const get = (row: { get: (key: string) => unknown }, ...keys: string[]) => {
    for (const k of keys) {
      const v = row.get(k);
      if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
    }
    return "";
  };
  const getNum = (row: { get: (key: string) => unknown }, ...keys: string[]) => {
    for (const k of keys) {
      const v = row.get(k);
      if (v !== undefined && v !== null) return Number(v);
    }
    return 0;
  };

  for (const row of rows) {
    const rowNumber = (row as { rowNumber: number }).rowNumber;
    const id = get(row, "id", "userId", "ID", "UserId");
    const email = get(row, "email", "Email", "EMAIL").toLowerCase();
    const amount = getNum(row, "amount", "Amount", "AMOUNT");
    const description = get(row, "description", "Description", "DESCRIPTION");
    const date = get(row, "date", "Date", "DATE", "дата", "Дата");
    const send = get(row, "send", "Send", "SEND");
    result.push({
      rowNumber,
      id,
      email,
      amount,
      description,
      date,
      send,
    });
  }
  return result;
}

/**
 * Меняет в листе «Транзакции» в строке rowNumber значение колонки send на value (например «отправлено»).
 */
export async function setTransactionRowSendStatus(rowNumber: number, value: string): Promise<void> {
  const spreadsheet = getDoc();
  if (!spreadsheet) return;

  await spreadsheet.loadInfo();
  const txSheet = spreadsheet.sheetsByTitle["Транзакции"];
  if (!txSheet) return;

  const rows = await txSheet.getRows();
  const row = rows.find((r) => (r as { rowNumber: number }).rowNumber === rowNumber);
  if (!row) return;

  const raw = row as { set: (key: string, value: string) => void; save: () => Promise<void> };
  raw.set("send", value);
  await raw.save();
}

export function isSheetsConfigured(): boolean {
  return !!(process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);
}
