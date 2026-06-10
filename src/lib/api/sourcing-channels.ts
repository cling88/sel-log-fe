import { ApiError, apiFetch, type ApiEnvelope } from "@/lib/api-client";
import { SOURCING_PAGE_SIZE } from "@/lib/sourcing-url";
import type {
  CreateSourcingChannelBody,
  SourcingChannel,
} from "@/types/sourcing";

export type SourcingListMeta = {
  page: number;
  limit: number;
  total: number;
};

export type SourcingChannelsListResult = {
  items: SourcingChannel[];
  meta: SourcingListMeta;
};

export const SOURCING_CHANNELS_PICKER_LIMIT = 100;

function trimString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalUrl(value: unknown): string | null {
  const trimmed = trimString(value);
  return trimmed || null;
}

export function normalizeSourcingChannel(raw: unknown): SourcingChannel {
  const row = (raw ?? {}) as Record<string, unknown>;
  const productCount =
    typeof row.productCount === "number" ? row.productCount : undefined;

  return {
    id: String(row.id ?? ""),
    name: trimString(row.name),
    url: optionalUrl(row.url),
    memo: trimString(row.memo),
    ...(productCount !== undefined ? { productCount } : {}),
    createdAtIso: String(row.createdAtIso ?? ""),
    updatedAtIso: String(row.updatedAtIso ?? ""),
  };
}

function normalizeListMeta(
  meta: Partial<SourcingListMeta> | undefined,
  itemsLength: number,
  params?: { page?: number; limit?: number },
): SourcingListMeta {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? SOURCING_PAGE_SIZE;
  return {
    page: typeof meta?.page === "number" && meta.page > 0 ? meta.page : page,
    limit: typeof meta?.limit === "number" && meta.limit > 0 ? meta.limit : limit,
    total: typeof meta?.total === "number" ? meta.total : itemsLength,
  };
}

export function isDuplicateSourcingChannelError(error: unknown): boolean {
  return (
    error instanceof ApiError && error.code === "DUPLICATE_SOURCING_CHANNEL"
  );
}

export function getSourcingChannelErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "소싱 채널 요청에 실패했습니다.";
}

function buildChannelBody(body: CreateSourcingChannelBody) {
  return {
    name: body.name.trim(),
    url: body.url?.trim() ?? "",
    memo: body.memo?.trim() ?? "",
  };
}

/** GET /sourcing/channels */
export async function fetchSourcingChannels(params?: {
  q?: string;
  page?: number;
  limit?: number;
}): Promise<SourcingChannelsListResult> {
  const searchParams = new URLSearchParams();
  const q = params?.q?.trim();
  if (q) searchParams.set("q", q);
  const page = params?.page ?? 1;
  const limit = params?.limit ?? SOURCING_PAGE_SIZE;
  searchParams.set("page", String(page));
  searchParams.set("limit", String(limit));

  const res = await apiFetch<
    ApiEnvelope<unknown[]> & { meta?: Partial<SourcingListMeta> }
  >(`/sourcing/channels?${searchParams.toString()}`);

  const items = (res.data ?? []).map((item) => normalizeSourcingChannel(item));
  return {
    items,
    meta: normalizeListMeta(res.meta, items.length, { page, limit }),
  };
}

/** POST /sourcing/channels */
export async function createSourcingChannel(
  body: CreateSourcingChannelBody,
): Promise<SourcingChannel> {
  const res = await apiFetch<ApiEnvelope<unknown>>("/sourcing/channels", {
    method: "POST",
    body: JSON.stringify(buildChannelBody(body)),
  });
  return normalizeSourcingChannel(res.data);
}

/** PATCH /sourcing/channels/:id */
export async function updateSourcingChannel(
  id: string,
  body: CreateSourcingChannelBody,
): Promise<SourcingChannel> {
  const res = await apiFetch<ApiEnvelope<unknown>>(`/sourcing/channels/${id}`, {
    method: "PATCH",
    body: JSON.stringify(buildChannelBody(body)),
  });
  return normalizeSourcingChannel(res.data);
}

/** DELETE /sourcing/channels/:id */
export async function deleteSourcingChannel(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok?: boolean }>>(`/sourcing/channels/${id}`, {
    method: "DELETE",
  });
}
