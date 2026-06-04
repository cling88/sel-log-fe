"use client";

import { useState } from "react";
import { LedgerYearSelectDialog } from "@/components/ledger/ledger-year-select-dialog";
import { resolveSelectedMonthForTab, shiftYearMonth } from "@/lib/ledger-period";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductHistoryPeriodPickerProps {
  year: number;
  month: number;
  onYearMonthChange: (year: number, month: number) => void;
  className?: string;
}

export function ProductHistoryPeriodPicker({
  year,
  month,
  onYearMonthChange,
  className,
}: ProductHistoryPeriodPickerProps) {
  const [yearDialogOpen, setYearDialogOpen] = useState(false);
  const canPrev = shiftYearMonth(year, month, "prev") !== null;
  const canNext = shiftYearMonth(year, month, "next") !== null;

  const applyYear = (nextYear: number) => {
    const resolved = resolveSelectedMonthForTab("products", nextYear, month);
    onYearMonthChange(resolved.year, resolved.month);
  };

  const shiftMonth = (direction: "prev" | "next") => {
    const next = shiftYearMonth(year, month, direction);
    if (!next) return;
    onYearMonthChange(next.year, next.month);
  };

  return (
    <>
      <div className={cn("flex flex-col items-center gap-0.5", className)}>
        <button
          type="button"
          className="text-[10px] font-medium leading-none tabular-nums text-[var(--color-text-muted)] transition-colors hover:text-[var(--primary-600)]"
          onClick={() => setYearDialogOpen(true)}
        >
          {year}
        </button>
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            aria-label="이전 달"
            disabled={!canPrev}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--color-text-muted)] transition-colors hover:bg-[var(--primary-50)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-30"
            onClick={() => shiftMonth("prev")}
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="min-w-[2.75rem] text-center text-sm font-semibold tabular-nums text-[var(--color-text-primary)]">
            {month}월
          </span>
          <button
            type="button"
            aria-label="다음 달"
            disabled={!canNext}
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-[var(--color-text-muted)] transition-colors hover:bg-[var(--primary-50)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-30"
            onClick={() => shiftMonth("next")}
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>

      <LedgerYearSelectDialog
        open={yearDialogOpen}
        onOpenChange={setYearDialogOpen}
        year={year}
        onSelectYear={applyYear}
      />
    </>
  );
}
