import { ApiError } from "@/lib/api-client";

export const SOURCING_FAVORITE_LIMIT = 20;

export function isFavoriteLimitReachedError(error: unknown): boolean {
  return error instanceof ApiError && error.code === "FAVORITE_LIMIT_REACHED";
}
