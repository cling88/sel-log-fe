"use client";

import { cn } from "@/lib/utils";

export type LedgerTabType = "purchase" | "sale" | "inventory";

const tabs: { id: LedgerTabType; label: string }[] = [
  { id: "purchase", label: "매입" },
  { id: "sale", label: "매출" },
  { id: "inventory", label: "재고" },
];

export function LedgerTabs({
  activeTab,
  onChange,
}: {
  activeTab: LedgerTabType;
  onChange: (tab: LedgerTabType) => void;
}) {
  return (
    <div className="flex gap-2 rounded-xl border border-black/15 bg-white p-1">
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors",
              active
                ? "bg-black text-white"
                : "text-black/70 hover:bg-white",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
