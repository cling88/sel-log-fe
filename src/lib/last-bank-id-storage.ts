const LAST_WITHDRAWAL_BANK_ID_KEY = "sellog:last-withdrawal-bank-id";

export function getLastWithdrawalBankId(): string | null {
  if (typeof globalThis.localStorage === "undefined") return null;
  const id = globalThis.localStorage.getItem(LAST_WITHDRAWAL_BANK_ID_KEY);
  return id?.trim() || null;
}

export function setLastWithdrawalBankId(bankId: string): void {
  if (typeof globalThis.localStorage === "undefined") return;
  globalThis.localStorage.setItem(LAST_WITHDRAWAL_BANK_ID_KEY, bankId);
}
