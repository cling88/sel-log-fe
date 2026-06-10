"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import { SOURCING_CHANNELS_QUERY_KEY } from "@/hooks/use-sourcing-channels";
import {
  createSourcingProduct,
  deleteSourcingProduct,
  fetchSourcingProducts,
  getSourcingProductErrorMessage,
  updateSourcingProduct,
  type SourcingProductsListResult,
} from "@/lib/api/sourcing-products";
import { SOURCING_PAGE_SIZE } from "@/lib/sourcing-url";
import type { CreateSourcingProductBody } from "@/types/sourcing";

export const SOURCING_PRODUCTS_QUERY_KEY = ["sourcing-products"] as const;

export function sourcingProductsListQueryKey(q: string, page: number) {
  return [...SOURCING_PRODUCTS_QUERY_KEY, "list", q, page] as const;
}

function invalidateSourcingProducts(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: SOURCING_PRODUCTS_QUERY_KEY });
}

export function useSourcingProductsList(searchQuery: string, page: number) {
  const q = searchQuery.trim();
  const safePage = Math.max(1, page);

  const query = useQuery({
    queryKey: sourcingProductsListQueryKey(q, safePage),
    queryFn: (): Promise<SourcingProductsListResult> =>
      fetchSourcingProducts({
        ...(q ? { q } : {}),
        page: safePage,
        limit: SOURCING_PAGE_SIZE,
      }),
  });

  const meta = query.data?.meta;
  const totalPages = meta
    ? Math.max(1, Math.ceil(meta.total / meta.limit))
    : 1;

  return {
    products: query.data?.items ?? [],
    meta,
    totalPages,
    safePage: meta?.page ?? safePage,
    isLoading: query.isLoading,
    isError: query.isError,
    errorMessage: query.isError
      ? getSourcingProductErrorMessage(query.error)
      : null,
    refetch: query.refetch,
  };
}

export function useSourcingProductMutations() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  const invalidateAll = () => {
    invalidateSourcingProducts(queryClient);
    void queryClient.invalidateQueries({ queryKey: SOURCING_CHANNELS_QUERY_KEY });
  };

  const createMutation = useMutation({
    mutationFn: (body: CreateSourcingProductBody) => createSourcingProduct(body),
    onSuccess: invalidateAll,
    onError: async (error) => {
      await alert(getSourcingProductErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: CreateSourcingProductBody }) =>
      updateSourcingProduct(id, body),
    onSuccess: invalidateAll,
    onError: async (error) => {
      await alert(getSourcingProductErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSourcingProduct(id),
    onSuccess: invalidateAll,
    onError: async (error) => {
      await alert(getSourcingProductErrorMessage(error));
    },
  });

  return {
    createProduct: createMutation.mutateAsync,
    updateProduct: (id: string, body: CreateSourcingProductBody) =>
      updateMutation.mutateAsync({ id, body }),
    deleteProduct: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export { getSourcingProductErrorMessage };
