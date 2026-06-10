"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import {
  addSourcingProductFavorite,
  fetchSourcingProductFavorites,
  getSourcingProductErrorMessage,
  removeSourcingProductFavorite,
} from "@/lib/api/sourcing-products";
import { isFavoriteLimitReachedError } from "@/lib/sourcing-favorites";

export const SOURCING_PRODUCT_FAVORITES_QUERY_KEY = [
  "sourcing-products",
  "favorites",
] as const;

export function useSourcingProductFavorites() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  const query = useQuery({
    queryKey: SOURCING_PRODUCT_FAVORITES_QUERY_KEY,
    queryFn: fetchSourcingProductFavorites,
  });

  const favoriteIds = useMemo(
    () => new Set((query.data ?? []).map((product) => product.id)),
    [query.data],
  );

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite: boolean }) => {
      if (isFavorite) {
        await removeSourcingProductFavorite(id);
        return;
      }
      await addSourcingProductFavorite(id);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: SOURCING_PRODUCT_FAVORITES_QUERY_KEY,
      });
    },
    onError: async (error) => {
      if (isFavoriteLimitReachedError(error)) {
        await alert("즐겨찾기는 최대 20개까지 등록할 수 있습니다.");
        return;
      }
      await alert(getSourcingProductErrorMessage(error));
    },
  });

  return {
    favorites: query.data ?? [],
    favoriteIds,
    isFavorite: (id: string) => favoriteIds.has(id),
    toggleFavorite: (id: string, isFavorite: boolean) =>
      toggleMutation.mutateAsync({ id, isFavorite }),
    isLoading: query.isLoading,
    isToggling: toggleMutation.isPending,
    togglingId: toggleMutation.isPending ? toggleMutation.variables?.id : null,
  };
}
