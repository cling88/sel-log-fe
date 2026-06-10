import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import type { SourcingTabId } from "@/types/sourcing";

export const SOURCING_PAGE_SIZE = 10;

export function isSourcingPath(pathname: string | null): boolean {
  if (!pathname) return false;
  return pathname === "/sourcing" || pathname.startsWith("/sourcing/");
}

export function isSourcingTab(value: string | null): value is SourcingTabId {
  return value === "channels" || value === "products";
}

export function buildSourcingHref(
  pathname: string,
  searchParams: URLSearchParams,
  mutate?: (params: URLSearchParams) => void,
): string {
  const params = new URLSearchParams(searchParams.toString());
  mutate?.(params);
  const qs = params.toString();
  return qs ? `${pathname}?${qs}` : pathname;
}

export function replaceSourcingQuery(
  router: AppRouterInstance,
  pathname: string,
  searchParams: URLSearchParams,
  mutate: (params: URLSearchParams) => void,
): void {
  router.replace(buildSourcingHref(pathname, searchParams, mutate), {
    scroll: false,
  });
}

export function applySourcingTabParams(
  params: URLSearchParams,
  tab: SourcingTabId,
): URLSearchParams {
  params.set("tab", tab);
  params.delete("q");
  params.delete("page");
  return params;
}

export function parseSourcingPage(raw: string | null): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}
