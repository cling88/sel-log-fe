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
  /** 스마트스토어 등 주문번호 — 대사용 */
  orderNo?: string | null;
  /** 매출 주문 명시 연결 */
  linkedSaleOrderId?: string | null;
  memo: string;
}

export interface IncomeDepositLineInput {
  depositDate: string;
  itemName: string;
  amount: string;
  vatAmount: string;
  commissionAmount: string;
  orderNo: string;
  linkedSaleOrderId: string;
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
    orderNo: "",
    linkedSaleOrderId: "",
    memo: "",
    bankId: "",
  };
}
