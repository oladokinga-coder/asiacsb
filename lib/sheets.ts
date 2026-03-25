/**
 * Работа с Google Таблицей.
 * Таблица должна содержать листы:
 * - "Клиенты": userId, email, fullName, balance, cardNumber, cardValid, cardCvv, passportSeries, passportNumber, birthDate, country, createdAt, beneficiary, accountNumber (опционально)
 *   При регистрации заполняются: userId, email, fullName, passportSeries, passportNumber, birthDate, country, createdAt. Карта (cardNumber, cardValid, cardCvv) — вручную.
 * - "Транзакции": id, email (или userId), amount, type, description, date
 *
 * Настройка: GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY (или JSON ключ в одной переменной).
 */

import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

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
  transactions: { id: string; amount: number; type: string; description: string; date: string }[];
};

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
  const cardNumber = String(row.get("cardNumber") ?? "").trim() || "—";
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
      }))
      .sort((a, b) => (b.date > a.date ? 1 : -1))
      .slice(0, 100);
  }

  return {
    balance,
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
