import { formatWon } from "@/lib/utils";

function BoardRow({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-black/15 bg-white p-4">
      <p className="text-sm font-medium text-black/70">{title}</p>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">{children}</div>
    </div>
  );
}

function Metric({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-black/15 bg-white px-4 py-3">
      <p className="text-xs text-black/60">{label}</p>
      <p className="mt-1 text-lg font-semibold text-black">{value}</p>
      {sub ? <p className="mt-1 text-xs font-medium text-black/70">{sub}</p> : null}
    </div>
  );
}

export function BoardSection() {
  return (
    <div className="flex flex-col gap-3">
      <BoardRow title="전체 누적">
        <Metric label="총 매입액" value={formatWon(1_200_000)} />
        <Metric label="총 매출액" value={formatWon(850_000)} />
        <Metric label="현재 재고" value="23종" />
      </BoardRow>
      <BoardRow title="이번달 (2026년 5월)">
        <Metric
          label="매입"
          value={formatWon(187_930)}
          sub="▲ 12% 지난달 대비"
        />
        <Metric
          label="매출"
          value={formatWon(120_000)}
          sub="▼ 5% 지난달 대비"
        />
        <Metric label="신규입고" value="+54개" />
      </BoardRow>
      <BoardRow title="오늘 (2026-05-22, 입력 기준)">
        <Metric label="매입" value={formatWon(0)} />
        <Metric label="매출" value={formatWon(35_000)} />
        <Metric label="재고변동" value="-3개" />
      </BoardRow>
    </div>
  );
}
