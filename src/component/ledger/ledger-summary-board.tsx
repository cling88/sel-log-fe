"use client";

import { useState } from "react";
import { AdjustmentDetailModal } from "@/component/ledger/adjustment-detail-modal";
import type { MonthLedgerSummary } from "@/lib/ledger-period-summary";
import { cn, formatWon } from "@/lib/utils";

function MetricCard({
  label,
  amount,
  onClick,
  clickable,
}: {
  label: string;
  amount: number;
  onClick?: () => void;
  clickable?: boolean;
}) {
  const inner = (
    <>
      <p className="text-xs text-black/60">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-black">
        {formatWon(amount)}
      </p>
      {clickable ? (
        <p className="mt-1 text-xs text-black/50">클릭하여 목록 보기</p>
      ) : null}
    </>
  );

  if (clickable && onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded-xl border border-black/15 bg-white px-4 py-3 text-left transition-colors hover:border-black hover:bg-black/[0.02]"
      >
        {inner}
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-black/15 bg-white px-4 py-3">
      {inner}
    </div>
  );
}

function FormulaLine({
  sign,
  label,
  amount,
  emphasis,
}: {
  sign: "−" | "+";
  label: string;
  amount: number;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5 text-sm",
        emphasis ? "font-semibold text-black" : "text-black/80",
      )}
    >
      <span>
        <span className="mr-1.5 tabular-nums text-black/50">{sign}</span>
        {label}
      </span>
      <span className="tabular-nums">{formatWon(amount)}</span>
    </div>
  );
}

interface LedgerSummaryBoardProps {
  periodLabel: string;
  todayLabel: string;
  monthSummary: MonthLedgerSummary;
}

export function LedgerSummaryBoard({
  periodLabel,
  todayLabel,
  monthSummary,
}: LedgerSummaryBoardProps) {
  const [detailKind, setDetailKind] = useState<"add" | "subtract" | null>(null);

  const {
    purchaseTotal,
    saleTotal,
    addStockTotal,
    subtractStockTotal,
    finalTotal,
    addLines,
    subtractLines,
  } = monthSummary;

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-2xl border border-black/15 bg-white p-4">
        <p className="text-sm font-medium text-black/70">
          이번달 ({periodLabel})
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="매입" amount={purchaseTotal} />
          <MetricCard label="매출" amount={saleTotal} />
          <MetricCard
            label="추가재고"
            amount={addStockTotal}
            clickable
            onClick={() => setDetailKind("add")}
          />
          <MetricCard
            label="차감재고"
            amount={subtractStockTotal}
            clickable
            onClick={() => setDetailKind("subtract")}
          />
        </div>

        <div className="mt-4 space-y-2 border-t border-black/10 pt-4">
          <p className="text-xs font-medium text-black/60">최종 합산 (참고)</p>
          <p className="text-xs text-black/50">
            −매입 +매출 +추가재고 −차감재고 · 조정은 원가(개당×수량) 기준, 매입·매출
            장부와 별도
          </p>
          <div className="space-y-1.5 rounded-xl border border-black/10 bg-white px-4 py-3">
            <FormulaLine sign="−" label="매입" amount={purchaseTotal} />
            <FormulaLine sign="+" label="매출" amount={saleTotal} />
            <FormulaLine sign="+" label="추가재고" amount={addStockTotal} />
            <FormulaLine sign="−" label="차감재고" amount={subtractStockTotal} />
            <div className="my-2 border-t border-black/10" />
            <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-sm font-semibold text-black">
              <span>= 최종</span>
              <span className="tabular-nums">
                {finalTotal < 0 ? "−" : ""}
                {formatWon(Math.abs(finalTotal))}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-black/15 bg-white p-4">
        <p className="text-sm font-medium text-black/70">
          오늘 ({todayLabel}, 입력 기준)
        </p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <MetricCard label="매입" amount={0} />
          <MetricCard label="매출" amount={35_000} />
        </div>
      </div>

      <AdjustmentDetailModal
        open={detailKind === "add"}
        title={`추가재고 · ${periodLabel}`}
        lines={addLines}
        variant="add"
        onClose={() => setDetailKind(null)}
      />
      <AdjustmentDetailModal
        open={detailKind === "subtract"}
        title={`차감재고 · ${periodLabel}`}
        lines={subtractLines}
        variant="subtract"
        onClose={() => setDetailKind(null)}
      />
    </div>
  );
}
