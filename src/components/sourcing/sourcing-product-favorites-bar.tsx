"use client";

import { SourcingExternalLink } from "@/components/sourcing/sourcing-external-link";
import { SourcingFavoriteToggle } from "@/components/sourcing/sourcing-favorite-toggle";
import type { SourcingProduct } from "@/types/sourcing";

interface SourcingProductFavoritesBarProps {
  favorites: SourcingProduct[];
  togglingId?: string | null;
  onSelect: (product: SourcingProduct) => void;
  onToggleFavorite: (product: SourcingProduct) => void | Promise<void>;
}

export function SourcingProductFavoritesBar({
  favorites,
  togglingId = null,
  onSelect,
  onToggleFavorite,
}: SourcingProductFavoritesBarProps) {
  if (favorites.length === 0) return null;

  return (
    <div className="border-b border-[var(--color-border)] px-4 py-3">
      <p className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">
        즐겨찾기
      </p>
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {favorites.map((product) => (
          <div key={product.id} className="relative w-[140px] shrink-0">
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg border border-[var(--color-border)] bg-white p-1.5 pr-8 text-left transition-colors hover:bg-[var(--color-bg)]/60"
              onClick={() => onSelect(product)}
            >
              <div className="size-9 shrink-0 overflow-hidden rounded-md bg-[var(--color-bg)]">
                {product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-[9px] text-[var(--color-text-muted)]">
                    없음
                  </div>
                )}
              </div>
              <span className="line-clamp-2 min-w-0 flex-1 text-xs font-medium leading-tight text-[var(--color-text-primary)]">
                {product.name}
              </span>
            </button>
            <div
              className="absolute inset-y-0 right-0.5 flex flex-col items-center justify-center gap-0"
              onClick={(e) => e.stopPropagation()}
            >
              {product.productUrl ? (
                <SourcingExternalLink href={product.productUrl} variant="icon" />
              ) : null}
              <SourcingFavoriteToggle
                active
                loading={togglingId === product.id}
                label={product.name}
                className="size-7 -mt-0.5"
                onToggle={() => onToggleFavorite(product)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
