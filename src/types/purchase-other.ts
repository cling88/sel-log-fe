import type { PurchaseLineBankFields } from "@/types/bank-account";

export interface OtherExpenseLine extends PurchaseLineBankFields {
  id: string;
  paymentDate: string;
  itemName: string;
  paymentAmount: number;
  memo: string;
}

export interface OtherExpenseLineInput {
  paymentDate: string;
  itemName: string;
  paymentAmount: string;
  memo: string;
  bankId: string;
}

export function createEmptyOtherExpenseInput(
  paymentDate?: string,
): OtherExpenseLineInput {
  return {
    paymentDate: paymentDate ?? "",
    itemName: "",
    paymentAmount: "",
    memo: "",
    bankId: "",
  };
}
