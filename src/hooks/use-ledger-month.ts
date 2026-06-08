"use client";

import { useSearchParams } from "next/navigation";
import { getTodayYearMonth, parseYearMonth, toYearMonthParam } from "@/lib/ledger-period";

/** URL `month=YYYY-MM` (매입·매출·수익). 없으면 이번 달 */
export function useLedgerMonthParam(): string {
  const searchParams = useSearchParams();
  const monthParam = searchParams.get("month");
  const parsed = parseYearMonth(monthParam);
  if (parsed) return toYearMonthParam(parsed.year, parsed.month);
  const { year, month } = getTodayYearMonth();
  return toYearMonthParam(year, month);
}
