"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LedgerMonthAddDialog } from "@/components/ledger/ledger-month-add-dialog";
import { useLedgerEarliestMonth } from "@/hooks/use-ledger-earliest-month";
import { getDefaultLedgerMonthParam } from "@/hooks/use-ledger-month";
import {
  buildMonthTabs,
  isLedgerMonthAllParam,
  parseLedgerMonthFilter,
  resolveSelectedMonth,
  toEarliestMonthTab,
  toYearMonthParam,
} from "@/lib/ledger-period";
import { replaceLedgerQuery } from "@/lib/ledger-url";
import type { LedgerTabId } from "@/types/common";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface LedgerMonthTabsProps {
  tabId: LedgerTabId;
}

export function LedgerMonthTabs({ tabId }: LedgerMonthTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;
  const monthParam = searchParams.get("month");
  const scope = parseLedgerMonthFilter(monthParam);
  const selectedValue = scope.scopeKey;
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);
  const apiTab = toEarliestMonthTab(tabId);

  const [extraMonths, setExtraMonths] = useState<string[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: earliestData, isLoading } = useLedgerEarliestMonth(
    scope.year,
    apiTab,
  );

  useEffect(() => {
    setExtraMonths([]);
  }, [scope.year, tabId]);

  const monthTabs = useMemo(
    () =>
      buildMonthTabs(scope.year, {
        earliestYm: earliestData?.month ?? null,
        extraMonths,
      }),
    [scope.year, earliestData?.month, extraMonths],
  );

  const existingValues = useMemo(
    () => new Set(monthTabs.map((tab) => tab.value)),
    [monthTabs],
  );

  useEffect(() => {
    if (monthParam) return;
    replaceLedgerQuery(router, pathname, searchParamsRef.current, (params) => {
      params.set("month", getDefaultLedgerMonthParam());
    });
  }, [monthParam, pathname, router]);

  useEffect(() => {
    if (isLoading || !earliestData) return;
    if (isLedgerMonthAllParam(monthParam)) return;
    if (scope.month == null) return;
    const resolved = resolveSelectedMonth(scope.year, scope.month, monthTabs);
    const nextValue = toYearMonthParam(resolved.year, resolved.month);
    if (nextValue === selectedValue) return;
    replaceLedgerQuery(router, pathname, searchParamsRef.current, (params) => {
      params.set("month", nextValue);
    });
  }, [
    tabId,
    monthParam,
    scope.year,
    scope.month,
    selectedValue,
    monthTabs,
    earliestData,
    isLoading,
    pathname,
    router,
  ]);

  useEffect(() => {
    activeRef.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [selectedValue, monthTabs.length]);

  const setMonth = (value: string) => {
    replaceLedgerQuery(router, pathname, searchParams, (params) => {
      params.set("month", value);
    });
  };

  const handleAddMonth = (value: string) => {
    setExtraMonths((prev) =>
      prev.includes(value) ? prev : [...prev, value].sort(),
    );
    setMonth(value);
  };

  return (
    <>
      <div ref={scrollRef} className="relative z-10 mb-[-1px] overflow-hidden">
        <div className="flex min-w-max gap-0.5 pt-1">
          {monthTabs.map((tab) => {
            const active = tab.value === selectedValue;
            return (
              <button
                key={tab.value}
                ref={active ? activeRef : undefined}
                type="button"
                onClick={() => setMonth(tab.value)}
                className={cn(
                  "relative shrink-0 px-5 py-1 text-xs tabular-nums transition-colors",
                  active
                    ? "z-10 -mb-px border border-[var(--primary-600)] border-b-transparent bg-white font-semibold text-[var(--primary-600)]"
                    : "border border-[var(--color-border)] border-b-transparent bg-[var(--color-bg)] text-[var(--color-text-muted)] hover:bg-[var(--primary-50)]/50 hover:text-[var(--color-text-secondary)]",
                )}
              >
                {tab.label}
              </button>
            );
          })}

          <button
            type="button"
            aria-label="월 탭 추가"
            onClick={() => setAddDialogOpen(true)}
            className={cn(
              "relative shrink-0 border border-dashed border-[var(--color-border)] border-b-transparent bg-[var(--color-bg)] px-3 py-1 text-[var(--color-text-muted)] transition-colors hover:border-[var(--primary-600)] hover:bg-[var(--primary-50)]/50 hover:text-[var(--primary-600)]",
              monthTabs.length === 0 && "-mb-px",
            )}
          >
            <Plus className="size-3.5" />
          </button>
        </div>
      </div>

      <LedgerMonthAddDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        year={scope.year}
        existingValues={existingValues}
        onAdd={handleAddMonth}
      />
    </>
  );
}

/** 월 탭 미사용 탭(상품관리)에서 레이아웃 높이만 유지 */
export function LedgerMonthTabsSpacer() {
  return (
    <div className="relative z-10 mb-[-1px] overflow-hidden" aria-hidden>
      <div className="flex min-w-max gap-0.5 pt-1">
        <span className="relative shrink-0 select-none border border-transparent px-5 py-1 text-xs text-transparent">
          {"\u00a0"}
        </span>
      </div>
    </div>
  );
}
