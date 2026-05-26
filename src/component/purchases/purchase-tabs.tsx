"use client";

import { cn } from "@/lib/utils";
import type { PurchaseTabType } from "@/types/purchase";

export interface TabItem {
  id: PurchaseTabType;
  label: string;
  count: number;
  badgeClassName: string;
}

interface PurchaseTabsProps {
  tabs: TabItem[];
  activeTab: PurchaseTabType;
  onChange: (tab: PurchaseTabType) => void;
}

export function PurchaseTabs({
  tabs,
  activeTab,
  onChange,
}: PurchaseTabsProps) {
  return (
    <div className="flex gap-6 border-b border-zinc-200">
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative flex items-center gap-2 pb-3 text-sm font-medium transition-colors",
              active ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-700",
            )}
          >
            {tab.label}
            <span
              className={cn(
                "inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold text-white",
                tab.badgeClassName,
              )}
            >
              {tab.count}
            </span>
            {active ? (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-zinc-900" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
