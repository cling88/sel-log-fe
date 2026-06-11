"use client";

import { useSearchParams } from "next/navigation";
import {
  getTodayYearMonth,
  parseLedgerMonthFilter,
  toYearMonthParam,
  type LedgerListScope,
} from "@/lib/ledger-period";

/** URL `month=YYYY-MM` | `YYYY-all` (매입·매출·수익) */
export function useLedgerMonthScope(): LedgerListScope {
  const searchParams = useSearchParams();
  return parseLedgerMonthFilter(searchParams.get("month"));
}

/** @deprecated scopeKey만 필요하면 `useLedgerMonthScope().scopeKey` 사용 */
export function useLedgerMonthParam(): string {
  return useLedgerMonthScope().scopeKey;
}

export function useLedgerMonthYear(): number {
  return useLedgerMonthScope().year;
}

/** URL에 month 없을 때 이번 달로 보정 (전체 탭 기본 선택 아님) */
export function getDefaultLedgerMonthParam(): string {
  const { year, month } = getTodayYearMonth();
  return toYearMonthParam(year, month);
}
