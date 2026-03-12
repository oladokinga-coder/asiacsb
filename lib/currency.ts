/** Форматирование сумм в евро (EUR) для баланса и транзакций */
export function formatEur(amount: number, options?: { sign?: boolean }): string {
  const sign = options?.sign && amount !== 0 ? (amount >= 0 ? "+" : "") : "";
  const formatted = Math.abs(amount).toLocaleString("de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${sign}${formatted} €`;
}
