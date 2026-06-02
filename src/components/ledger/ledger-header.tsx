"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LedgerTabId, PeriodPreset } from "@/types/common";
import { ChevronDown, ChevronUp } from "lucide-react";

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
  const [trendExpanded, setTrendExpanded] = useState(true);

  const setTab = (tab: LedgerTabId) => {
    if (tab === "purchase") {
      router.replace("/ledger?tab=purchase&purchaseSub=product");
      return;
    }
    router.replace(`/ledger?tab=${tab}`);
  };

  if (pathname !== "/ledger") return null;

  return (
    <div className="flex flex-col gap-0 overflow-hidden rounded-xl shadow-[var(--shadow-md)]">
      {trendExpanded ? (
        <section className="relative bg-[var(--primary-800)] px-4 py-4 pr-12 text-[var(--color-text-inverse)] sm:px-6 sm:pr-14">
          <button
            type="button"
            onClick={() => setTrendExpanded(false)}
            className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white sm:top-4 sm:right-4"
            aria-label="정산 추이 접기"
            aria-expanded
          >
            <ChevronUp className="size-5" />
          </button>
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
      ) : (
        <section className="flex items-center justify-between bg-[var(--primary-800)] px-4 py-3 text-[var(--color-text-inverse)] sm:px-6">
          <span className="text-sm font-semibold text-white">정산 추이</span>
          <button
            type="button"
            onClick={() => setTrendExpanded(true)}
            className="flex size-8 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="정산 추이 펼치기"
            aria-expanded={false}
          >
            <ChevronDown className="size-5" />
          </button>
        </section>
      )}

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
