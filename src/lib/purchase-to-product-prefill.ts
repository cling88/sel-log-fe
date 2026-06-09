import {
  calcFinalUnitPrice,
  calcUnitPrice,
  formatRecommendedPriceRange,
  type MarginRateRange,
} from "@/lib/purchase-product-calc";
import type { InventoryProductInput } from "@/types/inventory-product";

export type StockReflectPricingContext = {
  totalOrder: number;
  totalExpense: number;
};

export type StockReflectLineContext = {
  /** 상품매입 */
  productName?: string;
  /** 부가 */
  itemName?: string;
  imageUrl?: string;
  paymentAmount?: number;
  quantity: number;
  vendor?: string;
  orderNo?: string;
  productLink?: string;
  memo?: string;
  /** 상품매입 — 구매처 그룹 기준 최종개당 계산용 */
  pricing?: StockReflectPricingContext;
};

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function buildMemo(ctx: StockReflectLineContext): string {
  const parts: string[] = [];
  const baseMemo = ctx.memo?.trim();
  if (baseMemo) parts.push(baseMemo);
  if (ctx.vendor?.trim()) parts.push(`구매처: ${ctx.vendor.trim()}`);
  if (ctx.orderNo?.trim()) parts.push(`주문번호: ${ctx.orderNo.trim()}`);
  if (ctx.productLink?.trim()) parts.push(`링크: ${ctx.productLink.trim()}`);
  return parts.join("\n");
}

/** 재고반영 모달 → 상품 등록 prefill (초기 재고는 항상 0) */
export function buildProductPrefillFromPurchaseLine(
  ctx: StockReflectLineContext,
): Partial<InventoryProductInput> {
  const name = (ctx.productName ?? ctx.itemName ?? "").trim();
  const quantity = Math.max(1, Math.trunc(ctx.quantity));
  const paymentAmount =
    typeof ctx.paymentAmount === "number" ? Math.trunc(ctx.paymentAmount) : 0;
  const unitPrice =
    paymentAmount > 0 ? calcUnitPrice(quantity, paymentAmount) : 0;
  const imageUrl = ctx.imageUrl?.trim() ?? "";

  return {
    sku: "",
    name,
    category: "",
    imageUrl: imageUrl && isHttpUrl(imageUrl) ? imageUrl : "",
    memo: buildMemo(ctx),
    active: true,
    stock: 0,
    safetyStock: 0,
    currentPrice: unitPrice ?? 0,
  };
}

/** 상품매입 목록과 동일한 추천 판매가 범위 (예: `118~700원`) */
export function formatRecommendedPriceLabelFromPurchaseLine(
  ctx: StockReflectLineContext,
  margins?: MarginRateRange,
): string | null {
  const quantity = Math.max(1, Math.trunc(ctx.quantity));
  const paymentAmount =
    typeof ctx.paymentAmount === "number" ? Math.trunc(ctx.paymentAmount) : 0;
  if (paymentAmount <= 0) return null;

  const unitPrice = calcUnitPrice(quantity, paymentAmount);
  const finalUnit = ctx.pricing
    ? calcFinalUnitPrice(
        { quantity, paymentAmount },
        ctx.pricing.totalOrder,
        ctx.pricing.totalExpense,
      )
    : unitPrice;
  const range = formatRecommendedPriceRange(unitPrice, finalUnit, margins);
  return range === "—" ? null : range;
}
