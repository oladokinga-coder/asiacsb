/** Клиентское хранение: карта «заблокирована» до явной разблокировки (синхрон между страницами). */

export function cardBlockedStorageKey(userId: string): string {
  return `csob_card_blocked_${userId}`;
}

export function readCardBlocked(userId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(cardBlockedStorageKey(userId)) === "true";
  } catch {
    return false;
  }
}

export function writeCardBlocked(userId: string, blocked: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(cardBlockedStorageKey(userId), blocked ? "true" : "false");
    window.dispatchEvent(new CustomEvent("csob-card-blocked", { detail: { userId } }));
  } catch {
    /* quota / private mode */
  }
}
