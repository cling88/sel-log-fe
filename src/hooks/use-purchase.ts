"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import {
  cancelProductPurchaseStockReflect,
  cancelSupplyStockReflect,
  createOtherExpenseLine,
  createProductPurchaseLine,
  createSupplyExpenseLine,
  deleteOtherExpenseLine,
  deleteProductPurchaseLine,
  deleteSupplyExpenseLine,
  fetchOtherExpenseList,
  fetchProductPurchaseList,
  fetchSupplyExpenseList,
  getPurchaseErrorMessage,
  patchPurchaseGroup,
  patchPurchaseGroupCancel,
  PURCHASE_API_GROUPS_PAGE_SIZE,
  reflectProductPurchaseStock,
  reflectSupplyStock,
  toOtherLinePayload,
  toProductPurchaseLinePayload,
  toSupplyLinePayload,
  updateOtherExpenseLine,
  updateProductPurchaseLine,
  updateSupplyExpenseLine,
  type PatchPurchaseGroupBody,
  type ProductPurchaseLinePayload,
  type StockReflectPayload,
} from "@/lib/api/purchase";
import { PRODUCTS_QUERY_KEY } from "@/hooks/use-products";
import { invalidateLedgerEarliestMonth } from "@/hooks/use-ledger-earliest-month";
import { invalidateLedgerSummary } from "@/hooks/use-ledger-summary";
import { useLedgerMonthParam } from "@/hooks/use-ledger-month";
import type { OtherExpenseLine } from "@/types/purchase-other";
import type { ProductPurchaseLine } from "@/types/purchase-product";
import type { SupplyExpenseLine } from "@/types/purchase-supply";

export const PURCHASE_QUERY_KEY = ["purchase"] as const;

function invalidateAllPurchase(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: PURCHASE_QUERY_KEY });
  invalidateLedgerEarliestMonth(queryClient, { tab: "purchase" });
  invalidateLedgerSummary(queryClient);
}

export function productPurchaseListQueryKey(
  month: string,
  q: string,
  page: number,
) {
  return [...PURCHASE_QUERY_KEY, "products", month, q, page] as const;
}

export function supplyListQueryKey(month: string, q: string, page: number) {
  return [...PURCHASE_QUERY_KEY, "supply", month, q, page] as const;
}

export function otherListQueryKey(month: string, q: string, page: number) {
  return [...PURCHASE_QUERY_KEY, "other", month, q, page] as const;
}

export function useProductPurchaseList(
  committedSearch: string,
  page: number,
) {
  const month = useLedgerMonthParam();
  const q = committedSearch.trim();
  const safePage = Math.max(1, page);

  return useQuery({
    queryKey: productPurchaseListQueryKey(month, q, safePage),
    queryFn: () =>
      fetchProductPurchaseList({
        month,
        ...(q ? { q } : {}),
        page: safePage,
        limit: PURCHASE_API_GROUPS_PAGE_SIZE,
      }),
  });
}

export function useSupplyExpenseList(committedSearch: string, page: number) {
  const month = useLedgerMonthParam();
  const q = committedSearch.trim();
  const safePage = Math.max(1, page);

  return useQuery({
    queryKey: supplyListQueryKey(month, q, safePage),
    queryFn: () =>
      fetchSupplyExpenseList({
        month,
        ...(q ? { q } : {}),
        page: safePage,
        limit: PURCHASE_API_GROUPS_PAGE_SIZE,
      }),
  });
}

export function useOtherExpenseList(committedSearch: string, page: number) {
  const month = useLedgerMonthParam();
  const q = committedSearch.trim();
  const safePage = Math.max(1, page);

  return useQuery({
    queryKey: otherListQueryKey(month, q, safePage),
    queryFn: () =>
      fetchOtherExpenseList({
        month,
        ...(q ? { q } : {}),
        page: safePage,
        limit: PURCHASE_API_GROUPS_PAGE_SIZE,
      }),
  });
}

export function useCreateProductPurchaseLine() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  return useMutation({
    mutationFn: (body: ProductPurchaseLinePayload) =>
      createProductPurchaseLine(body),
    onSuccess: () => invalidateAllPurchase(queryClient),
    onError: async (e) => alert(getPurchaseErrorMessage(e)),
  });
}

export function useUpdateProductPurchaseLine() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: ProductPurchaseLinePayload;
    }) => updateProductPurchaseLine(id, body),
    onSuccess: () => invalidateAllPurchase(queryClient),
    onError: async (e) => alert(getPurchaseErrorMessage(e)),
  });
}

