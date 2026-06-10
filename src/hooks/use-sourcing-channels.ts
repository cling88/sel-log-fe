"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import {
  createSourcingChannel,
  deleteSourcingChannel,
  fetchSourcingChannels,
  getSourcingChannelErrorMessage,
  isDuplicateSourcingChannelError,
  SOURCING_CHANNELS_PICKER_LIMIT,
  updateSourcingChannel,
  type SourcingListMeta,
} from "@/lib/api/sourcing-channels";
import { SOURCING_CHANNEL_FAVORITES_QUERY_KEY } from "@/hooks/use-sourcing-channel-favorites";
import { isChannelHasProductsError } from "@/lib/sourcing-channel-delete";
import { SOURCING_PAGE_SIZE } from "@/lib/sourcing-url";
import type { CreateSourcingChannelBody } from "@/types/sourcing";

export const SOURCING_CHANNELS_QUERY_KEY = ["sourcing-channels"] as const;

export function sourcingChannelsListQueryKey(q: string, page: number) {
  return [...SOURCING_CHANNELS_QUERY_KEY, "list", q, page] as const;
}

export function sourcingChannelsPickerQueryKey() {
  return [...SOURCING_CHANNELS_QUERY_KEY, "picker"] as const;
}

function invalidateSourcingChannels(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: SOURCING_CHANNELS_QUERY_KEY });
  void queryClient.invalidateQueries({
    queryKey: SOURCING_CHANNEL_FAVORITES_QUERY_KEY,
  });
}

export function useSourcingChannelsList(searchQuery: string, page: number) {
  const q = searchQuery.trim();
  const safePage = Math.max(1, page);

  const query = useQuery({
    queryKey: sourcingChannelsListQueryKey(q, safePage),
    queryFn: () =>
      fetchSourcingChannels({
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
    channels: query.data?.items ?? [],
    meta: meta as SourcingListMeta | undefined,
    totalPages,
    safePage: meta?.page ?? safePage,
    isLoading: query.isLoading,
    isError: query.isError,
    errorMessage: query.isError
      ? getSourcingChannelErrorMessage(query.error)
      : null,
    refetch: query.refetch,
  };
}

export function useSourcingChannelsPicker() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  const query = useQuery({
    queryKey: sourcingChannelsPickerQueryKey(),
    queryFn: () =>
      fetchSourcingChannels({ page: 1, limit: SOURCING_CHANNELS_PICKER_LIMIT }),
  });

  const createMutation = useMutation({
    mutationFn: (body: CreateSourcingChannelBody) => createSourcingChannel(body),
    onSuccess: () => invalidateSourcingChannels(queryClient),
    onError: async (error) => {
      await alert(getSourcingChannelErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: CreateSourcingChannelBody }) =>
      updateSourcingChannel(id, body),
    onSuccess: () => invalidateSourcingChannels(queryClient),
    onError: async (error) => {
      await alert(getSourcingChannelErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSourcingChannel(id),
    onSuccess: () => invalidateSourcingChannels(queryClient),
    onError: async (error) => {
      if (isChannelHasProductsError(error)) return;
      await alert(getSourcingChannelErrorMessage(error));
    },
  });

  const channels = query.data?.items ?? [];
  const productCountByChannelId = (channelId: string) =>
    channels.find((ch) => ch.id === channelId)?.productCount ?? 0;

  return {
    channels,
    isLoading: query.isLoading,
    productCountByChannelId,
    createChannel: createMutation.mutateAsync,
    updateChannel: (id: string, body: CreateSourcingChannelBody) =>
      updateMutation.mutateAsync({ id, body }),
    deleteChannel: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useSourcingChannelMutations() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  const createMutation = useMutation({
    mutationFn: (body: CreateSourcingChannelBody) => createSourcingChannel(body),
    onSuccess: () => invalidateSourcingChannels(queryClient),
    onError: async (error) => {
      await alert(getSourcingChannelErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: CreateSourcingChannelBody }) =>
      updateSourcingChannel(id, body),
    onSuccess: () => invalidateSourcingChannels(queryClient),
    onError: async (error) => {
      await alert(getSourcingChannelErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteSourcingChannel(id),
    onSuccess: () => invalidateSourcingChannels(queryClient),
    onError: async (error) => {
      if (isChannelHasProductsError(error)) return;
      await alert(getSourcingChannelErrorMessage(error));
    },
  });

  return {
    createChannel: createMutation.mutateAsync,
    updateChannel: (id: string, body: CreateSourcingChannelBody) =>
      updateMutation.mutateAsync({ id, body }),
    deleteChannel: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export {
  getSourcingChannelErrorMessage,
  isDuplicateSourcingChannelError,
};
