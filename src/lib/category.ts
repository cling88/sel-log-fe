import type { ProductCategoryItem } from "@/types/master-data";

export function getCategoryLabel(
  categories: ProductCategoryItem[],
  categoryId: string,
): string {
  return categories.find((c) => c.id === categoryId)?.label ?? categoryId;
}

export function getCategorySkuCode(
  categories: ProductCategoryItem[],
  categoryId: string,
): string {
  return categories.find((c) => c.id === categoryId)?.skuCode ?? "X";
}

export function suggestNextSkuCode(
  categories: ProductCategoryItem[],
): string {
  const used = new Set(
    categories.map((c) => c.skuCode.toUpperCase()).filter(Boolean),
  );
  for (let i = 65; i <= 90; i++) {
    const code = String.fromCharCode(i);
    if (!used.has(code)) return code;
  }
  return "X";
}
