import type { BankSummary } from "@/types/bank-account";

export function maskAccountNumber(accountNumber: string): string {
  const trimmed = accountNumber.trim();
  if (trimmed.length <= 4) return trimmed;
  return `****${trimmed.slice(-4)}`;
}

export function formatBankLabel(
  bank: Pick<BankSummary, "bankName" | "accountNumber" | "accountHolder">,
  options?: { maskAccount?: boolean },
): string {
  const account = options?.maskAccount
    ? maskAccountNumber(bank.accountNumber)
    : bank.accountNumber;
  return `${bank.bankName} · ${account} · ${bank.accountHolder}`;
}
