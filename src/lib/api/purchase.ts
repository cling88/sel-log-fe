import { ApiError, apiFetch, type ApiEnvelope } from "@/lib/api-client";
import { createDefaultGroupMeta, type PurchaseGroupMeta } from "@/types/purchase-group";
import type {
  PurchaseDateGroup,
  PurchaseDateGroupTotals,
  VendorPurchaseGroup,
} from "@/types/purchase-group";
import type { OtherExpenseLine } from "@/types/purchase-other";
import type { ProductPurchaseLine } from "@/types/purchase-product";
import {
  SUPPLY_VENDOR_NONE_KEY,
  type SupplyDateGroup,
  type SupplyExpenseLine,
  type SupplyVendorGroup,
} from "@/types/purchase-supply";
import type { InventoryProduct } from "@/types/inventory-product";
import { purchaseBankIdForApi } from "@/lib/purchase-bank-display";
import { normalizeProduct } from "@/lib/api/products";
import type { BankSummary } from "@/types/bank-account";
import type { VendorSummary } from "@/types/vendor";

export type PurchaseListMeta = {
  total: number;
  page: number;
  limit: number;
};

export type PurchaseListParams = {
  q?: string;
  month?: string;
  /** `month` 생략 시 연도 전체 (`YYYY`) */
  year?: string;
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
  if (params?.year) search.set("year", params.year);
  else if (params?.month) search.set("month", params.month);
  if (params?.q?.trim()) search.set("q", params.q.trim());
  return search.toString();
}

function normalizeOptionalString(value: unknown): string {
  if (typeof value === "string") return value;
  return "";
}

function normalizeAdjustments(
  raw: unknown,
  idPrefix: string,
): PurchaseGroupMeta["extraFees"] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) => {
    const row = (item ?? {}) as Record<string, unknown>;
    return {
      id: String(row.id ?? `${idPrefix}-${i}`),
      label: normalizeOptionalString(row.label),
      amount: Number(row.amount) || 0,
    };
  });
}

function normalizeGroupMeta(
  raw: Record<string, unknown> | null | undefined,
  fallbackIndex: number,
): PurchaseGroupMeta {
  if (!raw || typeof raw !== "object") {
    return createDefaultGroupMeta(fallbackIndex);
  }
  const extraFees = normalizeAdjustments(raw.extraFees, "fee");
  const discounts = normalizeAdjustments(raw.discounts, "disc");
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

function normalizeVendorId(raw: Record<string, unknown>): string | null {
  const value = raw.vendorId;
  if (value == null || value === "") return null;
  return String(value);
}

function normalizeVendorSummary(raw: unknown): VendorSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = String(row.id ?? "").trim();
  if (!id) return null;
  return {
    id,
    name: normalizeOptionalString(row.name),
    link: normalizeOptionalString(row.link),
  };
}

function normalizePurchaseLineBankFields(raw: Record<string, unknown>) {
  return {
    bankId: normalizeBankId(raw),
    bank: normalizeBankSummary(raw.bank),
  };
}

function normalizePurchaseLineVendorFields(raw: Record<string, unknown>) {
  const vendorRaw = raw.vendor;
  const vendorSnapshot =
    normalizeVendorSummary(raw.vendorSnapshot) ??
    (typeof vendorRaw === "object" ? normalizeVendorSummary(vendorRaw) : null);
  const vendorId = normalizeVendorId(raw) ?? vendorSnapshot?.id ?? null;
  const vendorName =
    (typeof vendorRaw === "string" ? normalizeOptionalString(vendorRaw) : "") ||
    vendorSnapshot?.name ||
    "";
  return {
    vendor: vendorName,
    vendorId,
    vendorSnapshot:
      vendorSnapshot && vendorId && vendorSnapshot.id === vendorId
        ? vendorSnapshot
        : vendorId && vendorName
          ? { id: vendorId, name: vendorName, link: vendorSnapshot?.link ?? "" }
          : null,
  };
}

