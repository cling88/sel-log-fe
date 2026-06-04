"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getTodayYearMonth,
  listYearOptions,
  parseYearMonth,
  toYearMonthParam,
} from "@/lib/ledger-period";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { LedgerGlobalSearchTrigger } from "@/components/ledger/ledger-global-search-dialog";

export function LedgerYearPicker() {
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
            disabled={year <= minYear}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            onClick={() => applyYear(year - 1)}
          >
            <ChevronLeft className="size-5" />
          </button>

          <button
            type="button"
            className="min-w-[6rem] text-xl font-semibold tabular-nums tracking-tight text-white transition-colors hover:text-white/90 sm:text-2xl"
            onClick={() => setYearDialogOpen(true)}
          >
            {year}년
          </button>

          <button
            type="button"
            aria-label="다음 년도"
            disabled={year >= maxYear}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            onClick={() => applyYear(year + 1)}
          >
            <ChevronRight className="size-5" />
          </button>
        </div>

        <LedgerGlobalSearchTrigger className="absolute right-0 flex size-9 shrink-0 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white" />
      </div>

      <Dialog open={yearDialogOpen} onOpenChange={setYearDialogOpen}>
        <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>년도 선택</DialogTitle>
            <DialogDescription>조회할 년도를 선택하세요.</DialogDescription>
          </DialogHeader>
          <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto py-1">
            {yearOptions.map((optionYear) => {
              const selected = optionYear === year;
              return (
                <button
                  key={optionYear}
                  type="button"
                  className={cn(
                    "rounded-md border px-2 py-2 text-sm tabular-nums transition-colors",
                    selected
                      ? "border-[var(--primary-500)] bg-[var(--primary-50)] font-semibold text-[var(--primary-600)]"
                      : "border-[var(--color-border)] bg-white hover:bg-[var(--primary-50)]/40",
                  )}
                  onClick={() => {
                    applyYear(optionYear);
                    setYearDialogOpen(false);
                  }}
                >
                  {optionYear}년
                </button>
              );
            })}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setYearDialogOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
