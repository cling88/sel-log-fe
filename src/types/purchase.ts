export type PurchaseTabType = "purchase" | "supply" | "expense";

export interface PurchaseRow {
  id: string;
  productId: string;
  sku: string;
  date: string;
  vendor: string;
  name: string;
  quantity: number;
  unitPrice: number;
  shippingFee: number | null;
  discount: number | null;
  totalPayment: number;
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
