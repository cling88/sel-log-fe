"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useSyncExternalStore } from "react";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import {
  createVendor,
  deleteVendor,
  fetchVendors,
  getVendorErrorMessage,
  updateVendor,
} from "@/lib/api/vendors";
import {
  getVendorsSnapshot,
  getVendorsVersion,
  localCreateVendor,
  localDeleteVendor,
  localUpdateVendor,
  subscribeVendors,
} from "@/lib/vendor-local-store";
import type { VendorInput } from "@/types/vendor";

export const VENDORS_QUERY_KEY = ["vendors"] as const;

/** BE `/vendors` 연동 */
export const VENDORS_USE_API = true;

function getErrorMessage(error: unknown): string {
  return getVendorErrorMessage(error);
}

function useVendorsLocal() {
  const { alert } = useAppDialog();
  const version = useSyncExternalStore(
    subscribeVendors,
    getVendorsVersion,
    getVendorsVersion,
  );
  const vendors = useSyncExternalStore(
    subscribeVendors,
    getVendorsSnapshot,
    getVendorsSnapshot,
  );
  void version;

  const wrap = useCallback(
    async <T>(fn: () => T | Promise<T>): Promise<T> => {
      try {
        return await fn();
      } catch (error) {
        await alert(
          error instanceof Error ? error.message : getErrorMessage(error),
        );
        throw error;
      }
    },
    [alert],
  );

  return {
    vendors,
    isLoading: false,
    isError: false,
    errorMessage: null as string | null,
    refetch: async () => ({ data: getVendorsSnapshot() }),
    createVendor: (body: VendorInput) =>
      wrap(() => localCreateVendor(body)),
    updateVendor: (id: string, body: VendorInput) =>
      wrap(() => localUpdateVendor(id, body)),
    deleteVendor: (id: string) => wrap(() => localDeleteVendor(id)),
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
  };
}

function useVendorsApi() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  const query = useQuery({
    queryKey: VENDORS_QUERY_KEY,
    queryFn: fetchVendors,
    enabled: VENDORS_USE_API,
  });

  const createMutation = useMutation({
    mutationFn: (body: VendorInput) => createVendor(body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: VENDORS_QUERY_KEY });
    },
    onError: async (error) => {
      await alert(getErrorMessage(error));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: VendorInput }) =>
      updateVendor(id, body),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: VENDORS_QUERY_KEY });
    },
    onError: async (error) => {
      await alert(getErrorMessage(error));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteVendor(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: VENDORS_QUERY_KEY });
    },
    onError: async (error) => {
      await alert(getErrorMessage(error));
    },
  });

  return {
    vendors: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    errorMessage: query.isError ? getErrorMessage(query.error) : null,
    refetch: query.refetch,
    createVendor: createMutation.mutateAsync,
    updateVendor: (id: string, body: VendorInput) =>
      updateMutation.mutateAsync({ id, body }),
    deleteVendor: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}

export function useVendors() {
  const local = useVendorsLocal();
  const api = useVendorsApi();
  return VENDORS_USE_API ? api : local;
}
