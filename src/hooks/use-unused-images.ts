"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import {
  fetchUnusedImagesCount,
  getUnusedImagesErrorMessage,
  isR2NotConfiguredError,
  purgeUnusedImages,
} from "@/lib/api/settings";

export const UNUSED_IMAGES_QUERY_KEY = ["settings", "unused-images"] as const;

export function useUnusedImages() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  const query = useQuery({
    queryKey: UNUSED_IMAGES_QUERY_KEY,
    queryFn: fetchUnusedImagesCount,
    retry: (failureCount, error) => {
      if (isR2NotConfiguredError(error)) return false;
      return failureCount < 2;
    },
  });

  const r2NotConfigured =
    query.isError && isR2NotConfiguredError(query.error);

  const purgeMutation = useMutation({
    mutationFn: purgeUnusedImages,
    onSuccess: async (result) => {
      queryClient.setQueryData(UNUSED_IMAGES_QUERY_KEY, { count: 0 });
      await queryClient.invalidateQueries({ queryKey: UNUSED_IMAGES_QUERY_KEY });
      await alert(`${result.deletedCount}개 이미지를 삭제했습니다.`);
    },
    onError: async (error) => {
      await alert(getUnusedImagesErrorMessage(error));
    },
  });

  return {
    count: query.data?.count ?? 0,
    isLoading: query.isLoading,
    isError: query.isError && !r2NotConfigured,
    errorMessage:
      query.isError && !r2NotConfigured
        ? getUnusedImagesErrorMessage(query.error)
        : null,
    r2NotConfigured,
    refetch: query.refetch,
    purge: purgeMutation.mutateAsync,
    isPurging: purgeMutation.isPending,
  };
}
