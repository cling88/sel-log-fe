export type InventoryProductStockAction = "increase" | "decrease";

/** 판매상품 vs 부가·소모품 */
export type InventoryProductKind = "product" | "supply";

export type InventoryPurchaseType = "product" | "supply";

/** BE 변경 구분 — 수동 금액/재고 조정 시에만 내려옴 */
export type ProductChangeKind = "price" | "stock";
export type ProductChangeFrom = "edit" | "stock_adjust";

export interface ProductChangeTags {
  changeKind?: ProductChangeKind;
  changeFrom?: ProductChangeFrom;
}

export type InventoryPriceHistorySource =
  | "product_register"
  | "manual_edit"
  | "purchase";
export type InventoryStockHistorySource = "purchase" | "sale" | "manual_adjust";

export interface InventoryStockHistoryItem extends ProductChangeTags {
  id: string;
  atIso: string; // ISO string
  delta: number; // +로 증가, -로 감소
  source?: InventoryStockHistorySource;
  /** 매입 반영 시 상품매입 vs 부가 (미제공 시 상품 `productKind`로 구분) */
  purchaseType?: InventoryPurchaseType;
  vendor?: string;
  orderNo?: string;
  unitPrice?: number;
  totalAmount?: number;
  reason?: string;
}

export interface InventoryPriceHistoryItem extends ProductChangeTags {
  id: string;
  atIso: string;
  price: number;
  /** 직전 판매가 — 변경 이벤트만 (등록 최초 건은 null) */
  previousPrice?: number | null;
  source: InventoryPriceHistorySource;
  reason?: string;
}

export interface InventoryProduct extends ProductChangeTags {
  id: string;
  sku: string;
  name: string;
  productKind: InventoryProductKind;
  category?: string;
  imageUrl?: string; // data URL (퍼블)
  memo?: string;
  active: boolean;

  stock: number; // 현재 재고
  safetyStock: number; // 안전재고
  currentPrice: number; // 현재 판매가
  /** 직전 판매가 (BE §15) */
  previousPrice?: number | null;
  priceAmendedAtIso?: string | null;

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

