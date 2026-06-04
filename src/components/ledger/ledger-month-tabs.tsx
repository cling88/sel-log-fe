"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getTodayYearMonth,
  listMonthTabsForYear,
  parseYearMonth,
  resolveSelectedMonthForTab,
  toYearMonthParam,
} from "@/lib/ledger-period";
import type { LedgerTabId } from "@/types/common";
import { cn } from "@/lib/utils";

interface LedgerMonthTabsProps {
  tabId: LedgerTabId;
}

export function LedgerMonthTabs({ tabId }: LedgerMonthTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const monthParam = searchParams.get("month");
  const selected = parseYearMonth(monthParam) ?? getTodayYearMonth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  const monthTabs = useMemo(
    () => listMonthTabsForYear(tabId, selected.year),
    [tabId, selected.year],
  );

  const selectedValue = toYearMonthParam(selected.year, selected.month);

  useEffect(() => {
    if (monthParam) return;
    const params = new URLSearchParams(searchParams.toString());
    const { year, month } = getTodayYearMonth();
    params.set("month", toYearMonthParam(year, month));
    router.replace(`/ledger?${params.toString()}`);
  }, [monthParam, router, searchParams]);

  useEffect(() => {
    const resolved = resolveSelectedMonthForTab(tabId, selected.year, selected.month);
    const nextValue = toYearMonthParam(resolved.year, resolved.month);
    if (nextValue === selectedValue) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", nextValue);
    router.replace(`/ledger?${params.toString()}`);
  }, [tabId, selected.year, selected.month, selectedValue, router, searchParams]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [selectedValue, monthTabs.length]);

  const setMonth = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", value);
    router.replace(`/ledger?${params.toString()}`);
  };

  if (monthTabs.length === 0) return <LedgerMonthTabsSpacer />;

  return (
    <div
      ref={scrollRef}
      className="overflow-hidden relative mb-[-1px] z-10"
    >
      <div className="flex min-w-max gap-0.5 pt-1 ">
        {monthTabs.map((tab) => {
          const active = tab.value === selectedValue;
          return (
            <button
              key={tab.value}
              ref={active ? activeRef : undefined}
              type="button"
              onClick={() => setMonth(tab.value)}
              className={cn(
                "relative shrink-0  px-5 py-1 text-xs tabular-nums transition-colors",
                active
                  ? "z-10 -mb-px bg-white font-semibold border border-[var(--primary-600)] border-b-transparent text-[var(--primary-600)]"
                  : "border border-[var(--color-border)] border-b-transparent bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:bg-[var(--primary-50)]/50 hover:text-[var(--color-text-secondary)]",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** 월 탭 미사용 탭(상품관리)에서 레이아웃 높이만 유지 */
export function LedgerMonthTabsSpacer() {
  return (
    <div className="overflow-hidden relative mb-[-1px] z-10" aria-hidden>
      <div className="flex min-w-max gap-0.5 pt-1">
        <span className="relative shrink-0 border border-transparent px-5 py-1 text-xs text-transparent select-none">
          {"\u00a0"}
        </span>
      </div>
    </div>
  );
}
