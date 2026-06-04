import { ApiError, apiFetch, type ApiEnvelope } from "@/lib/api-client";
import type { QueryClient } from "@tanstack/react-query";
import { buildUnifiedHistory } from "@/lib/product-unified-history";
import type { UnifiedHistoryEntry } from "@/lib/product-unified-history";
import type {
  InventoryPriceHistoryItem,
  InventoryProduct,
  InventoryProductInput,
  InventoryProductStockAction,
  InventoryStockHistoryItem,
  InventoryStockHistorySource,
  ProductChangeFrom,
  ProductChangeKind,
  ProductChangeTags,
} from "@/types/inventory-product";

export type ProductsListMeta = {
  total: number;
  page: number;
  limit: number;
};

export type ProductsListResult = {
  items: InventoryProduct[];
  meta: ProductsListMeta;
};

const DEFAULT_LIST_PAGE = 1;

/** 상품 목록 페이지 크기 (BE limit 상한 100 이내) */
export const PRODUCTS_LIST_PAGE_SIZE = 15;

/** 상품 히스토리(통합 목록) 페이지 크기 */
export const PRODUCT_HISTORY_PAGE_SIZE = 20;

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value.trim();
  return undefined;
}

/** BE reason: string | null | {} 등 */
function normalizeOptionalReason(value: unknown): string | undefined {
  const asString = normalizeOptionalString(value);
  if (asString) return asString;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    return (
      normalizeOptionalString(obj.text) ??
      normalizeOptionalString(obj.message) ??
      normalizeOptionalString(obj.reason)
    );
  }
  return undefined;
}

function normalizeListMeta(
  meta: Partial<ProductsListMeta> | undefined,
  itemsLength: number,
  params?: { page?: number; limit?: number },
): ProductsListMeta {
  const requestedPage = params?.page ?? DEFAULT_LIST_PAGE;
  const requestedLimit = params?.limit ?? PRODUCT_HISTORY_PAGE_SIZE;
  const limit =
    typeof meta?.limit === "number" && meta.limit > 0
      ? meta.limit
      : requestedLimit;
  const page =
    typeof meta?.page === "number" && meta.page > 0
      ? meta.page
      : requestedPage;
  const total =
    typeof meta?.total === "number" && meta.total > 0
      ? meta.total
      : itemsLength;
  return { total, page, limit };
}

function normalizeOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return undefined;
}

function normalizeImageUrl(value: unknown): string | undefined {
  return normalizeOptionalString(value);
}

function normalizeChangeKind(value: unknown): ProductChangeKind | undefined {
  if (value === "price" || value === "stock") return value;
  return undefined;
}

function normalizeChangeFrom(value: unknown): ProductChangeFrom | undefined {
  if (value === "edit" || value === "stock_adjust") return value;
  return undefined;
}

/** changeKind·changeFrom 둘 다 있을 때만 포함 */
function normalizeChangeTags(
  raw: Record<string, unknown>,
): ProductChangeTags {
  const changeKind = normalizeChangeKind(raw.changeKind);
  const changeFrom = normalizeChangeFrom(raw.changeFrom);
  if (changeKind && changeFrom) return { changeKind, changeFrom };
  return {};
}

function normalizeStockHistorySource(
  value: unknown,
): InventoryStockHistorySource | undefined {
  if (value === "purchase" || value === "sale" || value === "manual_adjust") {
    return value;
  }
  return undefined;
}

function normalizeStockHistoryItem(
  raw: Partial<InventoryStockHistoryItem> & Record<string, unknown>,
): InventoryStockHistoryItem {
  return {
    ...normalizeChangeTags(raw),
    id: String(raw.id ?? ""),
    atIso: String(raw.atIso ?? ""),
    delta: Number(raw.delta) || 0,
    source: normalizeStockHistorySource(raw.source),
    vendor: normalizeOptionalString(raw.vendor),
    orderNo: normalizeOptionalString(raw.orderNo),
    unitPrice: normalizeOptionalNumber(raw.unitPrice),
    totalAmount: normalizeOptionalNumber(raw.totalAmount),
    reason: normalizeOptionalReason(raw.reason),
  };
}

function normalizePriceHistoryItem(
  raw: Partial<InventoryPriceHistoryItem> & Record<string, unknown>,
): InventoryPriceHistoryItem {
  const source = raw.source;
  const validSource =
    source === "product_register" ||
    source === "manual_edit" ||
    source === "purchase"
      ? source
      : "manual_edit";

  return {
    ...normalizeChangeTags(raw),
    id: String(raw.id ?? ""),
    atIso: String(raw.atIso ?? ""),
    price: Number(raw.price) || 0,
    source: validSource,
    reason: normalizeOptionalReason(raw.reason),
  };
}

function normalizeStockHistory(
  items: unknown,
): InventoryStockHistoryItem[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) =>
    normalizeStockHistoryItem(
      (item ?? {}) as Partial<InventoryStockHistoryItem> & Record<string, unknown>,
    ),
  );
}

