"use client";

import { useState } from "react";
import { BoardSection } from "@/component/dashboard/board-section";
import { ExcelDownloadButton } from "@/component/common/excel-download-button";
import { PeriodSelector } from "@/component/common/period-selector";
import { PurchasesSummaryCards } from "@/component/purchases/summary-cards";

export function DashboardView() {
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(5);

  const shiftMonth = (delta: number) => {
    let nextMonth = month + delta;
    let nextYear = year;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    } else if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    setMonth(nextMonth);
    setYear(nextYear);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-black">
          대시보드
        </h1>
        <div className="flex flex-wrap items-center gap-3">
          <PeriodSelector
            label={`${year}년 ${month}월`}
            onPrev={() => shiftMonth(-1)}
            onNext={() => shiftMonth(1)}
          />
          <ExcelDownloadButton />
        </div>
      </div>

      <BoardSection />

      <div>
        <h2 className="mb-3 text-sm font-semibold text-black">
          이번달 매입 요약
        </h2>
        <PurchasesSummaryCards />
      </div>

      <div className="rounded-2xl border border-dashed border-black/15 bg-white p-8 text-center text-sm text-black/60">
        월별 매입·매출 bar chart (연간 보기) — 퍼블 예정
      </div>
    </div>
  );
}
