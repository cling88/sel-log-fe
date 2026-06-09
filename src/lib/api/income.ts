import { ApiError, apiFetch, type ApiEnvelope } from "@/lib/api-client";
import { purchaseBankIdForApi } from "@/lib/purchase-bank-display";
import type { BankSummary } from "@/types/bank-account";
import type { IncomeDepositLine } from "@/types/income";

export type IncomeListMeta = {
  total: number;
  page: number;
  limit: number;
  todayTotal: number;
  monthTotal: number;
};

export type IncomeListParams = {
  q?: string;
  month?: string;
  page?: number;
  limit?: number;
};

export type IncomeDepositGroupRow = {
  depositDate: string;
  lines: IncomeDepositLine[];
};

export type IncomeListResult = {
  groups: IncomeDepositGroupRow[];
  lines: IncomeDepositLine[];
  meta: IncomeListMeta;
};

export type IncomeLinePayload = {
  depositDate: string;
  itemName: string;
  amount: number;
  bankId?: string;
  vatAmount?: number;
  commissionAmount?: number;
  orderNo?: string;
  linkedSaleOrderId?: string;
  memo?: string;
};

const DEFAULT_PAGE = 1;
export const INCOME_API_GROUPS_PAGE_SIZE = 5;

export function getIncomeErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "수익 요청에 실패했습니다.";
}

function normalizeOptionalString(value: unknown): string {
  if (typeof value === "string") return value;
  return "";
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

function normalizeOptionalAmount(value: unknown): number | null | undefined {
  if (value == null || value === "") return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return Math.max(0, Math.trunc(n));
}

export function normalizeIncomeLine(raw: unknown): IncomeDepositLine {
  const row = (raw ?? {}) as Record<string, unknown>;
  const vatAmount = normalizeOptionalAmount(row.vatAmount);
  const commissionAmount = normalizeOptionalAmount(row.commissionAmount);

  return {
    id: String(row.id ?? ""),
    depositDate: normalizeOptionalString(row.depositDate),
    itemName: normalizeOptionalString(row.itemName),
    amount: Math.max(0, Math.trunc(Number(row.amount) || 0)),
    ...(vatAmount != null ? { vatAmount } : {}),
    ...(commissionAmount != null ? { commissionAmount } : {}),
    orderNo: normalizeOptionalString(row.orderNo) || null,
    linkedSaleOrderId: normalizeOptionalString(row.linkedSaleOrderId) || null,
    memo: normalizeOptionalString(row.memo),
    bankId: normalizeBankId(row),
    bank: normalizeBankSummary(row.bank),
  };
}

function normalizeListMeta(
  meta: Partial<IncomeListMeta> | undefined,
  itemsLength: number,
  params?: { page?: number; limit?: number },
): IncomeListMeta {
  const requestedPage = params?.page ?? DEFAULT_PAGE;
  const requestedLimit = params?.limit ?? INCOME_API_GROUPS_PAGE_SIZE;
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

function buildListSearch(params?: IncomeListParams): string {
  const search = new URLSearchParams();
  search.set("page", String(params?.page ?? DEFAULT_PAGE));
  search.set("limit", String(params?.limit ?? INCOME_API_GROUPS_PAGE_SIZE));
  if (params?.month) search.set("month", params.month);
  if (params?.q?.trim()) search.set("q", params.q.trim());
  return search.toString();
}

function mapIncomeGroups(
  data: Record<string, unknown>[],
): Omit<IncomeListResult, "meta"> {
  const groups: IncomeDepositGroupRow[] = [];
  const lines: IncomeDepositLine[] = [];

  data.forEach((row) => {
    const depositDate = String(row.depositDate ?? "");
    const rawLines = Array.isArray(row.lines) ? row.lines : [];
    const normalizedLines = rawLines.map((item) =>
      normalizeIncomeLine(item),
    );
    groups.push({ depositDate, lines: normalizedLines });
    lines.push(...normalizedLines);
  });

  return { groups, lines };
}

export function toIncomeLinePayload(
  line: Omit<IncomeDepositLine, "id">,
): IncomeLinePayload {
  const bankId = purchaseBankIdForApi(line.bankId);
  const vatAmount =
    line.vatAmount != null ? Math.max(0, Math.trunc(line.vatAmount)) : undefined;
  const commissionAmount =
    line.commissionAmount != null
      ? Math.max(0, Math.trunc(line.commissionAmount))
      : undefined;
  const orderNo = line.orderNo?.trim();
  const linkedSaleOrderId = line.linkedSaleOrderId?.trim();

  return {
    depositDate: line.depositDate.trim(),
    itemName: line.itemName.trim(),
    amount: Math.max(0, Math.trunc(line.amount)),
    ...(bankId ? { bankId } : {}),
    ...(vatAmount != null ? { vatAmount } : {}),
    ...(commissionAmount != null ? { commissionAmount } : {}),
    ...(orderNo ? { orderNo } : {}),
    ...(linkedSaleOrderId ? { linkedSaleOrderId } : {}),
    memo: line.memo?.trim() || "",
  };
}

/** GET /api/v1/income */
export async function fetchIncomeList(
  params?: IncomeListParams,
): Promise<IncomeListResult> {
  const res = await apiFetch<
    ApiEnvelope<Record<string, unknown>[]> & {
      meta?: Partial<IncomeListMeta>;
    }
  >(`/income?${buildListSearch(params)}`);

  const data = (res.data ?? []) as Record<string, unknown>[];
  const mapped = mapIncomeGroups(data);

  return {
    ...mapped,
    meta: normalizeListMeta(res.meta, data.length, params),
  };
}

/** POST /api/v1/income */
export async function createIncomeLine(
  body: IncomeLinePayload,
): Promise<IncomeDepositLine> {
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>("/income", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return normalizeIncomeLine(res.data);
}

/** PATCH /api/v1/income/:id */
export async function updateIncomeLine(
  id: string,
  body: IncomeLinePayload,
): Promise<IncomeDepositLine> {
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>(
    `/income/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
  return normalizeIncomeLine(res.data);
}

/** DELETE /api/v1/income/:id */
export async function deleteIncomeLine(id: string): Promise<void> {
  await apiFetch<ApiEnvelope<{ ok?: boolean }>>(`/income/${id}`, {
    method: "DELETE",
  });
}