function normalizePriceHistory(items: unknown): InventoryPriceHistoryItem[] {
  if (!Array.isArray(items)) return [];
  return items.map((item) =>
    normalizePriceHistoryItem(
      (item ?? {}) as Partial<InventoryPriceHistoryItem> & Record<string, unknown>,
    ),
  );
}

/** `{ data: Product }` 응답에서 상품 추출 */
export function parseProductEnvelope(
  body: ApiEnvelope<Record<string, unknown>>,
): InventoryProduct {
  const raw = body.data;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new ApiError(500, "서버에서 상품 정보를 받지 못했습니다.");
  }
  const product = normalizeProduct(raw);
  if (!product.id) {
    throw new ApiError(500, "서버에서 상품 정보를 받지 못했습니다.");
  }
  return product;
}

/** 단건 응답(재고조정·수정 등)을 상세 캐시와 병합 — 상세는 기본정보만, 이력은 별도 API */
export function mergeProductWithCachedDetail(
  _prev: InventoryProduct | undefined,
  next: InventoryProduct,
): InventoryProduct {
  return {
    ...next,
    stockHistory: [],
    priceHistory: [],
  };
}

const PRODUCTS_LIST_KEY_SEGMENT = "list" as const;

/** 목록 쿼리 캐시에 응답 상품(재고 등) 반영 */
export function applyProductToListCaches(
  queryClient: QueryClient,
  productsQueryKey: readonly unknown[],
  updated: InventoryProduct,
) {
  queryClient.setQueriesData(
    {
      queryKey: productsQueryKey,
      predicate: (query) => query.queryKey[1] === PRODUCTS_LIST_KEY_SEGMENT,
    },
    (old: ProductsListResult | undefined) => {
      if (!old?.items?.some((p) => p.id === updated.id)) return old;
      const { changeKind: _k, changeFrom: _f, ...listPatch } = updated;
      return {
        ...old,
        items: old.items.map((p) =>
          p.id === updated.id ? { ...p, ...listPatch } : p,
        ),
      };
    },
  );
}

/** BE 응답 → FE InventoryProduct */
export function normalizeProduct(raw: Record<string, unknown>): InventoryProduct {
  const category = normalizeOptionalString(raw.category);

  return {
    ...normalizeChangeTags(raw),
    id: String(raw.id ?? ""),
    sku: String(raw.sku ?? ""),
    name: String(raw.name ?? ""),
    ...(category ? { category } : {}),
    imageUrl: normalizeImageUrl(raw.imageUrl),
    memo: normalizeOptionalString(raw.memo) ?? "",
    active: raw.active !== false,
    stock: Number(raw.stock) || 0,
    safetyStock: Number(raw.safetyStock) || 0,
    currentPrice: Number(raw.currentPrice) || 0,
    createdAtIso: String(raw.createdAtIso ?? new Date().toISOString()),
    updatedAtIso: String(raw.updatedAtIso ?? new Date().toISOString()),
    deletedAtIso: normalizeOptionalString(raw.deletedAtIso),
    stockHistory: normalizeStockHistory(raw.stockHistory),
    priceHistory: normalizePriceHistory(raw.priceHistory),
  };
}

