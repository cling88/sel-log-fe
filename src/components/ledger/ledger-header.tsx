"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LedgerTabId, PeriodPreset } from "@/types/common";

const periodPresets: { id: PeriodPreset; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "year", label: "올해" },
  { id: "month", label: "이번달" },
  { id: "week", label: "주간" },
  { id: "today", label: "오늘" },
];

const ledgerTabs: { id: LedgerTabId; label: string }[] = [
  { id: "purchase", label: "매입" },
  { id: "sale", label: "매출" },
  { id: "income", label: "수익" },
  { id: "products", label: "상품관리" },
];

function isLedgerTab(value: string | null): value is LedgerTabId {
  return (
    value === "purchase" ||
    value === "sale" ||
    value === "income" ||
    value === "products"
  );
}

export function LedgerHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: LedgerTabId = isLedgerTab(tabParam) ? tabParam : "purchase";
  const showMonthPicker = activeTab !== "products";

  const setTab = (tab: LedgerTabId) => {
    router.replace(`/ledger?tab=${tab}`);
  };

  if (pathname !== "/ledger") return null;

  return (
    <div className="flex flex-col gap-0 overflow-hidden rounded-xl shadow-[var(--shadow-md)]">
      <section className="bg-[var(--primary-800)] px-4 py-4 text-[var(--color-text-inverse)] sm:px-6">
        <div className="flex flex-wrap gap-2">
          {periodPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
            >
              {preset.label}
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {["매입", "매출", "수익"].map((label) => (
            <div
              key={label}
              className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur"
            >
              <p className="text-xs text-white/70">{label}</p>
              <p className="mt-1 text-lg font-semibold tabular-nums">0원</p>
              <p className="mt-0.5 text-xs text-white/60">0건</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-right text-sm text-white/80">
          순수익 <span className="font-semibold text-white">0원</span>
        </p>
      </section>

      {showMonthPicker ? (
        <div className="border-b border-[var(--color-border-dark)] bg-[var(--primary-900)] px-4 py-3 sm:px-6">
          <button
            type="button"
            className="rounded-lg border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-white"
          >
            2026년 5월 ▼
          </button>
        </div>
      ) : null}

      <nav className="flex gap-1 bg-[var(--primary-900)] px-2 pb-0 pt-2 sm:px-4">
        {ledgerTabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={cn(
                "rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "border-b-2 border-white bg-[var(--primary-800)] text-white"
                  : "text-white/50 hover:text-white/80",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
