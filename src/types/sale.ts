export type SaleOrderStatus = "normal" | "cancelled";

export const SALE_CHANNELS = [
  "스마트스토어",
  "쿠팡",
  "카카오쇼핑",
  "자체몰",
  "오프라인",
  "기타",
] as const;

export interface SaleOrderItem {
  productId: string;
  productSku: string;
  productName: string;
  quantity: number;
  lineAmount: number;
}

export interface SaleOrderAdjustment {
  id: string;
  label: string;
  amount: number;
}

export interface SaleOrder {
  id: string;
  orderDate: string;
  orderNo: string;
  customerName: string;
  channel?: string;
  items: SaleOrderItem[];
  extraAdjustments: SaleOrderAdjustment[];
  discountAdjustments: SaleOrderAdjustment[];
  extraAmount: number;
  discountAmount: number;
  totalAmount: number;
  memo?: string;
  status: SaleOrderStatus;
}
