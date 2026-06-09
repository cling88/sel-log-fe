import { ApiError, apiFetch, type ApiEnvelope } from "@/lib/api-client";
import type { LedgerTabId, PurchaseSubTabId } from "@/types/common";
import type { LedgerGlobalSearchResult } from "@/types/ledger-global-search";

export const LEDGER_SEARCH_QUERY_KEY = ["ledger-search"] as const;
export const LEDGER_SEARCH_DEFAULT_LIMIT = 30;

export type LedgerSearchListMeta = {
  total: number;
  page: number;
  limit: number;
};

export type LedgerSearchListResult = {
  items: LedgerGlobalSearchResult[];
  meta: LedgerSearchListMeta;
};

const TAB_LABELS: Record<LedgerTabId, string> = {
  purchase: "매입",
  sale: "매출",
  income: "수익",
  products: "상품관리",
};

const PURCHASE_SUB_LABELS: Record<PurchaseSubTabId, string> = {
  product: "상품매입",
  supply: "부가",
  other: "기타지출",
};

function normalizeTab(value: unknown): LedgerTabId | null {
  if (
    value === "purchase" ||
    value === "sale" ||
    value === "income" ||
    value === "products"
  ) {
    return value;
  }
  return null;
}

function normalizePurchaseSub(value: unknown): PurchaseSubTabId | undefined {
  if (value === "product" || value === "supply" || value === "other") {
    return value;
  }
  return undefined;
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim()) return value;
  return undefined;
}

export function normalizeLedgerSearchItem(
  raw: Record<string, unknown>,
): LedgerGlobalSearchResult | null {
  const tab = normalizeTab(raw.tab);
  if (!tab) return null;

  const purchaseSub = normalizePurchaseSub(raw.purchaseSub);
  const month = normalizeOptionalString(raw.month);
  const date = normalizeOptionalString(raw.date);
  const title = normalizeOptionalString(raw.title);
  if (!title) return null;

  return {
    id: String(raw.id ?? ""),
    tab,
    ...(purchaseSub ? { purchaseSub } : {}),
    entityId: String(raw.entityId ?? ""),
    ...(month ? { month } : {}),
    tabLabel: TAB_LABELS[tab],
    ...(purchaseSub ? { subLabel: PURCHASE_SUB_LABELS[purchaseSub] } : {}),
    title,
    subtitle: normalizeOptionalString(raw.subtitle),
    ...(date ? { date } : {}),
  };
}

function normalizeListMeta(
  meta: Partial<LedgerSearchListMeta> | undefined,
  itemsLength: number,
  params: { page: number; limit: number },
): LedgerSearchListMeta {
  const limit =
    typeof meta?.limit === "number" && meta.limit > 0 ? meta.limit : params.limit;
  const page =
    typeof meta?.page === "number" && meta.page > 0 ? meta.page : params.page;
  const total =
    typeof meta?.total === "number" && meta.total >= 0
      ? meta.total
      : itemsLength;

  return { total, page, limit };
}

export function getLedgerSearchErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "전역 검색에 실패했습니다.";
}

export async function fetchLedgerSearch(
  q: string,
  page = 1,
  limit = LEDGER_SEARCH_DEFAULT_LIMIT,
): Promise<LedgerSearchListResult> {
  const trimmed = q.trim();
  if (!trimmed) {
    return {
      items: [],
      meta: { total: 0, page: 1, limit },
    };
  }

  const params = new URLSearchParams({
    q: trimmed,
    page: String(page),
    limit: String(limit),
  });

  const res = await apiFetch<
    ApiEnvelope<unknown[]> & { meta?: Partial<LedgerSearchListMeta> }
  >(`/ledger/search?${params.toString()}`);

  const rawItems = Array.isArray(res.data) ? res.data : [];
  const items = rawItems
    .map((item) =>
      normalizeLedgerSearchItem((item ?? {}) as Record<string, unknown>),
    )
    .filter((item): item is LedgerGlobalSearchResult => item != null);

  return {
    items,
    meta: normalizeListMeta(res.meta, items.length, { page, limit }),
  };
}
