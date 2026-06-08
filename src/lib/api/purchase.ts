import { ApiError, apiFetch, type ApiEnvelope } from "@/lib/api-client";
import { createDefaultGroupMeta, type PurchaseGroupMeta } from "@/types/purchase-group";
import type { OtherExpenseLine } from "@/types/purchase-other";
import type { ProductPurchaseLine } from "@/types/purchase-product";
import type { SupplyExpenseLine } from "@/types/purchase-supply";
import type { InventoryProduct } from "@/types/inventory-product";
import { purchaseBankIdForApi } from "@/lib/purchase-bank-display";
import { normalizeProduct } from "@/lib/api/products";
import type { BankSummary } from "@/types/bank-account";

export type PurchaseListMeta = {
  total: number;
  page: number;
  limit: number;
};

export type PurchaseListParams = {
  q?: string;
  month?: string;
  page?: number;
  limit?: number;
};

const DEFAULT_PAGE = 1;
export const PURCHASE_API_GROUPS_PAGE_SIZE = 5;

function normalizeListMeta(
  meta: Partial<PurchaseListMeta> | undefined,
  itemsLength: number,
  params?: { page?: number; limit?: number },
): PurchaseListMeta {
  const requestedPage = params?.page ?? DEFAULT_PAGE;
  const requestedLimit = params?.limit ?? PURCHASE_API_GROUPS_PAGE_SIZE;
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

function buildListSearch(params?: PurchaseListParams): string {
  const search = new URLSearchParams();
  search.set("page", String(params?.page ?? DEFAULT_PAGE));
  search.set("limit", String(params?.limit ?? PURCHASE_API_GROUPS_PAGE_SIZE));
  if (params?.month) search.set("month", params.month);
  if (params?.q?.trim()) search.set("q", params.q.trim());
  return search.toString();
}

function normalizeOptionalString(value: unknown): string {
  if (typeof value === "string") return value;
  return "";
}

function normalizeGroupMeta(
  raw: Record<string, unknown> | null | undefined,
  fallbackIndex: number,
): PurchaseGroupMeta {
  if (!raw || typeof raw !== "object") {
    return createDefaultGroupMeta(fallbackIndex);
  }
  const extraFees = Array.isArray(raw.extraFees)
    ? raw.extraFees.map((item, i) => {
        const row = (item ?? {}) as Record<string, unknown>;
        return {
          id: String(row.id ?? `fee-${i}`),
          label: normalizeOptionalString(row.label),
          amount: Number(row.amount) || 0,
        };
      })
    : [];
  const discounts = Array.isArray(raw.discounts)
    ? raw.discounts.map((item, i) => {
        const row = (item ?? {}) as Record<string, unknown>;
        return {
          id: String(row.id ?? `disc-${i}`),
          label: normalizeOptionalString(row.label),
          amount: Number(row.amount) || 0,
        };
      })
    : [];
  return {
    groupName: normalizeOptionalString(raw.groupName) || createDefaultGroupMeta(fallbackIndex).groupName,
    extraFees,
    discounts,
    orderCancelled: raw.orderCancelled === true,
  };
}

function normalizeBankSummary(raw: unknown): BankSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = String(row.id ?? "").trim();
  if (!id) return null;
  return {
    id,
    bankName: normalizeOptionalString(row.bankName),
    accountNumber: normalizeOptionalString(row.accountNumber),
    accountHolder: normalizeOptionalString(row.accountHolder),
  };
}

function normalizeBankId(raw: Record<string, unknown>): string | null {
  const value = raw.bankId;
  if (value == null || value === "") return null;
  return String(value);
}

function normalizePurchaseLineBankFields(raw: Record<string, unknown>) {
  return {
    bankId: normalizeBankId(raw),
    bank: normalizeBankSummary(raw.bank),
  };
}

function normalizeProductPurchaseLine(raw: Record<string, unknown>): ProductPurchaseLine {
  const sku = raw.productSku;
  return {
    id: String(raw.id ?? ""),
    paymentDate: String(raw.paymentDate ?? ""),
    orderNo: normalizeOptionalString(raw.orderNo),
    imageUrl: normalizeOptionalString(raw.imageUrl),
    productName: normalizeOptionalString(raw.productName),
    productLink: normalizeOptionalString(raw.productLink),
    vendor: normalizeOptionalString(raw.vendor),
    quantity: Number(raw.quantity) || 0,
    paymentAmount: Number(raw.paymentAmount) || 0,
    memo: normalizeOptionalString(raw.memo),
    stockReflected: raw.stockReflected === true,
    ...normalizePurchaseLineBankFields(raw),
    ...(typeof sku === "string" && sku ? { productSku: sku } : {}),
  };
}

