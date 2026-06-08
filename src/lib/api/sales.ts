import { ApiError, apiFetch, type ApiEnvelope } from "@/lib/api-client";
import type { SalesChannelSummary } from "@/types/sale-channel";
import type {
  SaleOrder,
  SaleOrderAdjustment,
  SaleOrderItem,
  SaleOrderStatus,
} from "@/types/sale";

export type SaleListMeta = {
  total: number;
  page: number;
  limit: number;
  todayTotal: number;
  monthTotal: number;
};

export type SaleListParams = {
  q?: string;
  month?: string;
  status?: SaleOrderStatus;
  page?: number;
  limit?: number;
};

export type SaleListResult = {
  orders: SaleOrder[];
  meta: SaleListMeta;
};

export type SaleOrderItemPayload = {
  productId: string;
  quantity: number;
  lineAmount: number;
};

export type SaleOrderAdjustmentPayload = {
  label: string;
  amount: number;
};

export type SaleOrderPayload = {
  orderDate: string;
  orderNo: string;
  customerName: string;
  channelId?: string;
  items: SaleOrderItemPayload[];
  extraAdjustments: SaleOrderAdjustmentPayload[];
  discountAdjustments: SaleOrderAdjustmentPayload[];
  memo?: string;
};

const DEFAULT_PAGE = 1;
export const SALES_API_PAGE_SIZE = 8;

export function getSaleErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "매출 요청에 실패했습니다.";
}

function normalizeOptionalString(value: unknown): string {
  if (typeof value === "string") return value;
  return "";
}

function normalizeStatus(value: unknown): SaleOrderStatus {
  return value === "cancelled" ? "cancelled" : "normal";
}

function normalizeAdjustment(
  raw: unknown,
  index: number,
): SaleOrderAdjustment {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    id: String(row.id ?? `adj-${index}`),
    label: normalizeOptionalString(row.label),
    amount: Number(row.amount) || 0,
  };
}

function normalizeSaleItem(raw: unknown, index: number): SaleOrderItem {
  const row = (raw ?? {}) as Record<string, unknown>;
  return {
    productId: String(row.productId ?? ""),
    productSku: normalizeOptionalString(row.productSku),
    productName: normalizeOptionalString(row.productName),
    quantity: Math.max(0, Number(row.quantity) || 0),
    lineAmount: Math.max(0, Number(row.lineAmount) || 0),
  };
}

function normalizeChannelId(value: unknown): string | null {
  if (value == null || value === "") return null;
  const id = String(value).trim();
  return id || null;
}

function normalizeChannelSummary(raw: unknown): SalesChannelSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = normalizeChannelId(row.id);
  if (!id) return null;
  return {
    id,
    name: normalizeOptionalString(row.name),
  };
}

export function normalizeSaleOrder(raw: unknown): SaleOrder {
  const row = (raw ?? {}) as Record<string, unknown>;
  const extraAdjustments = Array.isArray(row.extraAdjustments)
    ? row.extraAdjustments.map(normalizeAdjustment)
    : [];
  const discountAdjustments = Array.isArray(row.discountAdjustments)
    ? row.discountAdjustments.map(normalizeAdjustment)
    : [];
  const items = Array.isArray(row.items)
    ? row.items.map(normalizeSaleItem)
    : [];

  const channel = normalizeChannelSummary(row.channel);
  const channelId = normalizeChannelId(row.channelId) ?? channel?.id ?? null;

  return {
    id: String(row.id ?? ""),
    orderDate: normalizeOptionalString(row.orderDate),
    orderNo: normalizeOptionalString(row.orderNo),
    customerName: normalizeOptionalString(row.customerName),
    channelId,
    channel,
    items,
    extraAdjustments,
    discountAdjustments,
    extraAmount: Number(row.extraAmount) || 0,
    discountAmount: Number(row.discountAmount) || 0,
    totalAmount: Number(row.totalAmount) || 0,
    memo: normalizeOptionalString(row.memo) || undefined,
    status: normalizeStatus(row.status),
  };
}

