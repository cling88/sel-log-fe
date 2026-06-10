import { ApiError, apiFetch, type ApiEnvelope } from "@/lib/api-client";
import { SOURCING_PAGE_SIZE } from "@/lib/sourcing-url";
import type {
  CreateSourcingProductBody,
  SourcingChannelEmbed,
  SourcingProduct,
} from "@/types/sourcing";
import type { SourcingListMeta } from "@/lib/api/sourcing-channels";

export type SourcingProductsListResult = {
  items: SourcingProduct[];
  meta: SourcingListMeta;
};

function trimString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalUrl(value: unknown): string | null {
  const trimmed = trimString(value);
  return trimmed || null;
}

function normalizeChannelEmbed(raw: unknown): SourcingChannelEmbed | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  if (!row.id) return null;
  return {
    id: String(row.id),
    name: trimString(row.name),
    url: optionalUrl(row.url),
  };
}

export function normalizeSourcingProduct(raw: unknown): SourcingProduct {
  const row = (raw ?? {}) as Record<string, unknown>;
  const quantity =
    typeof row.quantity === "number" ? Math.floor(row.quantity) : 0;
  const unitPrice =
    typeof row.unitPrice === "number" ? Math.floor(row.unitPrice) : 0;
  const totalPrice =
    typeof row.totalPrice === "number"
      ? Math.floor(row.totalPrice)
      : quantity * unitPrice;

  return {
    id: String(row.id ?? ""),
    name: trimString(row.name),
    imageUrl: optionalUrl(row.imageUrl),
    productUrl: optionalUrl(row.productUrl),
    quantity,
    unitPrice,
    totalPrice,
    memo: trimString(row.memo),
    channelId: row.channelId ? String(row.channelId) : null,
    channel: normalizeChannelEmbed(row.channel),
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

export function getSourcingProductErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "제품소싱 요청에 실패했습니다.";
}

function buildProductBody(body: CreateSourcingProductBody) {
  const quantity =
    body.quantity != null ? Math.max(0, Math.floor(body.quantity)) : 0;
  const payload: Record<string, unknown> = {
    name: body.name.trim(),
    channelId: body.channelId ?? null,
    imageUrl: body.imageUrl?.trim() ?? "",
    productUrl: body.productUrl?.trim() ?? "",
    quantity,
    memo: body.memo?.trim() ?? "",
  };
  // 사용자 입력값 그대로 전달 — BE는 재계산 없이 각 필드 독립 저장
  if (typeof body.totalPrice === "number") {
    payload.totalPrice = Math.max(0, Math.floor(body.totalPrice));
  }
  if (typeof body.unitPrice === "number") {
    payload.unitPrice = Math.max(0, Math.floor(body.unitPrice));
  }
  return payload;
}

/** GET /sourcing/products */
export async function fetchSourcingProducts(params?: {
  q?: string;
  channelId?: string;
  page?: number;
  limit?: number;
}): Promise<SourcingProductsListResult> {
  const searchParams = new URLSearchParams();
  const q = params?.q?.trim();
  if (q) searchParams.set("q", q);
  if (params?.channelId) searchParams.set("channelId", params.channelId);
  const page = params?.page ?? 1;
  const limit = params?.limit ?? SOURCING_PAGE_SIZE;
  searchParams.set("page", String(page));
  searchParams.set("limit", String(limit));

  const res = await apiFetch<
    ApiEnvelope<unknown[]> & { meta?: Partial<SourcingListMeta> }
  >(`/sourcing/products?${searchParams.toString()}`);

  const items = (res.data ?? []).map((item) => normalizeSourcingProduct(item));
  return {
    items,
    meta: normalizeListMeta(res.meta, items.length, { page, limit }),
  };
}

/** POST /sourcing/products */
export async function createSourcingProduct(
  body: CreateSourcingProductBody,
): Promise<SourcingProduct> {
  const res = await apiFetch<ApiEnvelope<unknown>>("/sourcing/products", {
    method: "POST",
    body: JSON.stringify(buildProductBody(body)),
  });
  return normalizeSourcingProduct(res.data);
}

/** PATCH /sourcing/products/:id */
export async function updateSourcingProduct(
  id: string,
  body: CreateSourcingProductBody,
): Promise<SourcingProduct> {
  const res = await apiFetch<ApiEnvelope<unknown>>(`/sourcing/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(buildProductBody(body)),
  });
  return normalizeSourcingProduct(res.data);
}

/** DELETE /sourcing/products/:id */
export async function deleteSourcingProduct(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok?: boolean }>>(`/sourcing/products/${id}`, {
    method: "DELETE",
  });
}
