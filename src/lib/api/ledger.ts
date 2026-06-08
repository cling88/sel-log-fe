import { ApiError, apiFetch, type ApiEnvelope } from "@/lib/api-client";
import type { PeriodPreset } from "@/types/common";

export type LedgerEarliestMonthTab = "purchase" | "sale" | "income";

export type LedgerEarliestMonth = {
  year: number;
  tab: LedgerEarliestMonthTab;
  month: string | null;
};

export type LedgerSummary = {
  period: PeriodPreset;
  purchase: {
    productTotal: number;
    supplyTotal: number;
    total: number;
    count: number;
  };
  sale: { normalTotal: number; normalCount: number };
  income: { total: number; count: number };
  otherExpense: { total: number };
  netTotal: number;
};

export function getLedgerErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "장부 요청에 실패했습니다.";
}

/** GET /api/v1/ledger/summary */
export async function fetchLedgerSummary(
  period: PeriodPreset = "all",
): Promise<LedgerSummary> {
  const search = new URLSearchParams({ period });
  const res = await apiFetch<ApiEnvelope<LedgerSummary>>(
    `/ledger/summary?${search}`,
  );
  return res.data;
}

/** GET /api/v1/ledger/earliest-month */
export async function fetchLedgerEarliestMonth(
  year: number,
  tab: LedgerEarliestMonthTab,
): Promise<LedgerEarliestMonth> {
  const search = new URLSearchParams({
    year: String(year),
    tab,
  });
  const res = await apiFetch<ApiEnvelope<LedgerEarliestMonth>>(
    `/ledger/earliest-month?${search}`,
  );
  return res.data;
}
