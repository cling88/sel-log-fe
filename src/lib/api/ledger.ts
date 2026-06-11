import { ApiError, apiFetch, type ApiEnvelope } from "@/lib/api-client";
import { resolveLedgerMinYear } from "@/lib/ledger-period";
import type { PeriodPreset } from "@/types/common";

export type LedgerEarliestMonthTab = "purchase" | "sale" | "income";

export const LEDGER_MIN_YEAR_QUERY_KEY = ["ledger", "earliest-year"] as const;

export type LedgerEarliestMonth = {
  year: number;
  tab: LedgerEarliestMonthTab;
  month: string | null;
};

export type LedgerCumulativeExpense = {
  productTotal: number;
  supplyTotal: number;
  otherTotal: number;
  total: number;
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
  /** 기타지출 탭 전체 누적 (period 무관) — 레거시 */
  otherExpense: { total: number };
  /** 상품+부가+기타 전체 누적 (BE 권장) */
  cumulativeExpense?: LedgerCumulativeExpense;
  netTotal: number;
};

function num(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function normalizeLedgerSummary(raw: Record<string, unknown>): LedgerSummary {
  const purchase = (raw.purchase ?? {}) as Record<string, unknown>;
  const sale = (raw.sale ?? {}) as Record<string, unknown>;
  const income = (raw.income ?? {}) as Record<string, unknown>;
  const otherExpense = (raw.otherExpense ?? {}) as Record<string, unknown>;
  const cumulativeRaw = raw.cumulativeExpense as Record<string, unknown> | undefined;

  const cumulativeExpense =
    cumulativeRaw && typeof cumulativeRaw === "object"
      ? {
          productTotal: num(cumulativeRaw.productTotal),
          supplyTotal: num(cumulativeRaw.supplyTotal),
          otherTotal: num(cumulativeRaw.otherTotal),
          total: num(cumulativeRaw.total),
        }
      : undefined;

  return {
    period: (raw.period as PeriodPreset) ?? "all",
    purchase: {
      productTotal: num(purchase.productTotal),
      supplyTotal: num(purchase.supplyTotal),
      total: num(purchase.total),
      count: num(purchase.count),
    },
    sale: {
      normalTotal: num(sale.normalTotal),
      normalCount: num(sale.normalCount),
    },
    income: {
      total: num(income.total),
      count: num(income.count),
    },
    otherExpense: { total: num(otherExpense.total) },
    ...(cumulativeExpense ? { cumulativeExpense } : {}),
    netTotal: num(raw.netTotal),
  };
}

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
  const res = await apiFetch<ApiEnvelope<Record<string, unknown>>>(
    `/ledger/summary?${search}`,
  );
  return normalizeLedgerSummary(res.data ?? {});
}

/** GET /api/v1/ledger/earliest-year */
export async function fetchLedgerEarliestYear(): Promise<number> {
  const res = await apiFetch<ApiEnvelope<{ year: number | null }>>(
    "/ledger/earliest-year",
  );
  return resolveLedgerMinYear(res.data?.year ?? null);
}

/**
 * GET /api/v1/ledger/earliest-month
 * @param year 생략 시 전체 기간 최초 월
 */
export async function fetchLedgerEarliestMonth(
  tab: LedgerEarliestMonthTab,
  year?: number,
): Promise<LedgerEarliestMonth> {
  const search = new URLSearchParams({ tab });
  if (year != null) {
    search.set("year", String(year));
  }
  const res = await apiFetch<ApiEnvelope<LedgerEarliestMonth>>(
    `/ledger/earliest-month?${search}`,
  );
  return res.data;
}
