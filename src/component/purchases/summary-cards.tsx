import { formatWon } from "@/lib/utils";

const cards = [
  {
    label: "이번달 총 매입",
    amount: 187_930,
    trend: { direction: "up" as const, percent: 12 },
    highlight: true,
  },
  { label: "상품 매입", amount: 99_000 },
  { label: "부가 제품", amount: 49_960 },
  { label: "기타", amount: 38_970 },
];

export function PurchasesSummaryCards() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-black/15 bg-white px-5 py-4"
        >
          <p className="text-sm text-black/70">{card.label}</p>
          <p
            className={`mt-1 font-semibold text-black ${
              card.highlight ? "text-2xl" : "text-xl"
            }`}
          >
            {formatWon(card.amount)}
          </p>
          {card.trend ? (
            <p className="mt-2 text-sm font-medium text-black/70">
              ▲ {card.trend.percent}% 지난달 대비
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
