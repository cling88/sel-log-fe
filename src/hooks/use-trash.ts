"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import {
  fetchTrashSummary,
  getTrashErrorMessage,
  purgeTrash,
} from "@/lib/api/settings";
import { UNUSED_IMAGES_QUERY_KEY } from "@/hooks/use-unused-images";
import { EMPTY_TRASH_SUMMARY } from "@/types/settings";

export const TRASH_QUERY_KEY = ["settings", "trash"] as const;

export function useTrash() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  const query = useQuery({
    queryKey: TRASH_QUERY_KEY,
    queryFn: fetchTrashSummary,
  });

  const purgeMutation = useMutation({
    mutationFn: () => purgeTrash(),
    onSuccess: async (result) => {
      queryClient.setQueryData(TRASH_QUERY_KEY, EMPTY_TRASH_SUMMARY);
      await queryClient.invalidateQueries({ queryKey: TRASH_QUERY_KEY });
      await queryClient.invalidateQueries({ queryKey: UNUSED_IMAGES_QUERY_KEY });
      await alert(`레거시 데이터 ${result.total}건을 삭제했습니다.`);
    },
    onError: async (error) => {
      await alert(getTrashErrorMessage(error));
    },
  });

  return {
    summary: query.data ?? EMPTY_TRASH_SUMMARY,
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    errorMessage: query.isError ? getTrashErrorMessage(query.error) : null,
    refetch: query.refetch,
    purge: purgeMutation.mutateAsync,
    isPurging: purgeMutation.isPending,
  };
}
