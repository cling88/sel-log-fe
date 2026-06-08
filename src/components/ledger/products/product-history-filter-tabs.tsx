"use client";

import {
  PRODUCT_HISTORY_FILTER_TABS,
  type ProductHistoryFilterId,
} from "@/lib/product-unified-history";
import { cn } from "@/lib/utils";

interface ProductHistoryFilterTabsProps {
  value: ProductHistoryFilterId;
  onChange: (value: ProductHistoryFilterId) => void;
  className?: string;
}

export function ProductHistoryFilterTabs({
  value,
  onChange,
  className,
}: ProductHistoryFilterTabsProps) {
  return (
    <div
      className={cn(
        "inline-flex flex-wrap items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-0.5",
        className,
      )}
      role="tablist"
      aria-label="히스토리 유형"
    >
      {PRODUCT_HISTORY_FILTER_TABS.map((tab) => {
        const active = tab.id === value;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-white text-[var(--color-text-primary)] shadow-sm"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]",
            )}
            onClick={() => onChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
