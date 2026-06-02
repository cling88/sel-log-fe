export interface OtherExpenseLine {
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
}

export function createEmptyOtherExpenseInput(
  paymentDate?: string,
): OtherExpenseLineInput {
  return {
    paymentDate: paymentDate ?? "",
    itemName: "",
    paymentAmount: "",
    memo: "",
  };
}
