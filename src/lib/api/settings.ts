import { ApiError, apiFetch, type ApiEnvelope } from "@/lib/api-client";
import {
  DEFAULT_USER_SETTINGS,
  EMPTY_TRASH_SUMMARY,
  type PurgeTrashBody,
  type PurgeUnusedImagesResult,
  type TrashSummary,
  type UnusedImagesCount,
  type UserSettings,
  type UserSettingsInput,
} from "@/types/settings";

export function getSettingsErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "설정 요청에 실패했습니다.";
}

export function isR2NotConfiguredError(error: unknown): boolean {
  return error instanceof ApiError && error.code === "R2_NOT_CONFIGURED";
}

export function getUnusedImagesErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "미사용 이미지 요청에 실패했습니다.";
}

export function getTrashErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "레거시 데이터 요청에 실패했습니다.";
}

function normalizeCount(raw: unknown): number {
  const count = Number(raw);
  if (!Number.isFinite(count)) return 0;
  return Math.max(0, Math.floor(count));
}

export function normalizeTrashSummary(raw: unknown): TrashSummary {
  const row = (raw ?? {}) as Record<string, unknown>;
  const summary: TrashSummary = {
    products: normalizeCount(row.products),
    sourcingChannels: normalizeCount(row.sourcingChannels),
    sourcingProducts: normalizeCount(row.sourcingProducts),
    purchaseProducts: normalizeCount(row.purchaseProducts),
    purchaseSupply: normalizeCount(row.purchaseSupply),
    purchaseOther: normalizeCount(row.purchaseOther),
    saleOrders: normalizeCount(row.saleOrders),
    incomeLines: normalizeCount(row.incomeLines),
    total: normalizeCount(row.total),
  };
  if (summary.total === 0) {
    const sum =
      summary.products +
      summary.sourcingChannels +
      summary.sourcingProducts +
      summary.purchaseProducts +
      summary.purchaseSupply +
      summary.purchaseOther +
      summary.saleOrders +
      summary.incomeLines;
    if (sum > 0) summary.total = sum;
  }
  return summary;
}

function extractTrashSummary(
  res: ApiEnvelope<unknown> & { summary?: unknown },
): TrashSummary {
  const data = res.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const row = data as Record<string, unknown>;
    if (row.summary != null) {
      return normalizeTrashSummary(row.summary);
    }
  }
  if (res.summary != null) {
    return normalizeTrashSummary(res.summary);
  }
  return normalizeTrashSummary(data);
}

function normalizeNullableId(value: unknown): string | null {
  if (value == null || value === "") return null;
  const id = String(value).trim();
  return id || null;
}

export function normalizeUserSettings(raw: unknown): UserSettings {
  const row = (raw ?? {}) as Record<string, unknown>;
  const marginMinRate = Number(row.marginMinRate);
  const marginMaxRate = Number(row.marginMaxRate);
  const vatExtractRate = Number(row.vatExtractRate);
  const defaultPlatformFeeRate = Number(row.defaultPlatformFeeRate);

  return {
    marginMinRate: Number.isFinite(marginMinRate)
      ? marginMinRate
      : DEFAULT_USER_SETTINGS.marginMinRate,
    marginMaxRate: Number.isFinite(marginMaxRate)
      ? marginMaxRate
      : DEFAULT_USER_SETTINGS.marginMaxRate,
    vatExtractRate: Number.isFinite(vatExtractRate)
      ? vatExtractRate
      : DEFAULT_USER_SETTINGS.vatExtractRate,
    defaultPlatformFeeRate: Number.isFinite(defaultPlatformFeeRate)
      ? defaultPlatformFeeRate
      : DEFAULT_USER_SETTINGS.defaultPlatformFeeRate,
    defaultChannelId: normalizeNullableId(row.defaultChannelId),
  };
}

/** GET /api/v1/settings */
export async function fetchUserSettings(): Promise<UserSettings> {
  const res = await apiFetch<ApiEnvelope<unknown>>("/settings");
  return normalizeUserSettings(res.data);
}

/** PATCH /api/v1/settings */
export async function updateUserSettings(
  body: UserSettingsInput,
): Promise<UserSettings> {
  const res = await apiFetch<ApiEnvelope<unknown>>("/settings", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
  return normalizeUserSettings(res.data);
}

/** GET /api/v1/settings/unused-images */
export async function fetchUnusedImagesCount(): Promise<UnusedImagesCount> {
  const res = await apiFetch<ApiEnvelope<unknown>>("/settings/unused-images");
  const row = (res.data ?? {}) as Record<string, unknown>;
  return { count: normalizeCount(row.count) };
}

/** POST /api/v1/settings/unused-images/purge */
export async function purgeUnusedImages(): Promise<PurgeUnusedImagesResult> {
  const res = await apiFetch<ApiEnvelope<unknown>>(
    "/settings/unused-images/purge",
    { method: "POST" },
  );
  const row = (res.data ?? {}) as Record<string, unknown>;
  return { deletedCount: normalizeCount(row.deletedCount) };
}

/** GET /api/v1/settings/trash — summary.total 조회용 */
export async function fetchTrashSummary(): Promise<TrashSummary> {
  const res = await apiFetch<ApiEnvelope<unknown> & { summary?: unknown }>(
    "/settings/trash?page=1&limit=1",
  );
  return extractTrashSummary(res);
}

/** POST /api/v1/settings/trash/purge */
export async function purgeTrash(
  body: PurgeTrashBody = {},
): Promise<TrashSummary> {
  const res = await apiFetch<ApiEnvelope<unknown>>("/settings/trash/purge", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return normalizeTrashSummary(res.data);
}