function normalizeSupplyLine(raw: Record<string, unknown>): SupplyExpenseLine {
  const sku = raw.productSku;
  return {
    id: String(raw.id ?? ""),
    paymentDate: String(raw.paymentDate ?? ""),
    itemName: normalizeOptionalString(raw.itemName),
    vendor: normalizeOptionalString(raw.vendor),
    quantity: Number(raw.quantity) || 0,
    paymentAmount: Number(raw.paymentAmount) || 0,
    memo: normalizeOptionalString(raw.memo),
    stockReflected: raw.stockReflected === true,
    ...normalizePurchaseLineBankFields(raw),
    ...(typeof sku === "string" && sku ? { productSku: sku } : {}),
  };
}

function normalizeOtherLine(raw: Record<string, unknown>): OtherExpenseLine {
  return {
    id: String(raw.id ?? ""),
    paymentDate: String(raw.paymentDate ?? ""),
    itemName: normalizeOptionalString(raw.itemName),
    paymentAmount: Number(raw.paymentAmount) || 0,
    memo: normalizeOptionalString(raw.memo),
    ...normalizePurchaseLineBankFields(raw),
  };
}

export type ProductPurchaseGroupRow = {
  paymentDate: string;
  lines: ProductPurchaseLine[];
};

export type ProductPurchaseListResult = {
  groups: ProductPurchaseGroupRow[];
  groupMeta: Record<string, PurchaseGroupMeta>;
  lines: ProductPurchaseLine[];
  meta: PurchaseListMeta;
};

function mapProductPurchaseGroups(
  data: Record<string, unknown>[],
): Omit<ProductPurchaseListResult, "meta"> {
  const groups: ProductPurchaseGroupRow[] = [];
  const groupMeta: Record<string, PurchaseGroupMeta> = {};
  const lines: ProductPurchaseLine[] = [];

  data.forEach((row, index) => {
    const paymentDate = String(row.paymentDate ?? "");
    const rawLines = Array.isArray(row.lines) ? row.lines : [];
    const normalizedLines = rawLines.map((item) =>
      normalizeProductPurchaseLine((item ?? {}) as Record<string, unknown>),
    );
    groups.push({ paymentDate, lines: normalizedLines });
    groupMeta[paymentDate] = normalizeGroupMeta(
      row.groupMeta as Record<string, unknown> | undefined,
      index,
    );
    lines.push(...normalizedLines);
  });

  return { groups, groupMeta, lines };
}

/** GET /purchase/products */
export async function fetchProductPurchaseList(
  params?: PurchaseListParams,
): Promise<ProductPurchaseListResult> {
  const res = await apiFetch<
    ApiEnvelope<Record<string, unknown>[]> & { meta?: Partial<PurchaseListMeta> }
  >(`/purchase/products?${buildListSearch(params)}`);

  const data = (res.data ?? []) as Record<string, unknown>[];
  const mapped = mapProductPurchaseGroups(data);

  return {
    ...mapped,
    meta: normalizeListMeta(res.meta, data.length, params),
  };
}

export type ProductPurchaseLinePayload = {
  paymentDate: string;
  productName: string;
  vendor: string;
  quantity: number;
  paymentAmount: number;
  orderNo?: string;
  imageUrl?: string;
  productLink?: string;
  memo?: string;
  bankId?: string | null;
};

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function toProductPurchaseLinePayload(
  line: Omit<ProductPurchaseLine, "id" | "stockReflected">,
): ProductPurchaseLinePayload {
  const orderNo = line.orderNo?.trim();
  const imageUrl = line.imageUrl?.trim();
  const productLink = line.productLink?.trim();
  const memo = line.memo?.trim();

  return {
    paymentDate: line.paymentDate,
    productName: line.productName.trim(),
    vendor: line.vendor.trim(),
    quantity: Math.trunc(line.quantity),
    paymentAmount: Math.trunc(line.paymentAmount),
    ...(orderNo ? { orderNo } : {}),
    ...(imageUrl && isHttpUrl(imageUrl) ? { imageUrl } : {}),
    ...(productLink && isHttpUrl(productLink) ? { productLink } : {}),
    ...(memo ? { memo } : {}),
    bankId: purchaseBankIdForApi(line.bankId),
  };
}

/** POST /purchase/products */
export async function createProductPurchaseLine(
  body: ProductPurchaseLinePayload,
): Promise<ProductPurchaseLine> {
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>(
    "/purchase/products",
    { method: "POST", body: JSON.stringify(body) },
  );
  return normalizeProductPurchaseLine(res.data ?? {});
}

