import { formatBankLabel } from "@/lib/bank-label";
import type { PurchaseLineBankFields } from "@/types/bank-account";

export function formatPurchaseLineBankLabel(
  line: Pick<PurchaseLineBankFields, "bankId" | "bank">,
  deletedLabel = "삭제된 출금계좌",
): string {
  if (line.bank) return formatBankLabel(line.bank, { maskAccount: true });
  if (line.bankId) return deletedLabel;
  return "—";
}

export function purchaseBankIdForApi(bankId: string | null | undefined): string | null {
  return bankId ?? null;
}
