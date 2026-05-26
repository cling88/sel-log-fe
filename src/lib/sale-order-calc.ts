import type { Product } from "@/types/product";
import type { SaleOrder, SaleProductLine } from "@/types/sale-order";

/** 소득세 적립 참고율 (퍼블·장부용, 실제 신고액과 다를 수 있음) */
export const INCOME_TAX_RESERVE_RATE = 0.03;

export interface SaleOrderSummary {
  productCount: number;
  totalPaid: number;
  totalOut: number;
  totalVat: number;
  platformFee: number;
  totalCogs: number;
  netProfit: number;
  incomeTaxReserve: number;
  finalAfterTaxReserve: number;
}

function productLines(order: SaleOrder): SaleProductLine[] {
  return order.lines.filter((l): l is SaleProductLine => l.lineType === "product");
}

export function summarizeSaleOrder(
  order: SaleOrder,
  products: Pick<Product, "id" | "latestCostPerUnit">[],
  feeRate = 0.0585,
): SaleOrderSummary {
  const productsOnly = productLines(order);
  const shipping = order.lines.find((l) => l.lineType === "shipping");
  const coupon = order.lines.find((l) => l.lineType === "coupon");

  const productsTotal = productsOnly.reduce((s, l) => s + l.salePrice, 0);
  const shippingAmt =
    shipping && shipping.lineType === "shipping" ? shipping.amount : 0;
  const couponAmt =
    coupon && coupon.lineType === "coupon" ? coupon.amount : 0;

  const totalPaid = productsTotal + shippingAmt - couponAmt;
  const totalVat =
    productsOnly.reduce((s, l) => s + l.vat, 0) +
    (shipping && shipping.lineType === "shipping" ? (shipping.vat ?? 0) : 0);

  const totalCogs = productsOnly.reduce((sum, line) => {
    const cost =
      products.find((p) => p.id === line.productId)?.latestCostPerUnit ?? 0;
    return sum + cost * line.quantity;
  }, 0);

  const platformFee = Math.round(productsTotal * feeRate);
  const totalOut = totalVat + platformFee + totalCogs;
  const netProfit = totalPaid - totalVat - platformFee - totalCogs;
  const productCount = productsOnly.reduce((s, l) => s + l.quantity, 0);
  const incomeTaxReserve = Math.round(
    netProfit * INCOME_TAX_RESERVE_RATE,
  );
  const finalAfterTaxReserve = netProfit - incomeTaxReserve;

  return {
    productCount,
    totalPaid,
    totalOut,
    totalVat,
    platformFee,
    totalCogs,
    netProfit,
    incomeTaxReserve,
    finalAfterTaxReserve,
  };
}
