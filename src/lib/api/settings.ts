import { ApiError, apiFetch, type ApiEnvelope } from "@/lib/api-client";
import {
  DEFAULT_USER_SETTINGS,
  type UserSettings,
  type UserSettingsInput,
} from "@/types/settings";

export function getSettingsErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "설정 요청에 실패했습니다.";
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
