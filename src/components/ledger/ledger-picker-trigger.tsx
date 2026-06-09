"use client";

import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface LedgerPickerTriggerProps {
  label: ReactNode;
  displayValue: string;
  isEmpty?: boolean;
  disabled?: boolean;
  onOpen: () => void;
  emptyHint?: string;
  className?: string;
  labelClassName?: string;
}

/** 라벨 + 클릭 가능한 선택 영역 (구매처·채널·계좌·카테고리 등) */
export function LedgerPickerTrigger({
  label,
  displayValue,
  isEmpty = false,
  disabled = false,
  onOpen,
  emptyHint,
  className,
  labelClassName,
}: LedgerPickerTriggerProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className={labelClassName}>{label}</Label>
      <button
        type="button"
        disabled={disabled}
        onClick={onOpen}
        className={cn(
          "flex min-h-9 w-full items-center rounded-lg border border-[var(--color-border)] bg-white px-3 text-left text-sm transition-colors",
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer hover:border-[var(--primary-400)] hover:bg-[var(--primary-50)]/30",
          isEmpty
            ? "text-[var(--color-text-muted)]"
            : "text-[var(--color-text-primary)]",
        )}
      >
        <span className="min-w-0 truncate">{displayValue}</span>
      </button>
      {emptyHint ? (
        <p className="text-xs text-[var(--color-text-muted)]">{emptyHint}</p>
      ) : null}
    </div>
  );
}
