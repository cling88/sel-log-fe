export type BankAccount = {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  createdAtIso: string;
  updatedAtIso: string;
};

export type BankSummary = Pick<
  BankAccount,
  "id" | "bankName" | "accountNumber" | "accountHolder"
>;

export type BankAccountInput = Pick<
  BankAccount,
  "bankName" | "accountNumber" | "accountHolder"
>;

/** 매입 라인 공통 — 출금계좌 */
export type PurchaseLineBankFields = {
  bankId: string | null;
  bank: BankSummary | null;
};
