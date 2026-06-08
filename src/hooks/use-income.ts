"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import { invalidateLedgerEarliestMonth } from "@/hooks/use-ledger-earliest-month";
import { invalidateLedgerSummary } from "@/hooks/use-ledger-summary";
import { useLedgerMonthParam } from "@/hooks/use-ledger-month";
import {
  createIncomeLine,
  deleteIncomeLine,
  fetchIncomeList,
  getIncomeErrorMessage,
  INCOME_API_GROUPS_PAGE_SIZE,
  toIncomeLinePayload,
  updateIncomeLine,
} from "@/lib/api/income";
import type { IncomeDepositLine } from "@/types/income";

export const INCOME_QUERY_KEY = ["income"] as const;

function invalidateAllIncome(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: INCOME_QUERY_KEY });
  invalidateLedgerEarliestMonth(queryClient, { tab: "income" });
  invalidateLedgerSummary(queryClient);
}

export function incomeListQueryKey(month: string, q: string, page: number) {
  return [...INCOME_QUERY_KEY, month, q, page] as const;
}

export function useIncomeList(committedSearch: string, page: number) {
  const month = useLedgerMonthParam();
  const q = committedSearch.trim();
  const safePage = Math.max(1, page);

  return useQuery({
    queryKey: incomeListQueryKey(month, q, safePage),
    queryFn: () =>
      fetchIncomeList({
        month,
        ...(q ? { q } : {}),
        page: safePage,
        limit: INCOME_API_GROUPS_PAGE_SIZE,
      }),
  });
}

export function useCreateIncomeLine() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  return useMutation({
    mutationFn: (line: Omit<IncomeDepositLine, "id">) =>
      createIncomeLine(toIncomeLinePayload(line)),
    onSuccess: () => invalidateAllIncome(queryClient),
    onError: async (error) => {
      await alert(getIncomeErrorMessage(error));
    },
  });
}

export function useUpdateIncomeLine() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  return useMutation({
    mutationFn: ({
      id,
      line,
    }: {
      id: string;
      line: Omit<IncomeDepositLine, "id">;
    }) => updateIncomeLine(id, toIncomeLinePayload(line)),
    onSuccess: () => invalidateAllIncome(queryClient),
    onError: async (error) => {
      await alert(getIncomeErrorMessage(error));
    },
  });
}

export function useDeleteIncomeLine() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  return useMutation({
    mutationFn: (id: string) => deleteIncomeLine(id),
    onSuccess: () => invalidateAllIncome(queryClient),
    onError: async (error) => {
      await alert(getIncomeErrorMessage(error));
    },
  });
}
