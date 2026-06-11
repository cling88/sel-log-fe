"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import { invalidateLedgerEarliestMonth } from "@/hooks/use-ledger-earliest-month";
import { invalidateLedgerSummary } from "@/hooks/use-ledger-summary";
import { useLedgerMonthScope } from "@/hooks/use-ledger-month";
import { toLedgerListApiScope } from "@/lib/ledger-period";
import { PRODUCTS_QUERY_KEY } from "@/hooks/use-products";
import {
  createSaleOrder,
  deleteSaleOrder,
  fetchSaleOrders,
  getSaleErrorMessage,
  patchSaleOrderCancel,
  SALES_API_PAGE_SIZE,
  updateSaleOrder,
  type SaleOrderPayload,
} from "@/lib/api/sales";

export const SALES_QUERY_KEY = ["sales"] as const;

function invalidateAllSales(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: SALES_QUERY_KEY });
  invalidateLedgerEarliestMonth(queryClient, { tab: "sale" });
  invalidateLedgerSummary(queryClient);
  void queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
}

export function saleListQueryKey(month: string, q: string, page: number) {
  return [...SALES_QUERY_KEY, "list", month, q, page] as const;
}

export function useSaleOrderList(committedSearch: string, page: number) {
  const scope = useLedgerMonthScope();
  const q = committedSearch.trim();
  const safePage = Math.max(1, page);

  return useQuery({
    queryKey: saleListQueryKey(scope.scopeKey, q, safePage),
    queryFn: () =>
      fetchSaleOrders({
        ...toLedgerListApiScope(scope),
        ...(q ? { q } : {}),
        page: safePage,
        limit: SALES_API_PAGE_SIZE,
      }),
  });
}

export function useCreateSaleOrder() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  return useMutation({
    mutationFn: (body: SaleOrderPayload) => createSaleOrder(body),
    onSuccess: () => invalidateAllSales(queryClient),
    onError: async (e) => alert(getSaleErrorMessage(e)),
  });
}

export function useUpdateSaleOrder() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: SaleOrderPayload }) =>
      updateSaleOrder(id, body),
    onSuccess: () => invalidateAllSales(queryClient),
    onError: async (e) => alert(getSaleErrorMessage(e)),
  });
}

export function usePatchSaleOrderCancel() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  return useMutation({
    mutationFn: ({ id, cancel }: { id: string; cancel: boolean }) =>
      patchSaleOrderCancel(id, cancel),
    onSuccess: () => invalidateAllSales(queryClient),
    onError: async (e) => alert(getSaleErrorMessage(e)),
  });
}

export function useDeleteSaleOrder() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  return useMutation({
    mutationFn: (id: string) => deleteSaleOrder(id),
    onSuccess: () => invalidateAllSales(queryClient),
    onError: async (e) => alert(getSaleErrorMessage(e)),
  });
}

export { getSaleErrorMessage, SALES_API_PAGE_SIZE };
