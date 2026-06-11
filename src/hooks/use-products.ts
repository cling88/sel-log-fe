"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import { ApiError } from "@/lib/api-client";
import {
  adjustProductStock,
  applyProductToListCaches,
  createProduct,
  deleteProduct,
  fetchProduct,
  fetchProductHistoryTimeline,
  fetchProducts,
  mergeProductWithCachedDetail,
  PRODUCT_HISTORY_PAGE_SIZE,
  PRODUCTS_LIST_PAGE_SIZE,
  updateProduct,
  type ProductsListMeta,
  type StockAdjustRequest,
} from "@/lib/api/products";
import { toYearMonthParam } from "@/lib/ledger-period";
import type { ProductHistoryFilterId } from "@/lib/product-unified-history";
import type { ProductStockStatus } from "@/types/dashboard";
import type {
  InventoryProduct,
  InventoryProductInput,
  InventoryProductKind,
} from "@/types/inventory-product";

export const PRODUCTS_QUERY_KEY = ["products"] as const;

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.code === "PRODUCT_KIND_LOCKED") {
      return (
        error.message ||
        "매입·매출 이력이 있어 상품 유형을 변경할 수 없습니다."
      );
    }
    if (error.code === "PRODUCT_KIND_MISMATCH") {
      return error.message || "선택한 SKU의 상품 유형이 일치하지 않습니다.";
    }
    if (error.code === "SUPPLY_NOT_SALEABLE") {
      return error.message || "부가·소모품은 매출 품목으로 등록할 수 없습니다.";
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "요청에 실패했습니다.";
}

export function productsListQueryKey(
  q?: string,
  page = 1,
  stockStatus?: ProductStockStatus | null,
  productKind?: InventoryProductKind | null,
) {
  return [
    ...PRODUCTS_QUERY_KEY,
    "list",
    q?.trim() ?? "",
    page,
    stockStatus ?? "",
    productKind ?? "",
  ] as const;
}

export function productDetailQueryKey(id: string | null) {
  return [...PRODUCTS_QUERY_KEY, "detail", id] as const;
}

export function productHistoryQueryKey(
  productId: string | null,
  year: number,
  month: number,
  page: number,
  filter: ProductHistoryFilterId = "all",
) {
  return [
    ...PRODUCTS_QUERY_KEY,
    "history",
    productId,
    toYearMonthParam(year, month),
    page,
    filter,
  ] as const;
}

function invalidateProductHistoryQueries(
  queryClient: QueryClient,
  productId: string,
) {
  void queryClient.invalidateQueries({
    queryKey: [...PRODUCTS_QUERY_KEY, "history", productId],
  });
}

export function useProductsList(
  searchQuery?: string,
  page = 1,
  options?: {
    enabled?: boolean;
    stockStatus?: ProductStockStatus | null;
    productKind?: InventoryProductKind | null;
  },
) {
  const q = searchQuery?.trim() ?? "";
  const safePage = Math.max(1, page);
  const stockStatus = options?.stockStatus ?? null;
  const productKind = options?.productKind ?? null;
  return useQuery({
    queryKey: productsListQueryKey(q, safePage, stockStatus, productKind),
    queryFn: async () => {
      const result = await fetchProducts({
        ...(q ? { q } : {}),
        ...(stockStatus ? { stockStatus } : {}),
        ...(productKind ? { productKind } : {}),
        page: safePage,
        limit: PRODUCTS_LIST_PAGE_SIZE,
      });
      return result;
    },
    enabled: options?.enabled ?? true,
    select: (data) => data,
  });
}

function invalidateProductsQueries(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
}

/** 목록 데이터만 필요할 때 */
export function useProductsListItems(searchQuery?: string, page = 1) {
  const query = useProductsList(searchQuery, page);
  return {
    ...query,
    data: query.data?.items ?? [],
    meta: query.data?.meta as ProductsListMeta | undefined,
  };
}

export function useProductDetail(productId: string | null) {
  return useQuery({
    queryKey: productDetailQueryKey(productId),
    queryFn: () => fetchProduct(productId!),
    enabled: !!productId,
    staleTime: 30_000,
  });
}

export function useProductHistory(
  productId: string | null,
  year: number,
  month: number,
  page: number,
  currentStock: number,
  filter: ProductHistoryFilterId = "all",
  options?: { enabled?: boolean },
) {
  const monthParam = toYearMonthParam(year, month);
  const safePage = Math.max(1, page);

  return useQuery({
    queryKey: productHistoryQueryKey(
      productId,
      year,
      month,
      safePage,
      filter,
    ),
    queryFn: () =>
      fetchProductHistoryTimeline(productId!, {
        month: monthParam,
        page: safePage,
        limit: PRODUCT_HISTORY_PAGE_SIZE,
        currentStock,
        kind: filter,
      }),
    enabled: (options?.enabled ?? true) && !!productId,
    staleTime: 30_000,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  return useMutation({
    mutationFn: (input: InventoryProductInput) => createProduct(input),
    onSuccess: (created) => {
      invalidateProductsQueries(queryClient);
      invalidateProductHistoryQueries(queryClient, created.id);
      void queryClient.prefetchQuery({
        queryKey: productDetailQueryKey(created.id),
        queryFn: () => fetchProduct(created.id),
      });
      return created;
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: InventoryProductInput }) =>
      updateProduct(id, input),
    onSuccess: (updated) => {
      queryClient.setQueryData<InventoryProduct>(
        productDetailQueryKey(updated.id),
        (prev) => mergeProductWithCachedDetail(prev, updated),
      );
      applyProductToListCaches(queryClient, PRODUCTS_QUERY_KEY, updated);
      invalidateProductsQueries(queryClient);
      invalidateProductHistoryQueries(queryClient, updated.id);
      void queryClient.refetchQueries({
        queryKey: productDetailQueryKey(updated.id),
      });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: (_data, id) => {
      queryClient.removeQueries({ queryKey: productDetailQueryKey(id) });
      invalidateProductsQueries(queryClient);
    },
    onError: async (error) => {
      await alert(getErrorMessage(error));
    },
  });
}

export function useAdjustProductStock() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: StockAdjustRequest }) =>
      adjustProductStock(id, body),
    onSuccess: (updated, { id }) => {
      queryClient.setQueryData<InventoryProduct>(
        productDetailQueryKey(id),
        (prev) => mergeProductWithCachedDetail(prev, updated),
      );
      applyProductToListCaches(queryClient, PRODUCTS_QUERY_KEY, updated);
      invalidateProductsQueries(queryClient);
      invalidateProductHistoryQueries(queryClient, id);
      void queryClient.refetchQueries({ queryKey: productDetailQueryKey(id) });
      return updated;
    },
    onError: async (error) => {
      await alert(getErrorMessage(error));
    },
  });
}

export { getErrorMessage };
export type { InventoryProduct };
