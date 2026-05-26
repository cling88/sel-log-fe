import { formatWon } from "@/lib/utils";

function SummaryRow({
  title,
  purchaseAmount,
  saleAmount,
  purchaseTrend,
  saleTrend,
}: {
  title: string;
  purchaseAmount: number;
  saleAmount: number;
  purchaseTrend?: string;
  saleTrend?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e8e0d4] bg-[#f7f3ec] p-4">
      <p className="text-sm font-medium text-zinc-600">{title}</p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/60 bg-white/70 px-4 py-3">
          <p className="text-xs text-zinc-500">매입</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">
            {formatWon(purchaseAmount)}
          </p>
          {purchaseTrend ? (
            <p className="mt-1 text-xs font-medium text-emerald-600">
              {purchaseTrend}
            </p>
          ) : null}
        </div>
        <div className="rounded-xl border border-white/60 bg-white/70 px-4 py-3">
          <p className="text-xs text-zinc-500">매출</p>
          <p className="mt-1 text-xl font-semibold text-zinc-900">
            {formatWon(saleAmount)}
          </p>
          {saleTrend ? (
            <p className="mt-1 text-xs font-medium text-rose-600">{saleTrend}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface LedgerSummaryBoardProps {
  periodLabel: string;
  todayLabel: string;
}

/** 장부 상단 요약 (퍼블용 정적 수치 — BE 연동 전) */
export function LedgerSummaryBoard({
  periodLabel,
  todayLabel,
}: LedgerSummaryBoardProps) {
  return (
    <div className="flex flex-col gap-3">
      <SummaryRow
        title={`이번달 (${periodLabel})`}
        purchaseAmount={187_930}
        saleAmount={120_000}
        purchaseTrend="▲ 12% 지난달 대비"
        saleTrend="▼ 5% 지난달 대비"
      />
      <SummaryRow
        title={`오늘 (${todayLabel}, 입력 기준)`}
        purchaseAmount={0}
        saleAmount={35_000}
      />
    </div>
  );
}
