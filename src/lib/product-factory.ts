import { getCategorySkuCode } from "@/lib/category";
import { calcPurchase } from "@/lib/calc";
import { nextSku } from "@/lib/sku";
import type { ProductCategoryItem } from "@/types/master-data";
import type { Product } from "@/types/product";

export function createProduct(
  existing: Product[],
  categories: ProductCategoryItem[],
  payload: {
    name: string;
    category: string;
    mainVendor?: string;
    memo?: string;
    /** 장부 인라인 추가 시 원가·권장가 기본값 */
    withLedgerDefaults?: boolean;
  },
): Product {
  const calc = payload.withLedgerDefaults
    ? calcPurchase({ quantity: 1, unitPrice: 0 })
    : { costPerUnit: 0, recommendedPrice: 0 };

  const skuCode = getCategorySkuCode(categories, payload.category);

  return {
    id: `prod-${Date.now()}`,
    sku: nextSku(existing, payload.category, skuCode),
    name: payload.name,
    category: payload.category,
    mainVendor: payload.mainVendor ?? "",
    memo: payload.memo ?? "",
    latestCostPerUnit: calc.costPerUnit,
    recommendedPrice: calc.recommendedPrice,
    currentStock: 0,
  };
}

export function mapProductToPurchaseFields(
  product: Product,
  vendorFallback = "",
) {
  return {
    productId: product.id,
    sku: product.sku,
    name: product.name,
    vendor: product.mainVendor || vendorFallback,
  };
}

export function mapProductToSaleFields(product: Product) {
  return {
    productId: product.id,
    sku: product.sku,
    productName: product.name,
  };
}
