"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthSessionSync } from "@/components/auth/auth-session-sync";
import { AppDialogProvider } from "@/components/common/app-dialog-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AppDialogProvider>
        <AuthSessionSync />
        <TooltipProvider>{children}</TooltipProvider>
      </AppDialogProvider>
    </QueryClientProvider>
  );
}
