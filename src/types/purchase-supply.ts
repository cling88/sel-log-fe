export interface SupplyExpenseLine {
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
  vendor: string;
  quantity: string;
  paymentAmount: string;
  memo: string;
}

export function createEmptySupplyExpenseInput(
  paymentDate?: string,
): SupplyExpenseLineInput {
  return {
    paymentDate: paymentDate ?? "",
    itemName: "",
    vendor: "",
    quantity: "1",
    paymentAmount: "",
    memo: "",
  };
}
