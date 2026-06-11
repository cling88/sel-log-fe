import {
  calcFinalUnitPrice,
  calcRecommendedPrice,
  calcUnitPrice,
  formatRecommendedPriceRange,
  type MarginRateRange,
} from "@/lib/purchase-product-calc";
import { DEFAULT_USER_SETTINGS } from "@/types/settings";
import type {
  InventoryProductInput,
  InventoryProductKind,
} from "@/types/inventory-product";

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
  productKind?: InventoryProductKind;
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

function resolvePurchaseUnitPrice(ctx: StockReflectLineContext): number {
  const quantity = Math.max(1, Math.trunc(ctx.quantity));
  const paymentAmount =
    typeof ctx.paymentAmount === "number" ? Math.trunc(ctx.paymentAmount) : 0;
  if (paymentAmount <= 0) return 0;

  const unitPrice = calcUnitPrice(quantity, paymentAmount);
  if (!ctx.pricing) return unitPrice;

  return calcFinalUnitPrice(
    { quantity, paymentAmount },
    ctx.pricing.totalOrder,
    ctx.pricing.totalExpense,
  );
}

/** 재고반영 신규 등록 prefill용 — 매입 단가가 아닌 추천 판매가(마진 하한 기준) */
export function calcDefaultSellingPriceFromPurchaseLine(
  ctx: StockReflectLineContext,
  margins: MarginRateRange = {
    min: DEFAULT_USER_SETTINGS.marginMinRate,
    max: DEFAULT_USER_SETTINGS.marginMaxRate,
  },
): number {
  const purchaseUnit = resolvePurchaseUnitPrice(ctx);
  if (purchaseUnit <= 0) return 0;

  const recommended = calcRecommendedPrice(purchaseUnit, margins.min);
  return recommended > 0 ? recommended : purchaseUnit;
}

/** 재고반영 모달 → 상품 등록 prefill (초기 재고는 항상 0) */
export function buildProductPrefillFromPurchaseLine(
  ctx: StockReflectLineContext,
  margins?: MarginRateRange,
): Partial<InventoryProductInput> {
  const name = (ctx.productName ?? ctx.itemName ?? "").trim();
  const imageUrl = ctx.imageUrl?.trim() ?? "";
  const currentPrice = calcDefaultSellingPriceFromPurchaseLine(ctx, margins);

  return {
    sku: "",
    name,
    productKind: ctx.productKind ?? "product",
    category: "",
    imageUrl: imageUrl && isHttpUrl(imageUrl) ? imageUrl : "",
    memo: buildMemo(ctx),
    active: true,
    stock: 0,
    safetyStock: 0,
    currentPrice,
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
