"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import {
  fetchUserSettings,
  getSettingsErrorMessage,
  updateUserSettings,
} from "@/lib/api/settings";
import {
  DEFAULT_USER_SETTINGS,
  type UserSettings,
  type UserSettingsInput,
} from "@/types/settings";

export const SETTINGS_QUERY_KEY = ["settings"] as const;

export function useUserSettings() {
  const queryClient = useQueryClient();
  const { alert } = useAppDialog();

  const query = useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: fetchUserSettings,
    placeholderData: DEFAULT_USER_SETTINGS,
  });

  const updateMutation = useMutation({
    mutationFn: (body: UserSettingsInput) => updateUserSettings(body),
    onSuccess: (data) => {
      queryClient.setQueryData(SETTINGS_QUERY_KEY, data);
    },
    onError: async (error) => {
      await alert(getSettingsErrorMessage(error));
    },
  });

  return {
    settings: query.data ?? DEFAULT_USER_SETTINGS,
    isLoading: query.isLoading,
    isError: query.isError,
    errorMessage: query.isError ? getSettingsErrorMessage(query.error) : null,
    refetch: query.refetch,
    updateSettings: updateMutation.mutateAsync,
    isSaving: updateMutation.isPending,
  };
}

export function useMarginRates(): Pick<UserSettings, "marginMinRate" | "marginMaxRate"> {
  const { settings } = useUserSettings();
  return {
    marginMinRate: settings.marginMinRate,
    marginMaxRate: settings.marginMaxRate,
  };
}
