"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SourcingFavoriteToggleProps {
  active: boolean;
  disabled?: boolean;
  loading?: boolean;
  label: string;
  className?: string;
  onToggle: () => void | Promise<void>;
}

export function SourcingFavoriteToggle({
  active,
  disabled = false,
  loading = false,
  label,
  className,
  onToggle,
}: SourcingFavoriteToggleProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn("size-8 shrink-0", className)}
      disabled={disabled || loading}
      onClick={() => void onToggle()}
      aria-label={active ? `${label} 즐겨찾기 해제` : `${label} 즐겨찾기 등록`}
      aria-pressed={active}
    >
      <Star
        className={cn(
          "size-4 transition-colors",
          active
            ? "fill-amber-400 text-amber-400"
            : "text-[var(--color-text-muted)]",
        )}
      />
    </Button>
  );
}
