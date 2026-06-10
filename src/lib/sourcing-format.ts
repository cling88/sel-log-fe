import { formatAmount } from "@/lib/purchase-product-calc";
import type { SourcingProduct } from "@/types/sourcing";

export function formatSourcingProductPriceLine(product: SourcingProduct): string {
  return `개당 ${formatAmount(product.unitPrice)}원 · 전체 ${formatAmount(product.totalPrice)}원`;
}
