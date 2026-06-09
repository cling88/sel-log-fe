import type { PurchaseLineBankFields } from "@/types/bank-account";
import type { PurchaseLineVendorFields } from "@/types/vendor";

export interface SupplyExpenseLine
  extends PurchaseLineBankFields,
    PurchaseLineVendorFields {
  id: string;
  paymentDate: string;
  itemName: string;
  vendor: string;
  quantity: number;
  paymentAmount: number;
  memo: string;
  stockReflected: boolean;
}

export interface SupplyExpenseLineInput {
  paymentDate: string;
  itemName: string;
  quantity: string;
  paymentAmount: string;
  memo: string;
  bankId: string;
  vendorId: string;
}

export function createEmptySupplyExpenseInput(
  paymentDate?: string,
): SupplyExpenseLineInput {
  return {
    paymentDate: paymentDate ?? "",
    itemName: "",
    quantity: "1",
    paymentAmount: "",
    memo: "",
    bankId: "",
    vendorId: "",
  };
}
