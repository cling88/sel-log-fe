/** 0.0636 → "6.36" */
export function feeRateToPercentInput(rate: number): string {
  if (!Number.isFinite(rate) || rate <= 0) return "";
  const pct = rate * 100;
  const rounded = Math.round(pct * 100) / 100;
  return String(rounded);
}

/** "6.36" → 0.0636 */
export function percentInputToFeeRate(value: string): number | null {
  const trimmed = value.trim().replace(/%/g, "");
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (Number.isNaN(n) || n < 0) return null;
  return Math.min(0.2, n / 100);
}

export function formatFeeRatePercent(rate: number): string {
  if (!Number.isFinite(rate) || rate <= 0) return "—";
  const pct = rate * 100;
  const text =
    pct % 1 === 0 ? String(pct) : pct.toFixed(2).replace(/\.?0+$/, "");
  return `${text}%`;
}

export function isHttpUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
