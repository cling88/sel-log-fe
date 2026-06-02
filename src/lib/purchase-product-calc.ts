export function calcUnitPrice(quantity: number, paymentAmount: number): number {
  if (quantity <= 0) return 0;
  return Math.round(paymentAmount / quantity);
}

export function formatAmount(value: number): string {
  return value.toLocaleString("ko-KR");
}

/** 퍼블 기본 마진율 (설정 연동 전) */
export const PUB_MARGIN_MIN = 0.15;
export const PUB_MARGIN_MAX = 0.5;

export function calcGroupExpenseTotals(
  lines: { paymentAmount: number }[],
  extraFees: { amount: number }[],
  discounts: { amount: number }[],
) {
  const totalOrder = lines.reduce((sum, line) => sum + line.paymentAmount, 0);
  const totalExtra = extraFees.reduce((sum, item) => sum + Math.max(0, item.amount), 0);
  const totalDiscount = discounts.reduce(
    (sum, item) => sum + Math.max(0, item.amount),
    0,
  );
  const totalExpense = totalOrder + totalExtra - totalDiscount;
  return { totalOrder, totalExtra, totalDiscount, totalExpense };
}

export function calcFinalUnitPrice(
  line: { paymentAmount: number; quantity: number },
  totalOrder: number,
  totalExpense: number,
): number {
  if (line.quantity <= 0) return 0;
  if (totalOrder <= 0) {
    return calcUnitPrice(line.quantity, line.paymentAmount);
  }
  const ratio = line.paymentAmount / totalOrder;
  const allocated = totalExpense * ratio;
  return Math.round(allocated / line.quantity);
}

export function calcRecommendedPrice(unitPrice: number, margin: number): number {
  if (margin >= 1 || unitPrice <= 0) return 0;
  return Math.round(unitPrice / (1 - margin));
}

export function formatRecommendedPriceRange(
  unitPrice: number,
  finalUnitPrice: number,
): string {
  const prices = [
    calcRecommendedPrice(unitPrice, PUB_MARGIN_MIN),
    calcRecommendedPrice(unitPrice, PUB_MARGIN_MAX),
    calcRecommendedPrice(finalUnitPrice, PUB_MARGIN_MIN),
    calcRecommendedPrice(finalUnitPrice, PUB_MARGIN_MAX),
  ].filter((p) => p > 0);
  if (prices.length === 0) return "—";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return `${formatAmount(min)}원`;
  return `${formatAmount(min)}~${formatAmount(max)}원`;
}

export function groupLinesByPaymentDate<T extends { paymentDate: string }>(
  lines: T[],
): { paymentDate: string; lines: T[] }[] {
  const map = new Map<string, T[]>();
  for (const line of lines) {
    const bucket = map.get(line.paymentDate) ?? [];
    bucket.push(line);
    map.set(line.paymentDate, bucket);
  }
  return [...map.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([paymentDate, groupLines]) => ({ paymentDate, lines: groupLines }));
}