export function useDeleteProductPurchaseLine() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  return useMutation({
    mutationFn: (id: string) => deleteProductPurchaseLine(id),
    onSuccess: () => invalidateAllPurchase(queryClient),
    onError: async (e) => alert(getPurchaseErrorMessage(e)),
  });
}

export function useReflectProductPurchaseStock() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: StockReflectPayload }) =>
      reflectProductPurchaseStock(id, body),
    onSuccess: () => {
      invalidateAllPurchase(queryClient);
      void queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
    onError: async (e) => alert(getPurchaseErrorMessage(e)),
  });
}

export function useCancelProductPurchaseStockReflect() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  return useMutation({
    mutationFn: (id: string) => cancelProductPurchaseStockReflect(id),
    onSuccess: () => {
      invalidateAllPurchase(queryClient);
      void queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
    onError: async (e) => alert(getPurchaseErrorMessage(e)),
  });
}

export function usePatchPurchaseGroup() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  return useMutation({
    mutationFn: (body: PatchPurchaseGroupBody) => patchPurchaseGroup(body),
    onSuccess: () => invalidateAllPurchase(queryClient),
    onError: async (e) => alert(getPurchaseErrorMessage(e)),
  });
}

export function usePatchPurchaseGroupCancel() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  return useMutation({
    mutationFn: ({
      paymentDate,
      orderCancelled,
    }: {
      paymentDate: string;
      orderCancelled: boolean;
    }) => patchPurchaseGroupCancel(paymentDate, orderCancelled),
    onSuccess: () => invalidateAllPurchase(queryClient),
    onError: async (e) => alert(getPurchaseErrorMessage(e)),
  });
}

export function useCreateSupplyExpenseLine() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  return useMutation({
    mutationFn: (body: Parameters<typeof createSupplyExpenseLine>[0]) =>
      createSupplyExpenseLine(body),
    onSuccess: () => invalidateAllPurchase(queryClient),
    onError: async (e) => alert(getPurchaseErrorMessage(e)),
  });
}

export function useUpdateSupplyExpenseLine() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  return useMutation({
    mutationFn: ({
      id,
      line,
    }: {
      id: string;
      line: Omit<SupplyExpenseLine, "id" | "stockReflected">;
    }) => updateSupplyExpenseLine(id, toSupplyLinePayload(line)),
    onSuccess: () => invalidateAllPurchase(queryClient),
    onError: async (e) => alert(getPurchaseErrorMessage(e)),
  });
}

export function useDeleteSupplyExpenseLine() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  return useMutation({
    mutationFn: (id: string) => deleteSupplyExpenseLine(id),
    onSuccess: () => invalidateAllPurchase(queryClient),
    onError: async (e) => alert(getPurchaseErrorMessage(e)),
  });
}

export function useReflectSupplyStock() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: StockReflectPayload }) =>
      reflectSupplyStock(id, body),
    onSuccess: () => {
      invalidateAllPurchase(queryClient);
      void queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
    onError: async (e) => alert(getPurchaseErrorMessage(e)),
  });
}

export function useCancelSupplyStockReflect() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  return useMutation({
    mutationFn: (id: string) => cancelSupplyStockReflect(id),
    onSuccess: () => {
      invalidateAllPurchase(queryClient);
      void queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    },
    onError: async (e) => alert(getPurchaseErrorMessage(e)),
  });
}

export function useCreateOtherExpenseLine() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  return useMutation({
    mutationFn: (line: Omit<OtherExpenseLine, "id">) =>
      createOtherExpenseLine(toOtherLinePayload(line)),
    onSuccess: () => invalidateAllPurchase(queryClient),
    onError: async (e) => alert(getPurchaseErrorMessage(e)),
  });
}

export function useUpdateOtherExpenseLine() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  return useMutation({
    mutationFn: ({
      id,
      line,
    }: {
      id: string;
      line: Omit<OtherExpenseLine, "id">;
    }) => updateOtherExpenseLine(id, toOtherLinePayload(line)),
    onSuccess: () => invalidateAllPurchase(queryClient),
    onError: async (e) => alert(getPurchaseErrorMessage(e)),
  });
}

export function useDeleteOtherExpenseLine() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  return useMutation({
    mutationFn: (id: string) => deleteOtherExpenseLine(id),
    onSuccess: () => invalidateAllPurchase(queryClient),
    onError: async (e) => alert(getPurchaseErrorMessage(e)),
  });
}

export { getPurchaseErrorMessage };

export function linePayloadFromProductPurchase(
  line: Omit<ProductPurchaseLine, "id" | "stockReflected">,
) {
  return toProductPurchaseLinePayload(line);
}
