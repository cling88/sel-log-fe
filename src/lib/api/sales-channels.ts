import { ApiError, apiFetch, type ApiEnvelope } from "@/lib/api-client";
import type { SalesChannel, SalesChannelInput } from "@/types/sale-channel";

export function getSalesChannelErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "판매채널 요청에 실패했습니다.";
}

/** GET /api/v1/sales-channels — soft delete 제외 */
export async function fetchSalesChannels(): Promise<SalesChannel[]> {
  const res = await apiFetch<ApiEnvelope<SalesChannel[]>>("/sales-channels");
  return res.data ?? [];
}

/** POST /api/v1/sales-channels */
export async function createSalesChannel(
  body: SalesChannelInput,
): Promise<SalesChannel> {
  const res = await apiFetch<ApiEnvelope<SalesChannel>>("/sales-channels", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return res.data;
}

/** PATCH /api/v1/sales-channels/:id */
export async function updateSalesChannel(
  id: string,
  body: SalesChannelInput,
): Promise<SalesChannel> {
  const res = await apiFetch<ApiEnvelope<SalesChannel>>(`/sales-channels/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return res.data;
}

/** DELETE /api/v1/sales-channels/:id — soft delete */
export async function deleteSalesChannel(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok?: boolean }>>(`/sales-channels/${id}`, {
    method: "DELETE",
  });
}
