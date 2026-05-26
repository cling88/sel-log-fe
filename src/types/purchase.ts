export type PurchaseTabType = "purchase" | "supply" | "expense";

export interface PurchaseRow {
  id: string;
  productId: string;
  sku: string;
  date: string;
  vendor: string;
  name: string;
  quantity: number;
  /** 최종 결제금액 (입력) */
  totalPayment: number;
  /** 부가세 (입력·기록용) */
  vat: number | null;
  /** 개당 단가 — totalPayment ÷ quantity 로 자동 계산 */
  unitPrice: number;
  shippingFee: number | null;
  discount: number | null;
  costPerUnit: number;
  recommendedPrice: number;
}

export interface SupplyRow {
  id: string;
  date: string;
  vendor: string;
  name: string;
  quantity: number;
  unitPrice: number | null;
  totalPayment: number;
  memo: string;
}

export interface ExpenseRow {
  id: string;
  date: string;
  vendor: string;
  content: string;
  amount: number;
  memo: string;
}
