export type ProductHistoryKind = "purchase" | "sale";

export interface ProductHistoryEntry {
  id: string;
  productId: string;
  sku: string;
  kind: ProductHistoryKind;
  date: string;
  quantity: number;
  amount: number;
}
