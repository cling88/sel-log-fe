"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LedgerYearSelectDialog } from "@/components/ledger/ledger-year-select-dialog";
import {
  getTodayYearMonth,
  listYearOptions,
  parseYearMonth,
  toYearMonthParam,
} from "@/lib/ledger-period";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LedgerGlobalSearchTrigger } from "@/components/ledger/ledger-global-search-dialog";

interface LedgerYearPickerProps {
  /** false면 표시만 (상품관리 등, URL·API 미반영) */
  interactive?: boolean;
}

export function LedgerYearPicker({ interactive = true }: LedgerYearPickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const monthParam = searchParams.get("month");
  const parsed = parseYearMonth(monthParam);
  const initial = parsed ?? getTodayYearMonth();

  const [year, setYear] = useState(initial.year);
  const [yearDialogOpen, setYearDialogOpen] = useState(false);
  const yearOptions = listYearOptions();
  const { year: currentYear, month: currentMonth } = getTodayYearMonth();
  const minYear = yearOptions[0] ?? currentYear;
  const maxYear = currentYear;

  const applyYear = (nextYear: number) => {
    if (!interactive) return;
    const clampedYear = Math.min(Math.max(nextYear, minYear), maxYear);
    let nextMonth = parsed?.month ?? currentMonth;
    if (clampedYear === currentYear && nextMonth > currentMonth) {
      nextMonth = currentMonth;
    }
    setYear(clampedYear);
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", toYearMonthParam(clampedYear, nextMonth));
    router.replace(`/ledger?${params.toString()}`);
  };

  useEffect(() => {
    const next = parseYearMonth(monthParam);
    if (!next) return;
    setYear(next.year);
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
            onClick={() => applyYear(year - 1)}
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
            onClick={() => applyYear(year + 1)}
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
        onSelectYear={applyYear}
      />
    </>
  );
}
