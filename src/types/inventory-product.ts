export type InventoryProductStockAction = "increase" | "decrease";
export type InventoryPriceHistorySource =
  | "product_register"
  | "manual_edit"
  | "purchase";
export type InventoryStockHistorySource = "purchase" | "sale" | "manual_adjust";

export interface InventoryStockHistoryItem {
  id: string;
  atIso: string; // ISO string
  delta: number; // +로 증가, -로 감소
  source?: InventoryStockHistorySource;
  vendor?: string;
  orderNo?: string;
  unitPrice?: number;
  totalAmount?: number;
  reason?: string;
}

export interface InventoryPriceHistoryItem {
  id: string;
  atIso: string;
  price: number;
  source: InventoryPriceHistorySource;
  reason?: string;
}

export interface InventoryProduct {
  id: string;
  sku: string;
  name: string;
  category?: string;
  imageUrl?: string; // data URL (퍼블)
  memo?: string;
  active: boolean;

  stock: number; // 현재 재고
  safetyStock: number; // 안전재고
  currentPrice: number; // 현재 기본 판매가

  createdAtIso: string;
  updatedAtIso: string;
  deletedAtIso?: string;

  stockHistory: InventoryStockHistoryItem[];
  priceHistory: InventoryPriceHistoryItem[];
}

export type InventoryProductInput = Omit<
  InventoryProduct,
  | "id"
  | "createdAtIso"
  | "updatedAtIso"
  | "deletedAtIso"
  | "stockHistory"
  | "priceHistory"
>;

