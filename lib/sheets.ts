/**
 * Работа с Google Таблицей.
 * Таблица должна содержать листы:
 * - "Клиенты": … колонка trans = ok — разрешены переводы; пусто — нет.
 *   pleaseChange = ok — клиенту скрыть номер/срок/CVV до смены карты; change = ok — снова показывать данные.
 *   При регистрации заполняются: userId, email, fullName, passportSeries, passportNumber, birthDate, country, createdAt. Карта (cardNumber, cardValid, cardCvv) — вручную.
 * - "Транзакции": id, email (или userId), amount, type, description, date, status (пусто — в обработке; ok — отправлено; no — отменено: отриц. сумма не входит в баланс)
 *   Баланс в «Клиенты».balance пересчитывается из суммы операций (см. computeBalanceFromTransactions).
 *
 * Настройка: GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY (или JSON ключ в одной переменной).
 */

import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";
import { normalizeCardNumberFromSheet } from "@/lib/card-format";

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
  /** pleaseChange=ok и change≠ok — данные карты не показывать клиенту */
  cardDetailsHidden: boolean;
  transactions: SheetTransaction[];
};

type SheetRowLike = {
  get: (key: string) => unknown;
  rowNumber?: number;
  set?: (key: string, value: string | number) => void;
  save?: () => Promise<void>;
};

type ClientRecord = {
  userId: string;
  balanceFromSheet: number;
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
  transferAllowed: boolean;
  cardDetailsHidden: boolean;
};

type SheetCache = {
  expiresAt: number;
  clientsByUserId: Map<string, ClientRecord>;
  txByEmail: Map<string, SheetTransaction[]>;
  txByUserId: Map<string, SheetTransaction[]>;
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

/** Дата из ячейки (строка, число-сериал Sheets или Date) → строка для UI. */
function formatDateCell(raw: unknown): string {
  if (raw == null) return "";
  if (raw instanceof Date) return raw.toISOString().split("T")[0];
  if (typeof raw === "number") {
    const epoch = Date.UTC(1899, 11, 30);
    const ms = epoch + Math.round(raw * 86400000);
    const d = new Date(ms);
    if (!Number.isNaN(d.getTime())) return d.toISOString().split("T")[0];
  }
  return String(raw).trim();
}

/** Сортировка по времени: большее значение = новее. */
function parseTxDateMsForSort(dateStr: string): number {
  const s = dateStr.trim();
  if (!s) return 0;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const t = Date.parse(s);
    if (!Number.isNaN(t)) return t;
  }
  const dmy = /^(\d{1,2})[./](\d{1,2})[./](\d{2,4})/.exec(s);
  if (dmy) {
    const day = parseInt(dmy[1], 10);
    const month = parseInt(dmy[2], 10) - 1;
    let y = parseInt(dmy[3], 10);
    if (y < 100) y += 2000;
    const t = new Date(y, month, day).getTime();
    if (!Number.isNaN(t)) return t;
  }
  const t = Date.parse(s);
  return Number.isNaN(t) ? 0 : t;
}

/** Баланс = сумма amount; отрицательная со status=no не учитывается. */
export function computeBalanceFromTransactions(transactions: SheetTransaction[]): number {
  let s = 0;
  for (const tx of transactions) {
    const amt = roundMoney(Number(tx.amount));
    if (tx.status === "no" && amt < 0) continue;
    s += amt;
  }
  return roundMoney(s);
}

let doc: GoogleSpreadsheet | null = null;
let sheetCache: SheetCache | null = null;

const SHEET_CACHE_TTL_MS = Number(process.env.SHEETS_CACHE_TTL_MS ?? 30000);
const SHEETS_TIMEOUT_MS = Number(process.env.SHEETS_TIMEOUT_MS ?? 8000);

function invalidateSheetCache(): void {
  sheetCache = null;
}

function txSortDesc(a: SheetTransaction, b: SheetTransaction): number {
  const byTime = parseTxDateMsForSort(b.date) - parseTxDateMsForSort(a.date);
  if (byTime !== 0) return byTime;
  return b.id.localeCompare(a.id);
}