function normalizeNullableNumber(value: unknown): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return null;
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
    quantity: Number(raw.quantity) || 0,
    paymentAmount: Number(raw.paymentAmount) || 0,
    previousPaymentAmount: normalizeNullableNumber(raw.previousPaymentAmount),
    previousQuantity: normalizeNullableNumber(raw.previousQuantity),
    unitPrice: normalizeNullableNumber(raw.unitPrice),
    previousUnitPrice: normalizeNullableNumber(raw.previousUnitPrice),
    amountAmendedAtIso: normalizeOptionalString(raw.amountAmendedAtIso) ?? null,
    memo: normalizeOptionalString(raw.memo),
    stockReflected: raw.stockReflected === true,
    ...normalizePurchaseLineBankFields(raw),
    ...normalizePurchaseLineVendorFields(raw),
    ...(typeof sku === "string" && sku ? { productSku: sku } : {}),
  };
}

function normalizeSupplyLine(raw: Record<string, unknown>): SupplyExpenseLine {
  const sku = raw.productSku;
  const reflectedQty = normalizeNullableNumber(raw.reflectedQty);
  return {
    id: String(raw.id ?? ""),
    paymentDate: String(raw.paymentDate ?? ""),
    itemName: normalizeOptionalString(raw.itemName),
    quantity: Number(raw.quantity) || 0,
    paymentAmount: Number(raw.paymentAmount) || 0,
    memo: normalizeOptionalString(raw.memo),
    stockReflected: raw.stockReflected === true,
    ...normalizePurchaseLineBankFields(raw),
    ...normalizePurchaseLineVendorFields(raw),
    ...(typeof sku === "string" && sku ? { productSku: sku } : {}),
    ...(reflectedQty != null && reflectedQty > 0 ? { reflectedQty } : {}),
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
  groups: PurchaseDateGroup[];
  lines: ProductPurchaseLine[];
  meta: PurchaseListMeta;
};

function normalizePurchaseDateGroupTotals(raw: unknown): PurchaseDateGroupTotals {
  const row = (raw ?? {}) as Record<string, unknown>;
  const linesTotal = Number(row.linesTotal) || 0;
  const extraFeesTotal = Number(row.extraFeesTotal) || 0;
  const discountsTotal = Number(row.discountsTotal) || 0;
  const grandTotal =
    Number(row.grandTotal) || linesTotal + extraFeesTotal - discountsTotal;
  return { linesTotal, extraFeesTotal, discountsTotal, grandTotal };
}

function normalizeVendorPurchaseGroup(
  raw: Record<string, unknown>,
): VendorPurchaseGroup {
  const vendorId = String(raw.vendorId ?? "").trim();
  const vendorSnapshot = normalizeVendorSummary(raw.vendorSnapshot) ?? {
    id: vendorId || "unknown",
    name: "구매처 없음",
    link: "",
  };
  const lines = (Array.isArray(raw.lines) ? raw.lines : []).map((item) =>
    normalizeProductPurchaseLine((item ?? {}) as Record<string, unknown>),
  );
  return {
    vendorId: vendorId || vendorSnapshot.id,
    vendorSnapshot,
    extraFees: normalizeAdjustments(raw.extraFees, "fee"),
    discounts: normalizeAdjustments(raw.discounts, "disc"),
    orderCancelled: raw.orderCancelled === true,
    subtotal: Number(raw.subtotal) || 0,
    lines,
  };
}

function legacyLinesToVendorGroups(
  lines: ProductPurchaseLine[],
  meta: PurchaseGroupMeta,
): VendorPurchaseGroup[] {
  if (lines.length === 0) return [];

  const buckets = new Map<string, ProductPurchaseLine[]>();
  for (const line of lines) {
    const key = (line.vendorId ?? line.vendor.trim()) || "__none__";
    const bucket = buckets.get(key) ?? [];
    bucket.push(line);
    buckets.set(key, bucket);
  }

  const vendorGroups: VendorPurchaseGroup[] = [];
  let first = true;
  for (const [key, bucketLines] of buckets) {
    const snapshot = bucketLines[0]?.vendorSnapshot ?? {
      id: key === "__none__" ? "legacy-none" : key,
      name: bucketLines[0]?.vendor.trim() || "미지정",
      link: "",
    };
    const linesTotal = bucketLines.reduce((s, l) => s + l.paymentAmount, 0);
    const extraFees = first ? meta.extraFees : [];
    const discounts = first ? meta.discounts : [];
    const extraSum = extraFees.reduce((s, i) => s + Math.max(0, i.amount), 0);
    const discSum = discounts.reduce((s, i) => s + Math.max(0, i.amount), 0);
    vendorGroups.push({
      vendorId: snapshot.id,
      vendorSnapshot: snapshot,
      extraFees,
      discounts,
      orderCancelled: false,
      subtotal: linesTotal + extraSum - discSum,
      lines: bucketLines,
    });
    first = false;
  }
  return vendorGroups;
}

function buildTotalsFromVendorGroups(
  vendorGroups: VendorPurchaseGroup[],
): PurchaseDateGroupTotals {
  const linesTotal = vendorGroups.reduce(
    (sum, vg) => sum + vg.lines.reduce((s, l) => s + l.paymentAmount, 0),
    0,
  );
  const extraFeesTotal = vendorGroups.reduce(
    (sum, vg) =>
      sum + vg.extraFees.reduce((s, i) => s + Math.max(0, i.amount), 0),
    0,
  );
  const discountsTotal = vendorGroups.reduce(
    (sum, vg) =>
      sum + vg.discounts.reduce((s, i) => s + Math.max(0, i.amount), 0),
    0,
  );
  return {
    linesTotal,
    extraFeesTotal,
    discountsTotal,
    grandTotal: linesTotal + extraFeesTotal - discountsTotal,
  };
}

function mapProductPurchaseGroups(
  data: Record<string, unknown>[],
): Omit<ProductPurchaseListResult, "meta"> {
  const groups: PurchaseDateGroup[] = [];
  const lines: ProductPurchaseLine[] = [];

  data.forEach((row, index) => {
    const paymentDate = String(row.paymentDate ?? "");

    if (Array.isArray(row.vendorGroups)) {
      const vendorGroups = row.vendorGroups.map((item) =>
        normalizeVendorPurchaseGroup((item ?? {}) as Record<string, unknown>),
      );
      vendorGroups.forEach((vg) => lines.push(...vg.lines));
      groups.push({
        paymentDate,
        groupName: normalizeOptionalString(row.groupName) || null,
        orderCancelled: row.orderCancelled === true,
        vendorGroups,
        totals: normalizePurchaseDateGroupTotals(row.totals),
      });
      return;
    }

    const rawLines = Array.isArray(row.lines) ? row.lines : [];
    const normalizedLines = rawLines.map((item) =>
      normalizeProductPurchaseLine((item ?? {}) as Record<string, unknown>),
    );
    const meta = normalizeGroupMeta(
      row.groupMeta as Record<string, unknown> | undefined,
      index,
    );
    const vendorGroups = legacyLinesToVendorGroups(normalizedLines, meta);
    lines.push(...normalizedLines);
    groups.push({
      paymentDate,
      groupName: meta.groupName,
      orderCancelled: meta.orderCancelled,
      vendorGroups,
      totals: buildTotalsFromVendorGroups(vendorGroups),
    });
  });

  return { groups, lines };
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
  vendorId: string;
  quantity: number;
  paymentAmount: number;
  orderNo?: string | null;
  imageUrl?: string | null;
  productLink?: string | null;
  memo?: string | null;
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
  const vendorId = line.vendorId?.trim();
  if (!vendorId) {
    throw new Error("구매처를 선택해 주세요.");
  }
  const orderNo = line.orderNo?.trim();
  const imageUrl = line.imageUrl?.trim();
  const productLink = line.productLink?.trim();
  const memo = line.memo?.trim();

  return {
    paymentDate: line.paymentDate,
    productName: line.productName.trim(),
    vendorId,
    quantity: Math.trunc(line.quantity),
    paymentAmount: Math.trunc(line.paymentAmount),
    ...(orderNo ? { orderNo } : {}),
    ...(imageUrl && isHttpUrl(imageUrl) ? { imageUrl } : {}),
    ...(productLink && isHttpUrl(productLink) ? { productLink } : {}),
    ...(memo ? { memo } : {}),
    bankId: purchaseBankIdForApi(line.bankId),
  };
}

/** 재고 반영 후 출금계좌 PATCH — FE-guide: 기존 필드값 유지 + nullable 명시 */
export function toProductPurchaseLinePayloadForBankUpdate(
  line: Omit<ProductPurchaseLine, "id" | "stockReflected">,
): ProductPurchaseLinePayload {
  const vendorId = line.vendorId?.trim();
  if (!vendorId) {
    throw new Error("구매처를 선택해 주세요.");
  }
  const orderNo = line.orderNo?.trim();
  const imageUrl = line.imageUrl?.trim();
  const productLink = line.productLink?.trim();
  const memo = line.memo?.trim();

  return {
    paymentDate: line.paymentDate,
    productName: line.productName.trim(),
    vendorId,
    quantity: Math.trunc(line.quantity),
    paymentAmount: Math.trunc(line.paymentAmount),
    orderNo: orderNo || null,
    imageUrl: imageUrl && isHttpUrl(imageUrl) ? imageUrl : null,
    productLink: productLink && isHttpUrl(productLink) ? productLink : null,
    memo: memo || null,
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
  /** true: 재고반영 시 products.currentPrice를 매입 단가로 덮어쓰지 않음 */
  preserveProductPrice?: boolean;
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

function toStockReflectPayload(body: StockReflectPayload): Record<string, unknown> {
  return {
    productSku: body.productSku,
    qty: body.qty,
    ...(body.preserveProductPrice ? { preserveProductPrice: true } : {}),
  };
}

/** POST /purchase/products/:id/stock-reflect */
export async function reflectProductPurchaseStock(
  id: string,
  body: StockReflectPayload,
): Promise<StockReflectResult> {
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>(
    `/purchase/products/${id}/stock-reflect`,
    { method: "POST", body: JSON.stringify(toStockReflectPayload(body)) },
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
};

export type PatchPurchaseVendorGroupBody = {
  paymentDate: string;
  /** 구매처 없음 그룹은 `null` */
  vendorId: string | null;
  extraFees?: { id?: string; label: string; amount: number }[];
  discounts?: { id?: string; label: string; amount: number }[];
};

/** PATCH /purchase/groups — 결제일 공통 (그룹명만) */
export async function patchPurchaseGroup(
  body: PatchPurchaseGroupBody,
): Promise<{ groupName: string | null; orderCancelled: boolean }> {
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>(
    "/purchase/groups",
    { method: "PATCH", body: JSON.stringify(body) },
  );
  const row = res.data ?? {};
  return {
    groupName: normalizeOptionalString(row.groupName) || null,
    orderCancelled: row.orderCancelled === true,
  };
}

/** PATCH /purchase/groups/cancel — 결제일 단위 주문취소 */
export async function patchPurchaseGroupCancel(
  paymentDate: string,
  orderCancelled: boolean,
): Promise<{ orderCancelled: boolean }> {
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>(
    "/purchase/groups/cancel",
    {
      method: "PATCH",
      body: JSON.stringify({ paymentDate, orderCancelled }),
    },
  );
  return { orderCancelled: res.data?.orderCancelled === true };
}

function normalizeVendorGroupFromPatch(
  raw: Record<string, unknown>,
): VendorPurchaseGroup {
  return normalizeVendorPurchaseGroup(raw);
}

/** PATCH /purchase/groups/vendor — 상품매입 구매처별 추가금·할인 */
export async function patchPurchaseVendorGroup(
  body: PatchPurchaseVendorGroupBody,
): Promise<VendorPurchaseGroup> {
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>(
    "/purchase/groups/vendor",
    { method: "PATCH", body: JSON.stringify(body) },
  );
  return normalizeVendorGroupFromPatch(res.data ?? {});
}

/** PATCH /purchase/groups/vendor/cancel — 구매처 단위 주문취소 */
export async function patchPurchaseVendorGroupCancel(
  paymentDate: string,
  vendorId: string,
  orderCancelled: boolean,
): Promise<VendorPurchaseGroup> {
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>(
    "/purchase/groups/vendor/cancel",
    {
      method: "PATCH",
      body: JSON.stringify({ paymentDate, vendorId, orderCancelled }),
    },
  );
  return normalizeVendorGroupFromPatch(res.data ?? {});
}

// —— Supply ——

function normalizeSupplyVendorGroup(
  raw: Record<string, unknown>,
): SupplyVendorGroup {
  const vendorId = normalizeVendorId(raw);
  const vendorSnapshot =
    normalizeVendorSummary(raw.vendorSnapshot) ??
    (vendorId == null
      ? { id: SUPPLY_VENDOR_NONE_KEY, name: "미지정", link: "" }
      : null);
  const lines = (Array.isArray(raw.lines) ? raw.lines : []).map((item) =>
    normalizeSupplyLine((item ?? {}) as Record<string, unknown>),
  );
  const extraFees = normalizeAdjustments(raw.extraFees, "fee");
  const discounts = normalizeAdjustments(raw.discounts, "disc");
  const linesTotal = lines.reduce((sum, line) => sum + line.paymentAmount, 0);
  const extraSum = extraFees.reduce((s, i) => s + Math.max(0, i.amount), 0);
  const discSum = discounts.reduce((s, i) => s + Math.max(0, i.amount), 0);
  const subtotalRaw = raw.subtotal;
  const subtotal =
    subtotalRaw !== undefined && subtotalRaw !== null && subtotalRaw !== ""
      ? Number(subtotalRaw) || 0
      : linesTotal + extraSum - discSum;

  return {
    vendorId,
    vendorSnapshot,
    extraFees,
    discounts,
    orderCancelled: raw.orderCancelled === true,
    subtotal,
    lines,
  };
}

function legacySupplyLinesToVendorGroups(
  lines: SupplyExpenseLine[],
  meta: Pick<PurchaseGroupMeta, "extraFees" | "discounts">,
): SupplyVendorGroup[] {
  if (lines.length === 0) return [];

  const buckets = new Map<string, SupplyExpenseLine[]>();
  for (const line of lines) {
    const key = (line.vendorId ?? line.vendor.trim()) || "__none__";
    const bucket = buckets.get(key) ?? [];
    bucket.push(line);
    buckets.set(key, bucket);
  }

  const vendorGroups: SupplyVendorGroup[] = [];
  let first = true;
  for (const [key, bucketLines] of buckets) {
    const snapshot = bucketLines[0]?.vendorSnapshot ?? {
      id: key === "__none__" ? "legacy-none" : key,
      name: bucketLines[0]?.vendor.trim() || "미지정",
      link: "",
    };
    const linesTotal = bucketLines.reduce((s, l) => s + l.paymentAmount, 0);
    const extraFees = first ? meta.extraFees : [];
    const discounts = first ? meta.discounts : [];
    const extraSum = extraFees.reduce((s, i) => s + Math.max(0, i.amount), 0);
    const discSum = discounts.reduce((s, i) => s + Math.max(0, i.amount), 0);
    vendorGroups.push({
      vendorId: key === "__none__" ? null : snapshot.id,
      vendorSnapshot: key === "__none__" ? null : snapshot,
      extraFees,
      discounts,
      orderCancelled: false,
      subtotal: linesTotal + extraSum - discSum,
      lines: bucketLines,
    });
    first = false;
  }
  return vendorGroups;
}

function buildSupplyTotalsFromVendorGroups(
  vendorGroups: SupplyVendorGroup[],
): PurchaseDateGroupTotals {
  const linesTotal = vendorGroups.reduce(
    (sum, vg) => sum + vg.lines.reduce((s, l) => s + l.paymentAmount, 0),
    0,
  );
  const extraFeesTotal = vendorGroups.reduce(
    (sum, vg) =>
      sum + vg.extraFees.reduce((s, i) => s + Math.max(0, i.amount), 0),
    0,
  );
  const discountsTotal = vendorGroups.reduce(
    (sum, vg) =>
      sum + vg.discounts.reduce((s, i) => s + Math.max(0, i.amount), 0),
    0,
  );
  return {
    linesTotal,
    extraFeesTotal,
    discountsTotal,
    grandTotal: linesTotal + extraFeesTotal - discountsTotal,
  };
}

function mapSupplyGroups(
  data: Record<string, unknown>[],
): Omit<SupplyListResult, "meta"> {
  const groups: SupplyDateGroup[] = [];
  const lines: SupplyExpenseLine[] = [];

  data.forEach((row, index) => {
    const paymentDate = String(row.paymentDate ?? "");

    if (Array.isArray(row.vendorGroups)) {
      const vendorGroups = row.vendorGroups.map((item) =>
        normalizeSupplyVendorGroup((item ?? {}) as Record<string, unknown>),
      );
      vendorGroups.forEach((vg) => lines.push(...vg.lines));
      groups.push({
        paymentDate,
        groupName: normalizeOptionalString(row.groupName) || null,
        orderCancelled: row.orderCancelled === true,
        vendorGroups,
        totals: normalizePurchaseDateGroupTotals(row.totals),
      });
      return;
    }

    const rawLines = Array.isArray(row.lines) ? row.lines : [];
    const normalizedLines = rawLines.map((item) =>
      normalizeSupplyLine((item ?? {}) as Record<string, unknown>),
    );
    const meta = normalizeGroupMeta(
      row.groupMeta as Record<string, unknown> | undefined,
      index,
    );
    const vendorGroups = legacySupplyLinesToVendorGroups(normalizedLines, meta);
    lines.push(...normalizedLines);
    groups.push({
      paymentDate,
      groupName: meta.groupName,
      orderCancelled: meta.orderCancelled,
      vendorGroups,
      totals: buildSupplyTotalsFromVendorGroups(vendorGroups),
    });
  });

  return { groups, lines };
}

export type SupplyListResult = {
  groups: SupplyDateGroup[];
  lines: SupplyExpenseLine[];
  meta: PurchaseListMeta;
};

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
  vendorId?: string;
  memo?: string;
  bankId?: string | null;
};

export function toSupplyLinePayload(
  line: Omit<SupplyExpenseLine, "id" | "stockReflected">,
): SupplyLinePayload {
  const vendorId = line.vendorId?.trim();
  return {
    paymentDate: line.paymentDate,
    itemName: line.itemName,
    quantity: line.quantity,
    paymentAmount: line.paymentAmount,
    ...(vendorId ? { vendorId } : {}),
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

/** PATCH /purchase/supply/groups/vendor — 부가 구매처별 추가금·할인 */
export async function patchSupplyVendorGroup(
  body: PatchPurchaseVendorGroupBody,
): Promise<SupplyVendorGroup> {
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>(
    "/purchase/supply/groups/vendor",
    { method: "PATCH", body: JSON.stringify(body) },
  );
  return normalizeSupplyVendorGroup(res.data ?? {});
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
  if (error instanceof ApiError) {
    if (error.code === "STOCK_REFLECTED") {
      return (
        error.message ||
        "재고반영된 내역은 출금계좌만 수정할 수 있습니다."
      );
    }
    if (error.code === "INVALID_QUERY") {
      return error.message || "month와 year는 동시에 보낼 수 없습니다.";
    }
    if (error.code === "PRODUCT_KIND_MISMATCH") {
      return error.message || "선택한 SKU의 상품 유형이 일치하지 않습니다.";
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "요청에 실패했습니다.";
}
