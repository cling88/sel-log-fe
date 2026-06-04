import { apiFetch, type ApiEnvelope } from "@/lib/api-client";
import type { InventoryCategory } from "@/types/inventory-category";

/** GET /api/v1/categories — soft delete 제외 */
export async function fetchCategories(): Promise<InventoryCategory[]> {
  const res = await apiFetch<ApiEnvelope<InventoryCategory[]>>("/categories");
  return res.data ?? [];
}

/** POST /api/v1/categories */
export async function createCategory(name: string): Promise<InventoryCategory> {
  const res = await apiFetch<ApiEnvelope<InventoryCategory>>("/categories", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return res.data;
}

/** PATCH /api/v1/categories/{id} */
export async function updateCategory(
  id: string,
  name: string,
): Promise<InventoryCategory> {
  const res = await apiFetch<ApiEnvelope<InventoryCategory>>(`/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
  return res.data;
}

/** DELETE /api/v1/categories/{id} — soft delete */
export async function deleteCategory(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok: boolean }>>(`/categories/${id}`, {
    method: "DELETE",
  });
}
