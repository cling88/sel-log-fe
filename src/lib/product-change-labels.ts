import type {
  ProductChangeFrom,
  ProductChangeKind,
} from "@/types/inventory-product";

export const PRODUCT_CHANGE_KIND_LABEL: Record<ProductChangeKind, string> = {
  price: "금액조정",
  stock: "재고조정",
};

export const PRODUCT_CHANGE_FROM_LABEL: Record<ProductChangeFrom, string> = {
  edit: "편집수정",
  stock_adjust: "재고조정",
};

/** BE changeKind + changeFrom → `금액조정 · 편집수정` (둘 다 있을 때만) */
export function formatProductChangeTag(
  changeKind?: ProductChangeKind,
  changeFrom?: ProductChangeFrom,
): string | null {
  if (!changeKind || !changeFrom) return null;
  const kind = PRODUCT_CHANGE_KIND_LABEL[changeKind];
  const from = PRODUCT_CHANGE_FROM_LABEL[changeFrom];
  if (!kind || !from) return null;
  return `${kind} · ${from}`;
}
