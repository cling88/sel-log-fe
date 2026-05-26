import type { SaleChannel } from "@/types/sale";

export type SaleOrderLineType = "product" | "shipping" | "coupon";

export interface SaleProductLine {
  id: string;
  lineType: "product";
  productId: string;
  sku: string;
  productName: string;
  salePrice: number;
  vat: number;
  quantity: number;
}

export interface SaleShippingLine {
  id: string;
  lineType: "shipping";
  amount: number;
  vat?: number;
}

export interface SaleCouponLine {
  id: string;
  lineType: "coupon";
  amount: number;
}

export type SaleOrderLine =
  | SaleProductLine
  | SaleShippingLine
  | SaleCouponLine;

export interface SaleOrder {
  id: string;
  date: string;
  channel: SaleChannel;
  orderNo?: string;
  lines: SaleOrderLine[];
  memo?: string;
}
