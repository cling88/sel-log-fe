import { ApiError } from "@/lib/api-client";
import { normalizeSourcingProduct } from "@/lib/api/sourcing-products";
import type { SourcingProduct } from "@/types/sourcing";

export function isChannelHasProductsError(error: unknown): boolean {
  return error instanceof ApiError && error.code === "CHANNEL_HAS_PRODUCTS";
}

/** @deprecated isChannelHasProductsError 와 동일 */
export const isSourcingChannelHasProductsError = isChannelHasProductsError;

export function parseChannelHasProductsFromError(
  error: unknown,
): SourcingProduct[] | null {
  if (!isChannelHasProductsError(error) || !(error instanceof ApiError)) {
    return null;
  }
  const data = error.data as { products?: unknown[] } | undefined;
  return (data?.products ?? []).map((item) => normalizeSourcingProduct(item));
}
