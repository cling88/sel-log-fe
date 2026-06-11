import type { PeriodPreset } from "@/types/common";

const SUMMARY_PERIOD_KEY = "sellog:ledger-summary-period";
const TREND_EXPANDED_KEY = "sellog:ledger-trend-expanded";

const PERIOD_PRESETS: PeriodPreset[] = ["all", "year", "month", "week", "today"];

function isPeriodPreset(value: string | null): value is PeriodPreset {
  return PERIOD_PRESETS.includes(value as PeriodPreset);
}

export function readLedgerSummaryPeriod(): PeriodPreset {
  if (typeof globalThis.localStorage === "undefined") return "today";
  const stored = globalThis.localStorage.getItem(SUMMARY_PERIOD_KEY);
  return isPeriodPreset(stored) ? stored : "today";
}

export function writeLedgerSummaryPeriod(period: PeriodPreset): void {
  if (typeof globalThis.localStorage === "undefined") return;
  globalThis.localStorage.setItem(SUMMARY_PERIOD_KEY, period);
}

export function readLedgerTrendExpanded(): boolean {
  if (typeof globalThis.localStorage === "undefined") return true;
  const stored = globalThis.localStorage.getItem(TREND_EXPANDED_KEY);
  if (stored === "0" || stored === "false") return false;
  if (stored === "1" || stored === "true") return true;
  return true;
}

export function writeLedgerTrendExpanded(expanded: boolean): void {
  if (typeof globalThis.localStorage === "undefined") return;
  globalThis.localStorage.setItem(TREND_EXPANDED_KEY, expanded ? "1" : "0");
}
