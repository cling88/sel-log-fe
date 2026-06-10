"use client";

import { ExternalLink } from "lucide-react";
import { isHttpUrl } from "@/lib/vendor-label";
import { cn } from "@/lib/utils";

interface SourcingExternalLinkProps {
  href: string;
  className?: string;
}

export function SourcingExternalLink({
  href,
  className,
}: SourcingExternalLinkProps) {
  const trimmed = href.trim();
  if (!trimmed || !isHttpUrl(trimmed)) return null;

  return (
    <a
      href={trimmed}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center gap-1 text-xs text-[var(--primary-600)] hover:underline",
        className,
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <ExternalLink className="size-3 shrink-0" />
      바로가기
    </a>
  );
}
