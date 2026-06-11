"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { replaceLedgerQuery } from "@/lib/ledger-url";
import { LedgerYearSelectDialog } from "@/components/ledger/ledger-year-select-dialog";
import {
  ledgerEarliestMonthQueryKey,
} from "@/hooks/use-ledger-earliest-month";
import { useLedgerMinYear } from "@/hooks/use-ledger-min-year";
import { fetchLedgerEarliestMonth } from "@/lib/api/ledger";
import {
  getTodayYearMonth,
  isLedgerMonthAllParam,
  isMonthScopedLedgerTab,
  listYearOptions,
  parseLedgerMonthFilter,
  parseYearMonth,
  toEarliestMonthTab,
  toLedgerMonthAllParam,
  toYearMonthParam,
} from "@/lib/ledger-period";
import type { LedgerTabId } from "@/types/common";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LedgerGlobalSearchTrigger } from "@/components/ledger/ledger-global-search-dialog";

interface LedgerYearPickerProps {
  /** false면 표시만 (상품관리 등, URL·API 미반영) */
  interactive?: boolean;
}

function readActiveTab(searchParams: URLSearchParams): LedgerTabId {
  const tab = searchParams.get("tab");
  if (
    tab === "purchase" ||
    tab === "sale" ||
    tab === "income" ||
    tab === "products"
  ) {
    return tab;
  }
  return "purchase";
}

export function LedgerYearPicker({ interactive = true }: LedgerYearPickerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const monthParam = searchParams.get("month");
  const scope = parseLedgerMonthFilter(monthParam);
  const initial = scope;
  const activeTab = readActiveTab(searchParams);

  const [year, setYear] = useState(initial.year);
  const [yearDialogOpen, setYearDialogOpen] = useState(false);
  const { data: discoveredMinYear } = useLedgerMinYear(interactive);
  const yearOptions = listYearOptions(discoveredMinYear);
  const { year: currentYear, month: currentMonth } = getTodayYearMonth();
  const minYear = yearOptions[0] ?? currentYear;
  const maxYear = currentYear;

  const applyYear = async (nextYear: number) => {
    if (!interactive) return;
    const clampedYear = Math.min(Math.max(nextYear, minYear), maxYear);
    setYear(clampedYear);

    const apiTab = toEarliestMonthTab(activeTab);
    let nextMonthParam = "";

    if (isMonthScopedLedgerTab(activeTab) && apiTab) {
      if (isLedgerMonthAllParam(monthParam)) {
        nextMonthParam = toLedgerMonthAllParam(clampedYear);
      } else {
        const data = await queryClient.fetchQuery({
          queryKey: ledgerEarliestMonthQueryKey(clampedYear, apiTab),
          queryFn: () => fetchLedgerEarliestMonth(apiTab, clampedYear),
        });
        const earliest = data.month ? parseYearMonth(data.month) : null;
        const nextMonth =
          earliest && earliest.year === clampedYear
            ? earliest.month
            : clampedYear === currentYear
              ? currentMonth
              : 1;
        nextMonthParam = toYearMonthParam(clampedYear, nextMonth);
      }
    } else {
      let nextMonth = scope.month ?? currentMonth;
      if (clampedYear === currentYear && nextMonth > currentMonth) {
        nextMonth = currentMonth;
      }
      nextMonthParam = toYearMonthParam(clampedYear, nextMonth);
    }

    replaceLedgerQuery(router, pathname, searchParams, (params) => {
      params.set("month", nextMonthParam);
    });
  };

  useEffect(() => {
    setYear(parseLedgerMonthFilter(monthParam).year);
  }, [monthParam]);

  return (
    <>
      <div className="relative flex items-center justify-center py-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            aria-label="이전 년도"
            disabled={!interactive || year <= minYear}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            onClick={() => void applyYear(year - 1)}
          >
            <ChevronLeft className="size-5" />
          </button>

          <button
            type="button"
            disabled={!interactive}
            className="min-w-[6rem] text-xl font-semibold tabular-nums tracking-tight text-white transition-colors hover:text-white/90 disabled:cursor-default sm:text-2xl"
            onClick={() => interactive && setYearDialogOpen(true)}
          >
            {year}년
          </button>

          <button
            type="button"
            aria-label="다음 년도"
            disabled={!interactive || year >= maxYear}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            onClick={() => void applyYear(year + 1)}
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <LedgerGlobalSearchTrigger className="absolute right-0 flex size-9 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white" />
      </div>

      <LedgerYearSelectDialog
        open={interactive && yearDialogOpen}
        onOpenChange={(open) => interactive && setYearDialogOpen(open)}
        year={year}
        yearOptions={yearOptions}
        onSelectYear={(y) => void applyYear(y)}
      />
    </>
  );
}
