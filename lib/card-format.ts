/**
 * Номер карты в Google Sheets должен быть в колонке с форматом «Текст»,
 * иначе таблица хранит его как число → экспонента (4.17E+15), и отображение ломается.
 */

export function normalizeCardNumberFromSheet(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  if (typeof raw === "number") {
    if (!Number.isFinite(raw)) return "";
    return String(Math.round(raw));
  }
  let s = String(raw).trim();
  if (!s) return "";
  if (/^[0-9\s]+$/.test(s)) {
    return s.replace(/\s/g, "");
  }
  if (/[eE]/.test(s)) {
    const n = Number(s);
    if (!Number.isFinite(n)) return s;
    return String(Math.round(n));
  }
  return s.replace(/\s/g, "");
}

/** Когда карта скрыта (перевыпуск): показываем только маску. */
export const MASKED_CARD_NUMBER = "•••• •••• •••• ••••";
export const MASKED_CARD_VALID = "••/••";
export const MASKED_CARD_CVV = "•••";
/** Бенефициар и др. чувствительные поля при скрытии до подтверждения перевыпуска */
export const MASKED_SENSITIVE = "•••••••• •••• ••••";

/** Группирует только цифры PAN по 4 — не трогает экспоненциальную запись как текст. */
export function formatCardNumberForDisplay(num: string): string {
  if (num === "—" || !num) return "•••• •••• •••• ••••";
  let digits = "";
  if (/[eE]/.test(num)) {
    const n = Number(num.trim());
    if (Number.isFinite(n)) digits = String(Math.round(n));
  }
  if (!digits) {
    digits = num.replace(/\D/g, "");
  }
  if (digits.length < 12) {
    return num.trim() || "•••• •••• •••• ••••";
  }
  return digits.match(/.{1,4}/g)?.join(" ") ?? num;
}
