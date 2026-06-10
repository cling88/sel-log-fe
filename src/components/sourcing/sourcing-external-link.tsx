"use client";

import { ExternalLink } from "lucide-react";
import { isHttpUrl } from "@/lib/vendor-label";
import { cn } from "@/lib/utils";

interface SourcingExternalLinkProps {
  href: string;
  className?: string;
  variant?: "default" | "icon";
}

export function SourcingExternalLink({
  href,
  className,
  variant = "default",
}: SourcingExternalLinkProps) {
  const trimmed = href.trim();
  if (!trimmed || !isHttpUrl(trimmed)) return null;

  return (
    <a
      href={trimmed}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="바로가기"
      className={cn(
        variant === "icon"
          ? "inline-flex size-6 items-center justify-center rounded text-[var(--color-text-muted)] hover:bg-[var(--color-bg)] hover:text-[var(--primary-600)]"
          : "inline-flex items-center gap-1 text-xs text-[var(--primary-600)] hover:underline",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <ExternalLink
        className={cn("shrink-0", variant === "icon" ? "size-3.5" : "size-3")}
      />
      {variant === "default" ? "바로가기" : null}
    </a>
  );
}