/** PATCH /purchase/products/:id */
export async function updateProductPurchaseLine(
  id: string,
  body: ProductPurchaseLinePayload,
): Promise<ProductPurchaseLine> {
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>(
    `/purchase/products/${id}`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
  return normalizeProductPurchaseLine(res.data ?? {});
}

/** DELETE /purchase/products/:id */
export async function deleteProductPurchaseLine(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok?: boolean }>>(`/purchase/products/${id}`, {
    method: "DELETE",
  });
}

export type StockReflectPayload = {
  productSku: string;
  qty: number;
};

export type StockReflectResult = {
  line: ProductPurchaseLine;
  product: InventoryProduct;
};

function parseStockReflectResult(data: Record<string, unknown>): StockReflectResult {
  const lineRaw = data.line ?? data;
  const productRaw = data.product;
  return {
    line: normalizeProductPurchaseLine(
      (lineRaw ?? {}) as Record<string, unknown>,
    ),
    product: normalizeProduct(
      (productRaw ?? {}) as Record<string, unknown>,
    ),
  };
}

/** POST /purchase/products/:id/stock-reflect */
export async function reflectProductPurchaseStock(
  id: string,
  body: StockReflectPayload,
): Promise<StockReflectResult> {
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>(
    `/purchase/products/${id}/stock-reflect`,
    { method: "POST", body: JSON.stringify(body) },
  );
  return parseStockReflectResult(res.data ?? {});
}

/** DELETE /purchase/products/:id/stock-reflect */
export async function cancelProductPurchaseStockReflect(
  id: string,
): Promise<StockReflectResult> {
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>(
    `/purchase/products/${id}/stock-reflect`,
    { method: "DELETE" },
  );
  return parseStockReflectResult(res.data ?? {});
}

export type PatchPurchaseGroupBody = {
  paymentDate: string;
  groupName?: string;
  extraFees?: { id?: string; label: string; amount: number }[];
  discounts?: { id?: string; label: string; amount: number }[];
};

/** PATCH /purchase/groups */
export async function patchPurchaseGroup(
  body: PatchPurchaseGroupBody,
): Promise<PurchaseGroupMeta> {
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>(
    "/purchase/groups",
    { method: "PATCH", body: JSON.stringify(body) },
  );
  return normalizeGroupMeta(res.data, 0);
}

/** PATCH /purchase/groups/cancel */
export async function patchPurchaseGroupCancel(
  paymentDate: string,
  orderCancelled: boolean,
): Promise<PurchaseGroupMeta> {
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>(
    "/purchase/groups/cancel",
    {
      method: "PATCH",
      body: JSON.stringify({ paymentDate, orderCancelled }),
    },
  );
  return normalizeGroupMeta(res.data, 0);
}

// —— Supply ——

export type SupplyGroupRow = {
  paymentDate: string;
  lines: SupplyExpenseLine[];
};

export type SupplyListResult = {
  groups: SupplyGroupRow[];
  lines: SupplyExpenseLine[];
  meta: PurchaseListMeta;
};

function mapSupplyGroups(data: Record<string, unknown>[]): Omit<SupplyListResult, "meta"> {
  const groups: SupplyGroupRow[] = [];
  const lines: SupplyExpenseLine[] = [];
  data.forEach((row) => {
    const paymentDate = String(row.paymentDate ?? "");
    const rawLines = Array.isArray(row.lines) ? row.lines : [];
    const normalizedLines = rawLines.map((item) =>
      normalizeSupplyLine((item ?? {}) as Record<string, unknown>),
    );
    groups.push({ paymentDate, lines: normalizedLines });
    lines.push(...normalizedLines);
  });
  return { groups, lines };
}

/** GET /purchase/supply */
export async function fetchSupplyExpenseList(
  params?: PurchaseListParams,
): Promise<SupplyListResult> {
  const res = await apiFetch<
    ApiEnvelope<Record<string, unknown>[]> & { meta?: Partial<PurchaseListMeta> }
  >(`/purchase/supply?${buildListSearch(params)}`);

  const data = (res.data ?? []) as Record<string, unknown>[];
  const mapped = mapSupplyGroups(data);

  return {
    ...mapped,
    meta: normalizeListMeta(res.meta, data.length, params),
  };
}

export type SupplyLinePayload = {
  paymentDate: string;
  itemName: string;
  quantity: number;
  paymentAmount: number;
  vendor?: string;
  memo?: string;
  bankId?: string | null;
};

export function toSupplyLinePayload(
  line: Omit<SupplyExpenseLine, "id" | "stockReflected">,
): SupplyLinePayload {
  return {
    paymentDate: line.paymentDate,
    itemName: line.itemName,
    quantity: line.quantity,
    paymentAmount: line.paymentAmount,
    ...(line.vendor ? { vendor: line.vendor } : {}),
    ...(line.memo ? { memo: line.memo } : {}),
    bankId: purchaseBankIdForApi(line.bankId),
  };
}

