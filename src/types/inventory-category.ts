export interface InventoryCategory {
  id: string;
  name: string;
  createdAtIso: string;
  updatedAtIso: string;
  deletedAtIso?: string;
}

export type InventoryCategoryInput = Omit<
  InventoryCategory,
  "id" | "createdAtIso" | "updatedAtIso" | "deletedAtIso"
>;