export function toCreateProductPayload(input: InventoryProductInput) {
  const imageUrl = input.imageUrl?.trim();
  const category = input.category?.trim();

  return {
    sku: input.sku.trim(),
    name: input.name.trim(),
    ...(category ? { category } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    memo: input.memo?.trim() ?? "",
    active: input.active,
    stock: Math.max(0, Number(input.stock) || 0),
    safetyStock: Math.max(0, Number(input.safetyStock) || 0),
    currentPrice: Math.max(0, Number(input.currentPrice) || 0),
  };
}

export type FetchProductsParams = {
  q?: string;
  active?: boolean;
  page?: number;
  limit?: number;
};

/** GET /api/v1/products */
export async function fetchProducts(
  params?: FetchProductsParams,
): Promise<ProductsListResult> {
  const search = new URLSearchParams();
  if (params?.q?.trim()) search.set("q", params.q.trim());
  if (params?.active !== undefined) search.set("active", String(params.active));
  search.set("page", String(params?.page ?? DEFAULT_LIST_PAGE));
  search.set("limit", String(params?.limit ?? PRODUCTS_LIST_PAGE_SIZE));

  const path = `/products?${search.toString()}`;

  const res = await apiFetch<
    ApiEnvelope<Record<string, unknown>[]> & { meta?: Partial<ProductsListMeta> }
  >(path);

  const items = (res.data ?? []).map((item) => normalizeProduct(item));

  return {
    items,
    meta: normalizeListMeta(res.meta, items.length, params),
  };
}

/** GET /api/v1/products/:id — 기본 정보만 (이력은 stock-history / price-history) */
export async function fetchProduct(id: string): Promise<InventoryProduct> {
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>(`/products/${id}`);
  return normalizeProduct(res.data ?? {});
}

export type ProductHistoryListParams = {
  page?: number;
  limit?: number;
  /** 이력 발생월(created_at) YYYY-MM, 미지정 시 전체 */
  date?: string;
};

export type ProductHistoryListResult<T> = {
  items: T[];
  meta: ProductsListMeta;
};

async function fetchHistoryListPage<T>(
  path: string,
  normalizeItem: (raw: Record<string, unknown>) => T,
  params?: ProductHistoryListParams,
): Promise<ProductHistoryListResult<T>> {
  const search = new URLSearchParams();
  search.set("page", String(params?.page ?? DEFAULT_LIST_PAGE));
  search.set("limit", String(params?.limit ?? PRODUCT_HISTORY_PAGE_SIZE));
  if (params?.date) search.set("date", params.date);

  const res = await apiFetch<
    ApiEnvelope<Record<string, unknown>[]> & { meta?: Partial<ProductsListMeta> }
  >(`${path}?${search.toString()}`);

  const items = (res.data ?? []).map((item) =>
    normalizeItem((item ?? {}) as Record<string, unknown>),
  );

  return {
    items,
    meta: normalizeListMeta(res.meta, items.length, params),
  };
}

/** GET /api/v1/products/:id/stock-history */
export function fetchProductStockHistory(
  productId: string,
  params?: ProductHistoryListParams,
): Promise<ProductHistoryListResult<InventoryStockHistoryItem>> {
  return fetchHistoryListPage(
    `/products/${productId}/stock-history`,
    normalizeStockHistoryItem,
    params,
  );
}

/** GET /api/v1/products/:id/price-history */
export function fetchProductPriceHistory(
  productId: string,
  params?: ProductHistoryListParams,
): Promise<ProductHistoryListResult<InventoryPriceHistoryItem>> {
  return fetchHistoryListPage(
    `/products/${productId}/price-history`,
    normalizePriceHistoryItem,
    params,
  );
}

export type ProductHistoryTimelineResult = {
  entries: UnifiedHistoryEntry[];
  meta: ProductsListMeta;
};

/**
 * 재고·가격 이력 통합 타임라인.
 * API: page, limit, date=YYYY-MM(이력 발생월). 호출 2회(stock + price), limit=20.
 */
export async function fetchProductHistoryTimeline(
  productId: string,
  params: {
    month: string;
    page: number;
    limit?: number;
    currentStock: number;
  },
): Promise<ProductHistoryTimelineResult> {
  const limit = params.limit ?? PRODUCT_HISTORY_PAGE_SIZE;
  const page = Math.max(1, params.page);

  const listParams: ProductHistoryListParams = {
    page,
    limit,
    date: params.month,
  };

  const [stockRes, priceRes] = await Promise.all([
    fetchProductStockHistory(productId, listParams),
    fetchProductPriceHistory(productId, listParams),
  ]);

  const unified = buildUnifiedHistory(
    params.currentStock,
    stockRes.items,
    priceRes.items,
  );

  const combinedTotal = stockRes.meta.total + priceRes.meta.total;

  return {
    entries: unified.slice(0, limit),
    meta: {
      total: combinedTotal > 0 ? combinedTotal : unified.length,
      page,
      limit,
    },
  };
}

/** POST /api/v1/products */
export async function createProduct(
  input: InventoryProductInput,
): Promise<InventoryProduct> {
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>("/products", {
    method: "POST",
    body: JSON.stringify(toCreateProductPayload(input)),
  });
  return parseProductEnvelope(res);
}

/** PATCH /api/v1/products/:id — SKU 수정 불가 */
export function toUpdateProductPayload(input: InventoryProductInput) {
  const category = input.category?.trim();
  const imageUrl = input.imageUrl?.trim();

  return {
    name: input.name.trim(),
    ...(category ? { category } : {}),
    ...(imageUrl ? { imageUrl } : {}),
    memo: input.memo?.trim() ?? "",
    active: input.active,
    safetyStock: Math.max(0, Number(input.safetyStock) || 0),
    currentPrice: Math.max(0, Number(input.currentPrice) || 0),
  };
}

export async function updateProduct(
  id: string,
  input: InventoryProductInput,
): Promise<InventoryProduct> {
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>(
    `/products/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(toUpdateProductPayload(input)),
    },
  );
  return parseProductEnvelope(res);
}

/** DELETE /api/v1/products/:id — soft delete, 재고 0만 가능 */
export async function deleteProduct(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<unknown>>(`/products/${id}`, {
    method: "DELETE",
  });
}

export type StockAdjustRequest = {
  action: InventoryProductStockAction;
  quantity: number;
  reason?: string;
};

/** POST /api/v1/products/:id/stock-adjust */
export async function adjustProductStock(
  id: string,
  body: StockAdjustRequest,
): Promise<InventoryProduct> {
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>(
    `/products/${id}/stock-adjust`,
    {
      method: "POST",
      body: JSON.stringify({
        action: body.action,
        quantity: Math.max(1, Math.floor(body.quantity)),
        ...(body.reason?.trim() ? { reason: body.reason.trim() } : {}),
      }),
    },
  );
  return parseProductEnvelope(res);
}
