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
  // 전역 검색 딥링크 등으로 붙은 q는 다른 탭으로 이동 시 초기화
  params.delete("q");
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
