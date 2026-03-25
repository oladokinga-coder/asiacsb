/** Нормализация IBAN: без пробелов, верхний регистр. */
export function normalizeIban(raw: string): string {
  return raw.replace(/\s/g, "").toUpperCase();
}

/** Проверка IBAN (mod 97). */
export function isValidIban(iban: string): boolean {
  const c = normalizeIban(iban);
  if (c.length < 15 || c.length > 34) return false;
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(c)) return false;
  const rearranged = c.slice(4) + c.slice(0, 4);
  let expanded = "";
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0);
    if (code >= 48 && code <= 57) expanded += ch;
    else if (code >= 65 && code <= 90) expanded += String(code - 55);
    else return false;
  }
  let remainder = 0;
  for (let i = 0; i < expanded.length; i++) {
    remainder = (remainder * 10 + parseInt(expanded[i], 10)) % 97;
  }
  return remainder === 1;
}

/** BIC/SWIFT: 8 или 11 символов. */
export function normalizeBic(raw: string): string {
  return raw.replace(/\s/g, "").toUpperCase();
}

export function isValidBic(bic: string): boolean {
  const b = normalizeBic(bic);
  if (b.length !== 8 && b.length !== 11) return false;
  return /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(b);
}
