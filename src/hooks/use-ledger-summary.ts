"use client";

import { useQuery, type QueryClient } from "@tanstack/react-query";
import { fetchLedgerSummary } from "@/lib/api/ledger";
import type { PeriodPreset } from "@/types/common";

export function ledgerSummaryQueryKey(period: PeriodPreset) {
  return ["ledger", "summary", period] as const;
}

export function useLedgerSummary(period: PeriodPreset) {
  return useQuery({
    queryKey: ledgerSummaryQueryKey(period),
    queryFn: () => fetchLedgerSummary(period),
    staleTime: 30_000,
  });
}

export function invalidateLedgerSummary(queryClient: QueryClient) {
  void queryClient.invalidateQueries({
    predicate: (query) =>
      query.queryKey[0] === "ledger" && query.queryKey[1] === "summary",
  });
}
