import { ApiError, apiFetch, type ApiEnvelope } from "@/lib/api-client";
import {
  DEFAULT_PLATFORM_FEE_RATE,
  type SalesChannel,
  type SalesChannelInput,
} from "@/types/sale-channel";

export function getSalesChannelErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "판매채널 요청에 실패했습니다.";
}

function normalizeOptionalString(value: unknown): string {
  if (typeof value === "string") return value.trim();
  return "";
}

function normalizeNullableString(value: unknown): string | null {
  const trimmed = normalizeOptionalString(value);
  return trimmed || null;
}

function normalizePlatformFeeRate(value: unknown): number {
  const n = Number(value);
  if (Number.isFinite(n) && n >= 0) return n;
  return DEFAULT_PLATFORM_FEE_RATE;
}

export function normalizeSalesChannel(raw: unknown): SalesChannel {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(row.id ?? ""),
    name: normalizeOptionalString(row.name),
    platformFeeRate: normalizePlatformFeeRate(row.platformFeeRate),
    storeName: normalizeNullableString(row.storeName),
    storeUrl: normalizeNullableString(row.storeUrl),
    createdAtIso: String(row.createdAtIso ?? new Date().toISOString()),
    updatedAtIso: String(row.updatedAtIso ?? new Date().toISOString()),
  };
}

export function toSalesChannelPayload(body: SalesChannelInput): SalesChannelInput {
  const storeName = body.storeName?.trim() ?? "";
  const storeUrl = body.storeUrl?.trim() ?? "";
  return {
    name: body.name.trim(),
    platformFeeRate: body.platformFeeRate,
    storeName: storeName || null,
    storeUrl: storeUrl || null,
  };
}

/** GET /api/v1/sales-channels — soft delete 제외 */
export async function fetchSalesChannels(): Promise<SalesChannel[]> {
  const res = await apiFetch<ApiEnvelope<unknown[]>>("/sales-channels");
  return (res.data ?? []).map(normalizeSalesChannel);
}

/** POST /api/v1/sales-channels */
export async function createSalesChannel(
  body: SalesChannelInput,
): Promise<SalesChannel> {
  const res = await apiFetch<ApiEnvelope<unknown>>("/sales-channels", {
    method: "POST",
    body: JSON.stringify(toSalesChannelPayload(body)),
  });
  return normalizeSalesChannel(res.data);
}

/** PATCH /api/v1/sales-channels/:id */
export async function updateSalesChannel(
  id: string,
  body: SalesChannelInput,
): Promise<SalesChannel> {
  const res = await apiFetch<ApiEnvelope<unknown>>(`/sales-channels/${id}`, {
    method: "PATCH",
    body: JSON.stringify(toSalesChannelPayload(body)),
  });
  return normalizeSalesChannel(res.data);
}

/** DELETE /api/v1/sales-channels/:id — soft delete */
export async function deleteSalesChannel(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok?: boolean }>>(`/sales-channels/${id}`, {
    method: "DELETE",
  });
}
