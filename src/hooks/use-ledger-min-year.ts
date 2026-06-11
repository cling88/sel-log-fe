"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchLedgerEarliestYear,
  LEDGER_MIN_YEAR_QUERY_KEY,
} from "@/lib/api/ledger";

export function useLedgerMinYear(enabled = true) {
  return useQuery({
    queryKey: LEDGER_MIN_YEAR_QUERY_KEY,
    queryFn: fetchLedgerEarliestYear,
    enabled,
    staleTime: 5 * 60_000,
  });
}
