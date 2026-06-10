"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import {
  createVendor,
  deleteVendor,
  fetchVendors,
  getVendorErrorMessage,
  updateVendor,
} from "@/lib/api/vendors";
import type { VendorInput } from "@/types/vendor";

export const VENDORS_QUERY_KEY = ["vendors"] as const;

function getErrorMessage(error: unknown): string {
  return getVendorErrorMessage(error);
}

export function useVendors() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  const query = useQuery({
    queryKey: VENDORS_QUERY_KEY,
    queryFn: fetchVendors,
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
