import type { PurchaseLineBankFields } from "@/types/bank-account";

export interface IncomeDepositLine extends PurchaseLineBankFields {
  id: string;
  depositDate: string;
  itemName: string;
  amount: number;
  /** 부가세 (정보용) */
  vatAmount?: number | null;
  /** 플랫폼 수수료 (정보용) */
  commissionAmount?: number | null;
  memo: string;
}

export interface IncomeDepositLineInput {
  depositDate: string;
  itemName: string;
  amount: string;
  vatAmount: string;
  commissionAmount: string;
  memo: string;
  bankId: string;
}

export function createEmptyIncomeDepositInput(
  depositDate?: string,
): IncomeDepositLineInput {
  return {
    depositDate: depositDate ?? "",
    itemName: "",
    amount: "",
    vatAmount: "",
    commissionAmount: "",
    memo: "",
    bankId: "",
  };
}