function normalizeListMeta(
  meta: Partial<SaleListMeta> | undefined,
  itemsLength: number,
  params?: { page?: number; limit?: number },
): SaleListMeta {
  const requestedPage = params?.page ?? DEFAULT_PAGE;
  const requestedLimit = params?.limit ?? SALES_API_PAGE_SIZE;
  const limit =
    typeof meta?.limit === "number" && meta.limit > 0
      ? meta.limit
      : requestedLimit;
  const page =
    typeof meta?.page === "number" && meta.page > 0
      ? meta.page
      : requestedPage;
  const total =
    typeof meta?.total === "number" && meta.total >= 0
      ? meta.total
      : itemsLength;
  return {
    total,
    page,
    limit,
    todayTotal: Number(meta?.todayTotal) || 0,
    monthTotal: Number(meta?.monthTotal) || 0,
  };
}

function buildListSearch(params?: SaleListParams): string {
  const search = new URLSearchParams();
  search.set("page", String(params?.page ?? DEFAULT_PAGE));
  search.set("limit", String(params?.limit ?? SALES_API_PAGE_SIZE));
  if (params?.month) search.set("month", params.month);
  if (params?.q?.trim()) search.set("q", params.q.trim());
  if (params?.status) search.set("status", params.status);
  return search.toString();
}

export function normalizeSaleAdjustments(
  items: SaleOrderAdjustment[],
): SaleOrderAdjustmentPayload[] {
  return items
    .map((item) => ({
      label: item.label.trim(),
      amount: Math.max(0, Number(item.amount) || 0),
    }))
    .filter((item) => item.label.length >= 1 && item.amount > 0);
}

export function toSaleOrderPayload(input: {
  orderDate: string;
  orderNo: string;
  customerName: string;
  channelId?: string | null;
  items: SaleOrderItemPayload[];
  extraAdjustments: SaleOrderAdjustment[];
  discountAdjustments: SaleOrderAdjustment[];
  memo?: string;
}): SaleOrderPayload {
  const channelId = input.channelId?.trim() || undefined;
  return {
    orderDate: input.orderDate.trim(),
    orderNo: input.orderNo.trim(),
    customerName: input.customerName.trim(),
    ...(channelId ? { channelId } : {}),
    items: input.items.map((item) => ({
      productId: item.productId,
      quantity: Math.max(1, Number(item.quantity) || 1),
      lineAmount: Math.max(0, Number(item.lineAmount) || 0),
    })),
    extraAdjustments: normalizeSaleAdjustments(input.extraAdjustments),
    discountAdjustments: normalizeSaleAdjustments(input.discountAdjustments),
    memo: input.memo?.trim() || "",
  };
}

/** GET /api/v1/sales */
export async function fetchSaleOrders(
  params?: SaleListParams,
): Promise<SaleListResult> {
  const res = await apiFetch<
    ApiEnvelope<Record<string, unknown>[]> & {
      meta?: Partial<SaleListMeta>;
    }
  >(`/sales?${buildListSearch(params)}`);

  const orders = (res.data ?? []).map(normalizeSaleOrder);
  return {
    orders,
    meta: normalizeListMeta(res.meta, orders.length, params),
  };
}

/** POST /api/v1/sales */
export async function createSaleOrder(body: SaleOrderPayload): Promise<SaleOrder> {
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>("/sales", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return normalizeSaleOrder(res.data);
}

/** PATCH /api/v1/sales/:id */
export async function updateSaleOrder(
  id: string,
  body: SaleOrderPayload,
): Promise<SaleOrder> {
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>(
    `/sales/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
  return normalizeSaleOrder(res.data);
}

/** PATCH /api/v1/sales/:id/cancel */
export async function patchSaleOrderCancel(
  id: string,
  cancel: boolean,
): Promise<SaleOrder> {
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>(
    `/sales/${id}/cancel`,
    {
      method: "PATCH",
      body: JSON.stringify({ cancel }),
    },
  );
  return normalizeSaleOrder(res.data);
}

/** DELETE /api/v1/sales/:id */
export async function deleteSaleOrder(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok?: boolean }>>(`/sales/${id}`, {
    method: "DELETE",
  });
}
