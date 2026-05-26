import type { SaleChannelId } from "@/types/sale-channel";

export type SaleChannel = SaleChannelId;

export interface SaleRow {
  id: string;
  date: string;
  productId: string;
  sku: string;
  productName: string;
  channel: SaleChannel;
  quantity: number;
  salePrice: number;
  fee: number;
  netProfit: number;
  memo: string;
}
