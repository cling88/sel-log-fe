"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import {
  createSalesChannel,
  deleteSalesChannel,
  fetchSalesChannels,
  getSalesChannelErrorMessage,
  updateSalesChannel,
} from "@/lib/api/sales-channels";
import type { SalesChannelInput } from "@/types/sale-channel";

export const SALES_CHANNELS_QUERY_KEY = ["sales-channels"] as const;

export function useSalesChannels() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  const query = useQuery({
    queryKey: SALES_CHANNELS_QUERY_KEY,
    queryFn: fetchSalesChannels,
  });

  const createMutation = useMutation({
    mutationFn: (body: SalesChannelInput) => createSalesChannel(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SALES_CHANNELS_QUERY_KEY });
    },
    onError: async (error) => {
      await alert(getSalesChannelErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: SalesChannelInput }) =>
      updateSalesChannel(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SALES_CHANNELS_QUERY_KEY });
    },
    onError: async (error) => {
      await alert(getSalesChannelErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSalesChannel(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SALES_CHANNELS_QUERY_KEY });
    },
    onError: async (error) => {
      await alert(getSalesChannelErrorMessage(error));
    },
  });

  return {
    channels: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    errorMessage: query.isError ? getSalesChannelErrorMessage(query.error) : null,
    refetch: query.refetch,
    createChannel: createMutation.mutateAsync,
    updateChannel: (id: string, body: SalesChannelInput) =>
      updateMutation.mutateAsync({ id, body }),
    deleteChannel: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