function isCacheFresh(cache: SheetCache | null): cache is SheetCache {
  return !!cache && cache.expiresAt > Date.now();
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Sheets timeout: ${label}`)), Math.max(1000, timeoutMs));
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function readClientRecord(row: SheetRowLike): ClientRecord {
  const balanceFromSheet = Number(row.get("balance") ?? 0);
  const cardNumber = normalizeCardNumberFromSheet(row.get("cardNumber")) || "—";
  const cardValid = String(row.get("cardValid") ?? "").trim() || "—";
  const cardCvvRaw = row.get("cardCvv") ?? row.get("CardCvv") ?? row.get("CVV") ?? row.get("cvv") ?? "";
  const cardCvv = String(cardCvvRaw).trim() || "—";
  const fullName = String(row.get("fullName") ?? "").trim() || "—";
  const clientEmail = String(row.get("email") ?? "").trim().toLowerCase();
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
  const pleaseChangeRaw = String(row.get("pleaseChange") ?? "").trim().toLowerCase();
  const changeRaw = String(row.get("change") ?? "").trim().toLowerCase();
  const cardDetailsHidden = pleaseChangeRaw === "ok" && changeRaw !== "ok";

  return {
    userId: String(row.get("userId") ?? "").trim(),
    balanceFromSheet,
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
    cardDetailsHidden,
  };
}

async function getOrBuildSheetCache(spreadsheet: GoogleSpreadsheet): Promise<SheetCache> {
  if (isCacheFresh(sheetCache)) return sheetCache;

  try {
    await withTimeout(spreadsheet.loadInfo(), SHEETS_TIMEOUT_MS, "loadInfo");
    const clientsSheet = spreadsheet.sheetsByTitle["Клиенты"];
    const txSheet = spreadsheet.sheetsByTitle["Транзакции"];

    const clientsByUserId = new Map<string, ClientRecord>();
    if (clientsSheet) {
      const rows = await withTimeout(clientsSheet.getRows(), SHEETS_TIMEOUT_MS, "clients.getRows");
      for (const row of rows as SheetRowLike[]) {
        const record = readClientRecord(row);
        if (record.userId) clientsByUserId.set(record.userId, record);
      }
    }

    const txByEmail = new Map<string, SheetTransaction[]>();
    const txByUserId = new Map<string, SheetTransaction[]>();
    if (txSheet) {
      const txRows = await withTimeout(txSheet.getRows(), SHEETS_TIMEOUT_MS, "transactions.getRows");
      for (const row of txRows as SheetRowLike[]) {
        const dateStr = formatDateCell(row.get("date"));
        const rowNum = row.rowNumber ?? 0;
        const tx: SheetTransaction = {
          id: String(row.get("id") ?? row.get("rowIndex") ?? rowNum),
          amount: Number(row.get("amount") ?? 0),
          type: String(row.get("type") ?? ""),
          description: String(row.get("description") ?? ""),
          date: dateStr,
          status: normalizeTxStatus(row.get("status")),
        };
        const rowEmail = String(row.get("email") ?? "").trim().toLowerCase();
        const rowUserId = String(row.get("userId") ?? row.get("id") ?? "").trim();

        if (rowEmail) {
          const arr = txByEmail.get(rowEmail) ?? [];
          arr.push(tx);
          txByEmail.set(rowEmail, arr);
        }
        if (rowUserId) {
          const arr = txByUserId.get(rowUserId) ?? [];
          arr.push(tx);
          txByUserId.set(rowUserId, arr);
        }
      }
      txByEmail.forEach((arr) => arr.sort(txSortDesc));
      txByUserId.forEach((arr) => arr.sort(txSortDesc));
    }

    sheetCache = {
      expiresAt: Date.now() + Math.max(1000, SHEET_CACHE_TTL_MS),
      clientsByUserId,
      txByEmail,
      txByUserId,
    };
    return sheetCache;
  } catch (e) {
    console.error("build sheets cache:", e);
    if (sheetCache) return sheetCache;
    return {
      expiresAt: Date.now() + 2000,
      clientsByUserId: new Map<string, ClientRecord>(),
      txByEmail: new Map<string, SheetTransaction[]>(),
      txByUserId: new Map<string, SheetTransaction[]>(),
    };
  }
}

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
  try {
    await withTimeout(spreadsheet.loadInfo(), SHEETS_TIMEOUT_MS, "appendClient.loadInfo");
    const sheet = spreadsheet.sheetsByTitle["Клиенты"] ?? spreadsheet.sheetsByIndex[0];
    await withTimeout(
      sheet.addRow({
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
      }),
      SHEETS_TIMEOUT_MS,
      "appendClient.addRow"
    );
    invalidateSheetCache();
  } catch (e) {
    console.error("append client to sheet:", e);
  }
}

export async function getClientFromSheet(userId: string): Promise<SheetClient | null> {
  const spreadsheet = getDoc();
  if (!spreadsheet) return null;
  try {
    const cache = await getOrBuildSheetCache(spreadsheet);
    const client = cache.clientsByUserId.get(userId);
    if (!client) return null;

    const byEmail = client.email ? cache.txByEmail.get(client.email) ?? [] : [];
    const byUserId = cache.txByUserId.get(userId) ?? [];
    const merged = [...byEmail, ...byUserId];
    const unique = new Map<string, SheetTransaction>();
    for (const tx of merged) {
      unique.set(tx.id, tx);
    }
    const allForBalance = Array.from(unique.values()).sort(txSortDesc);
    const transactions = allForBalance.slice(0, 100);

    const computedBalance = computeBalanceFromTransactions(allForBalance);
    if (Math.abs(computedBalance - roundMoney(client.balanceFromSheet)) > 0.005) {
      try {
        await updateClientBalanceInSheet(userId, computedBalance);
      } catch (e) {
        console.error("sync balance to sheet:", e);
      }
    }

    return {
      balance: computedBalance,
      cardNumber: client.cardNumber,
      cardValid: client.cardValid,
      cardCvv: client.cardCvv,
      fullName: client.fullName,
      email: client.email,
      country: client.country,
      passportSeries: client.passportSeries,
      passportNumber: client.passportNumber,
      birthDate: client.birthDate,
      createdAt: client.createdAt,
      beneficiary: client.beneficiary,
      accountNumber: client.accountNumber,
      transferAllowed: client.transferAllowed,
      cardDetailsHidden: client.cardDetailsHidden,
      transactions,
    };
  } catch (e) {
    console.error("get client from sheet:", e);
    return null;
  }
}

/**
 * Обновить колонку balance в строке клиента по userId (лист «Клиенты»).
 */
export async function updateClientBalanceInSheet(userId: string, newBalance: number): Promise<boolean> {
  const spreadsheet = getDoc();
  if (!spreadsheet) return false;
  try {
    await withTimeout(spreadsheet.loadInfo(), SHEETS_TIMEOUT_MS, "updateBalance.loadInfo");
    const clientsSheet = spreadsheet.sheetsByTitle["Клиенты"];
    if (!clientsSheet) return false;

    const rows = await withTimeout(clientsSheet.getRows(), SHEETS_TIMEOUT_MS, "updateBalance.getRows");
    const row = rows.find((r) => String(r.get("userId") ?? "").trim() === userId);
    if (!row) return false;

    const raw = row as { set: (key: string, value: string | number) => void; save: () => Promise<void> };
    raw.set("balance", newBalance);
    await withTimeout(raw.save(), SHEETS_TIMEOUT_MS, "updateBalance.save");
    invalidateSheetCache();
    return true;
  } catch (e) {
    console.error("update balance in sheet:", e);
    return false;
  }
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
  try {
    await withTimeout(spreadsheet.loadInfo(), SHEETS_TIMEOUT_MS, "appendTx.loadInfo");
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
    await withTimeout(txSheet.addRow(row), SHEETS_TIMEOUT_MS, "appendTx.addRow");
    invalidateSheetCache();
    if (params.userId) {
      try {
        await getClientFromSheet(params.userId);
      } catch (e) {
        console.error("post-append balance sync:", e);
      }
    }
    return { email };
  } catch (e) {
    console.error("append transaction to sheet:", e);
    return { email: null };
  }
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
  try {
    await withTimeout(spreadsheet.loadInfo(), SHEETS_TIMEOUT_MS, "notifications.loadInfo");
    const txSheet = spreadsheet.sheetsByTitle["Транзакции"];
    if (!txSheet) return [];

    const rows = await withTimeout(txSheet.getRows(), SHEETS_TIMEOUT_MS, "notifications.getRows");
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
  } catch (e) {
    console.error("get transaction rows for notifications:", e);
    return [];
  }
}

/**
 * Меняет в листе «Транзакции» в строке rowNumber значение колонки send на value (например «отправлено»).
 */
export async function setTransactionRowSendStatus(rowNumber: number, value: string): Promise<void> {
  const spreadsheet = getDoc();
  if (!spreadsheet) return;
  try {
    await withTimeout(spreadsheet.loadInfo(), SHEETS_TIMEOUT_MS, "setSendStatus.loadInfo");
    const txSheet = spreadsheet.sheetsByTitle["Транзакции"];
    if (!txSheet) return;

    const rows = await withTimeout(txSheet.getRows(), SHEETS_TIMEOUT_MS, "setSendStatus.getRows");
    const row = rows.find((r) => (r as { rowNumber: number }).rowNumber === rowNumber);
    if (!row) return;

    const raw = row as { set: (key: string, value: string) => void; save: () => Promise<void> };
    raw.set("send", value);
    await withTimeout(raw.save(), SHEETS_TIMEOUT_MS, "setSendStatus.save");
    invalidateSheetCache();
  } catch (e) {
    console.error("set transaction send status:", e);
  }
}

export function isSheetsConfigured(): boolean {
  return !!(process.env.GOOGLE_SHEET_ID && process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY);
}
