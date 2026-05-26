export type InventoryEntryType = "purchase" | "sale" | "manual";
export type InventoryEntrySource = "auto" | "manual";

export interface InventorySummaryRow {
  productId: string;
  productName: string;
  purchaseQty: number;
  saleQty: number;
  adjustmentQty: number;
  currentStock: number;
}

export interface InventoryHistoryRow {
  id: string;
  productId: string;
  date: string;
  type: InventoryEntryType;
  quantity: number;
  /** 수동 조정 시 개당 원가 (금액 = unitCost × |quantity|) */
  unitCost?: number;
  reason: string;
  source: InventoryEntrySource;
}
