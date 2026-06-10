import { DEFAULT_USER_SETTINGS } from "@/types/settings";

export function calcUnitPrice(quantity: number, paymentAmount: number): number {
  if (quantity <= 0) return 0;
  return Math.round(paymentAmount / quantity);
}

export function formatAmount(value: number): string {
  return value.toLocaleString("ko-KR");
}

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

export type MarginRateRange = {
  min: number;
  max: number;
};

export function formatRecommendedPriceRange(
  unitPrice: number,
  finalUnitPrice: number,
  margins: MarginRateRange = {
    min: DEFAULT_USER_SETTINGS.marginMinRate,
    max: DEFAULT_USER_SETTINGS.marginMaxRate,
  },
): string {
  const prices = [
    calcRecommendedPrice(unitPrice, margins.min),
    calcRecommendedPrice(unitPrice, margins.max),
    calcRecommendedPrice(finalUnitPrice, margins.min),
    calcRecommendedPrice(finalUnitPrice, margins.max),
  ].filter((p) => p > 0);
  if (prices.length === 0) return "—";
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  if (min === max) return `${formatAmount(min)}원`;
  return `${formatAmount(min)}~${formatAmount(max)}원`;
}
