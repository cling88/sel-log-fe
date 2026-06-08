"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import {
  createBank,
  deleteBank,
  fetchBanks,
  getBankErrorMessage,
  updateBank,
} from "@/lib/api/banks";
import type { BankAccountInput } from "@/types/bank-account";

export const BANKS_QUERY_KEY = ["banks"] as const;

function getErrorMessage(error: unknown): string {
  return getBankErrorMessage(error);
}

export function useBanks() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  const query = useQuery({
    queryKey: BANKS_QUERY_KEY,
    queryFn: fetchBanks,
  });

  const createMutation = useMutation({
    mutationFn: (body: BankAccountInput) => createBank(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BANKS_QUERY_KEY });
    },
    onError: async (error) => {
      await alert(getErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: BankAccountInput }) =>
      updateBank(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BANKS_QUERY_KEY });
    },
    onError: async (error) => {
      await alert(getErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBank(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BANKS_QUERY_KEY });
    },
    onError: async (error) => {
      await alert(getErrorMessage(error));
    },
  });

  return {
    banks: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    errorMessage: query.isError ? getErrorMessage(query.error) : null,
    refetch: query.refetch,
    createBank: createMutation.mutateAsync,
    updateBank: (id: string, body: BankAccountInput) =>
      updateMutation.mutateAsync({ id, body }),
    deleteBank: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