export async function createSupplyExpenseLine(
  body: SupplyLinePayload,
): Promise<SupplyExpenseLine> {
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>(
    "/purchase/supply",
    { method: "POST", body: JSON.stringify(body) },
  );
  return normalizeSupplyLine(res.data ?? {});
}

export async function updateSupplyExpenseLine(
  id: string,
  body: SupplyLinePayload,
): Promise<SupplyExpenseLine> {
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>(
    `/purchase/supply/${id}`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
  return normalizeSupplyLine(res.data ?? {});
}

export async function deleteSupplyExpenseLine(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok?: boolean }>>(`/purchase/supply/${id}`, {
    method: "DELETE",
  });
}

export async function reflectSupplyStock(
  id: string,
  body: StockReflectPayload,
): Promise<{ line: SupplyExpenseLine; product: InventoryProduct }> {
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>(
    `/purchase/supply/${id}/stock-reflect`,
    { method: "POST", body: JSON.stringify(body) },
  );
  const data = res.data ?? {};
  return {
    line: normalizeSupplyLine(
      ((data.line ?? data) as Record<string, unknown>) ?? {},
    ),
    product: normalizeProduct((data.product ?? {}) as Record<string, unknown>),
  };
}

export async function cancelSupplyStockReflect(
  id: string,
): Promise<{ line: SupplyExpenseLine; product: InventoryProduct }> {
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>(
    `/purchase/supply/${id}/stock-reflect`,
    { method: "DELETE" },
  );
  const data = res.data ?? {};
  return {
    line: normalizeSupplyLine(
      ((data.line ?? data) as Record<string, unknown>) ?? {},
    ),
    product: normalizeProduct((data.product ?? {}) as Record<string, unknown>),
  };
}

// —— Other ——

export type OtherGroupRow = {
  paymentDate: string;
  lines: OtherExpenseLine[];
};

export type OtherListResult = {
  groups: OtherGroupRow[];
  lines: OtherExpenseLine[];
  meta: PurchaseListMeta;
};

function mapOtherGroups(data: Record<string, unknown>[]): Omit<OtherListResult, "meta"> {
  const groups: OtherGroupRow[] = [];
  const lines: OtherExpenseLine[] = [];
  data.forEach((row) => {
    const paymentDate = String(row.paymentDate ?? "");
    const rawLines = Array.isArray(row.lines) ? row.lines : [];
    const normalizedLines = rawLines.map((item) =>
      normalizeOtherLine((item ?? {}) as Record<string, unknown>),
    );
    groups.push({ paymentDate, lines: normalizedLines });
    lines.push(...normalizedLines);
  });
  return { groups, lines };
}

/** GET /purchase/other */
export async function fetchOtherExpenseList(
  params?: PurchaseListParams,
): Promise<OtherListResult> {
  const res = await apiFetch<
    ApiEnvelope<Record<string, unknown>[]> & { meta?: Partial<PurchaseListMeta> }
  >(`/purchase/other?${buildListSearch(params)}`);

  const data = (res.data ?? []) as Record<string, unknown>[];
  const mapped = mapOtherGroups(data);

  return {
    ...mapped,
    meta: normalizeListMeta(res.meta, data.length, params),
  };
}

export type OtherLinePayload = {
  paymentDate: string;
  itemName: string;
  paymentAmount: number;
  memo?: string;
  bankId?: string | null;
};

export function toOtherLinePayload(
  line: Omit<OtherExpenseLine, "id">,
): OtherLinePayload {
  return {
    paymentDate: line.paymentDate,
    itemName: line.itemName,
    paymentAmount: line.paymentAmount,
    ...(line.memo ? { memo: line.memo } : {}),
    bankId: purchaseBankIdForApi(line.bankId),
  };
}

export async function createOtherExpenseLine(
  body: OtherLinePayload,
): Promise<OtherExpenseLine> {
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>(
    "/purchase/other",
    { method: "POST", body: JSON.stringify(body) },
  );
  return normalizeOtherLine(res.data ?? {});
}

export async function updateOtherExpenseLine(
  id: string,
  body: OtherLinePayload,
): Promise<OtherExpenseLine> {
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>(
    `/purchase/other/${id}`,
    { method: "PATCH", body: JSON.stringify(body) },
  );
  return normalizeOtherLine(res.data ?? {});
}

export async function deleteOtherExpenseLine(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok?: boolean }>>(`/purchase/other/${id}`, {
    method: "DELETE",
  });
}

export function getPurchaseErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "요청에 실패했습니다.";
}
