import type { SalesChannelSummary } from "@/types/sale-channel";

export type SaleOrderStatus = "normal" | "cancelled";

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
  channelId: string | null;
  channel: SalesChannelSummary | null;
  items: SaleOrderItem[];
  extraAdjustments: SaleOrderAdjustment[];
  discountAdjustments: SaleOrderAdjustment[];
  extraAmount: number;
  discountAmount: number;
  totalAmount: number;
  memo?: string;
  status: SaleOrderStatus;
}
