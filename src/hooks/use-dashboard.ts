"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchDashboardOverview,
  fetchLedgerMonthlyTotals,
  fetchMonthlyReview,
  fetchSaleIncomeReconciliation,
  getDashboardErrorMessage,
} from "@/lib/api/dashboard";

export function dashboardOverviewQueryKey(month: string) {
  return ["dashboard", "overview", month] as const;
}

export function useDashboardOverview(month: string) {
  return useQuery({
    queryKey: dashboardOverviewQueryKey(month),
    queryFn: () => fetchDashboardOverview(month),
    enabled: !!month,
  });
}

export function monthlyReviewQueryKey(month: string) {
  return ["ledger", "monthly-review", month] as const;
}

export function useMonthlyReview(month: string) {
  return useQuery({
    queryKey: monthlyReviewQueryKey(month),
    queryFn: () => fetchMonthlyReview(month),
    enabled: !!month,
  });
}

export function saleIncomeReconciliationQueryKey(
  month: string,
  channelId?: string,
) {
  return ["reconciliation", "sale-income", month, channelId ?? ""] as const;
}

export function useSaleIncomeReconciliation(month: string, channelId?: string) {
  return useQuery({
    queryKey: saleIncomeReconciliationQueryKey(month, channelId),
    queryFn: () => fetchSaleIncomeReconciliation(month, channelId),
    enabled: !!month,
  });
}

export function ledgerMonthlyTotalsQueryKey(month: string) {
  return ["ledger", "monthly-totals", month] as const;
}

export function useLedgerMonthlyTotals(month: string, enabled = true) {
  return useQuery({
    queryKey: ledgerMonthlyTotalsQueryKey(month),
    queryFn: () => fetchLedgerMonthlyTotals(month),
    enabled: enabled && !!month,
  });
}

export { getDashboardErrorMessage };
