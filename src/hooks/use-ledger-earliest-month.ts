"use client";

import {
  useQuery,
  type QueryClient,
} from "@tanstack/react-query";
import {
  fetchLedgerEarliestMonth,
  LEDGER_MIN_YEAR_QUERY_KEY,
  type LedgerEarliestMonthTab,
} from "@/lib/api/ledger";

export function ledgerEarliestMonthQueryKey(
  year: number,
  tab: LedgerEarliestMonthTab,
) {
  return ["ledger", "earliest-month", year, tab] as const;
}

export function invalidateLedgerEarliestMonth(
  queryClient: QueryClient,
  options?: { tab?: LedgerEarliestMonthTab; year?: number },
) {
  const tab = options?.tab ?? "purchase";

  if (options?.year != null) {
    void queryClient.invalidateQueries({
      queryKey: ledgerEarliestMonthQueryKey(options.year, tab),
    });
    return;
  }

  void queryClient.invalidateQueries({
    predicate: (query) =>
      query.queryKey[0] === "ledger" &&
      query.queryKey[1] === "earliest-month" &&
      query.queryKey[3] === tab,
  });
  void queryClient.invalidateQueries({ queryKey: LEDGER_MIN_YEAR_QUERY_KEY });
}

export function useLedgerEarliestMonth(
  year: number,
  tab: LedgerEarliestMonthTab | null,
) {
  return useQuery({
    queryKey: ledgerEarliestMonthQueryKey(year, tab ?? "purchase"),
    queryFn: () => fetchLedgerEarliestMonth(tab!, year),
    enabled: tab != null,
    staleTime: 60_000,
  });
}
