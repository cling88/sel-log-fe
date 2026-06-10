"use client";

import { SourcingExternalLink } from "@/components/sourcing/sourcing-external-link";
import { SourcingFavoriteToggle } from "@/components/sourcing/sourcing-favorite-toggle";
import type { SourcingChannel } from "@/types/sourcing";

interface SourcingChannelFavoritesBarProps {
  favorites: SourcingChannel[];
  togglingId?: string | null;
  onSelect: (channel: SourcingChannel) => void;
  onToggleFavorite: (channel: SourcingChannel) => void | Promise<void>;
}

export function SourcingChannelFavoritesBar({
  favorites,
  togglingId = null,
  onSelect,
  onToggleFavorite,
}: SourcingChannelFavoritesBarProps) {
  if (favorites.length === 0) return null;

  return (
    <div className="border-b border-[var(--color-border)] px-4 py-3">
      <p className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">
        즐겨찾기
      </p>
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {favorites.map((channel) => (
          <div
            key={channel.id}
            className="flex shrink-0 items-center rounded-full border border-[var(--color-border)] bg-white"
          >
            <div onClick={(e) => e.stopPropagation()}>
              <SourcingFavoriteToggle
                active
                loading={togglingId === channel.id}
                label={channel.name}
                className="size-7"
                onToggle={() => onToggleFavorite(channel)}
              />
            </div>
            <button
              type="button"
              className="max-w-[160px] truncate py-1.5 pl-0.5 pr-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:text-[var(--primary-600)]"
              onClick={() => onSelect(channel)}
            >
              {channel.name}
            </button>
            {channel.url ? (
              <div
                className="flex items-center pr-1"
                onClick={(e) => e.stopPropagation()}
              >
                <SourcingExternalLink href={channel.url} variant="icon" />
              </div>
            ) : (
              <span className="pr-1.5" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
