export type SaleChannel = "naver" | "coupang" | "other";

export const SALE_CHANNEL_LABEL: Record<SaleChannel, string> = {
  naver: "네이버",
  coupang: "쿠팡",
  other: "기타",
};

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
