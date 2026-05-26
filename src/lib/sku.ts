/** 카테고리별 시퀀스 — 예: SL-G-00001 */
export function formatSkuByCode(skuCode: string, sequence: number): string {
  const code = skuCode.toUpperCase().slice(0, 1);
  return `SL-${code}-${String(sequence).padStart(5, "0")}`;
}

function parseSkuSequence(sku: string, skuCode: string): number | null {
  const code = skuCode.toUpperCase().slice(0, 1);
  const match = sku.match(new RegExp(`^SL-${code}-(\\d+)$`, "i"));
  return match ? Number(match[1]) : null;
}

export function nextSku(
  products: { sku: string; category: string }[],
  categoryId: string,
  skuCode: string,
): string {
  let max = 0;
  for (const product of products) {
    if (product.category !== categoryId) continue;
    const seq = parseSkuSequence(product.sku, skuCode);
    if (seq != null) max = Math.max(max, seq);
  }
  return formatSkuByCode(skuCode, max + 1);
}

export function findProductBySku(
  products: { sku: string }[],
  sku: string,
): { sku: string } | undefined {
  const normalized = sku.trim().toUpperCase();
  if (!normalized) return undefined;
  return products.find((p) => p.sku.toUpperCase() === normalized);
}
