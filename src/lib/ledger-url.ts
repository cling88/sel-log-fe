import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { LedgerTabId } from "@/types/common";

export function isLedgerPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === "/ledger" || pathname.startsWith("/ledger/");
}

export function applyLedgerTabParams(
  params: URLSearchParams,
  tab: LedgerTabId,
): URLSearchParams {
  params.set("tab", tab);
  if (tab === "purchase") {
    if (!params.get("purchaseSub")) {
      params.set("purchaseSub", "product");
    }
  } else {
    params.delete("purchaseSub");
  }
  return params;
}

export function buildLedgerHref(
  pathname: string,
  searchParams: URLSearchParams,
  mutate?: (params: URLSearchParams) => void,
): string {
  const params = new URLSearchParams(searchParams.toString());
  mutate?.(params);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function replaceLedgerQuery(
  router: AppRouterInstance,
  pathname: string,
  searchParams: URLSearchParams,
  mutate: (params: URLSearchParams) => void,
): void {
  router.replace(buildLedgerHref(pathname, searchParams, mutate), { scroll: false });
}
