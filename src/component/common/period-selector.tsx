"use client";

import { cn } from "@/lib/utils";

interface PeriodSelectorProps {
  label: string;
  onPrev?: () => void;
  onNext?: () => void;
  className?: string;
}

export function PeriodSelector({
  label,
  onPrev,
  onNext,
  className,
}: PeriodSelectorProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <button
        type="button"
        onClick={onPrev}
        aria-label="이전 달"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
      >
        ‹
      </button>
      <span className="min-w-[120px] text-center text-base font-semibold text-zinc-900">
        {label}
      </span>
      <button
        type="button"
        onClick={onNext}
        aria-label="다음 달"
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"
      >
        ›
      </button>
    </div>
  );
}
