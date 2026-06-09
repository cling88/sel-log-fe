import { ApiError, apiFetch, type ApiEnvelope } from "@/lib/api-client";
import type { Vendor, VendorInput } from "@/types/vendor";

function trimString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeVendor(raw: unknown): Vendor {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(row.id ?? ""),
    name: trimString(row.name),
    link: trimString(row.link),
    createdAtIso: String(row.createdAtIso ?? ""),
    updatedAtIso: String(row.updatedAtIso ?? ""),
  };
}

export function getVendorErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "구매처 요청에 실패했습니다.";
}

/** GET /api/v1/vendors — soft delete 제외 */
export async function fetchVendors(): Promise<Vendor[]> {
  const res = await apiFetch<ApiEnvelope<unknown[]>>("/vendors");
  return (res.data ?? []).map((item) => normalizeVendor(item));
}

/** POST /api/v1/vendors */
export async function createVendor(body: VendorInput): Promise<Vendor> {
  const res = await apiFetch<ApiEnvelope<unknown>>("/vendors", {
    method: "POST",
    body: JSON.stringify({
      name: body.name.trim(),
      link: body.link?.trim() ?? "",
    }),
  });
  return normalizeVendor(res.data);
}

/** PATCH /api/v1/vendors/:id */
export async function updateVendor(
  id: string,
  body: VendorInput,
): Promise<Vendor> {
  const res = await apiFetch<ApiEnvelope<unknown>>(`/vendors/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      name: body.name.trim(),
      link: body.link?.trim() ?? "",
    }),
  });
  return normalizeVendor(res.data);
}

/** DELETE /api/v1/vendors/:id — soft delete */
export async function deleteVendor(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok?: boolean }>>(`/vendors/${id}`, {
    method: "DELETE",
  });
}
