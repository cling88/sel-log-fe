import type {
  InventoryPriceHistoryItem,
  InventoryStockHistoryItem,
} from "@/types/inventory-product";

export type UnifiedHistoryEntry =
  | {
      kind: "stock";
      id: string;
      atIso: string;
      stockAfter: number;
      data: InventoryStockHistoryItem;
    }
  | {
      kind: "price";
      id: string;
      atIso: string;
      stockAfter: number;
      data: InventoryPriceHistoryItem;
    };

export function resolveStockHistorySource(h: InventoryStockHistoryItem) {
  if (h.source) return h.source;
  if (h.vendor || h.orderNo || h.unitPrice || h.totalAmount) return "purchase";
  return "manual_adjust";
}

/** 재고·가격 이력을 시간순(최신순) 통합, stockAfter는 현재 재고 기준 역산 */
export function buildUnifiedHistory(
  currentStock: number,
  stockHistory: InventoryStockHistoryItem[],
  priceHistory: InventoryPriceHistoryItem[],
): UnifiedHistoryEntry[] {
  const stockEntries: Extract<UnifiedHistoryEntry, { kind: "stock" }>[] =
    stockHistory.map((h) => ({
      kind: "stock" as const,
      id: `stk-${h.id}`,
      atIso: h.atIso,
      stockAfter: 0,
      data: h,
    }));
  const priceEntries: Extract<UnifiedHistoryEntry, { kind: "price" }>[] =
    priceHistory.map((h) => ({
      kind: "price" as const,
      id: `prh-${h.id}`,
      atIso: h.atIso,
      stockAfter: 0,
      data: h,
    }));

  const entries = [...stockEntries, ...priceEntries].sort(
    (a, b) => b.atIso.localeCompare(a.atIso) || a.id.localeCompare(b.id),
  );

  let runningStock = currentStock;
  const withStock: UnifiedHistoryEntry[] = [];

  for (const entry of entries) {
    if (entry.kind === "stock") {
      withStock.push({
        ...entry,
        stockAfter: runningStock,
      });
      runningStock -= entry.data.delta;
      continue;
    }
    withStock.push({
      ...entry,
      stockAfter: runningStock,
    });
  }

  return withStock;
}
