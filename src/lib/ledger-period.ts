import type { LedgerTabId } from "@/types/common";

/** 퍼블 기준 장부 사용 시작 월 (추후 BE createdAt 연동) */
export const PUB_LEDGER_START_YM = "2026-01";

export function getTodayYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

export function parseYearMonth(value: string | null): { year: number; month: number } | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export function toYearMonthParam(year: number, month: number) {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function compareYearMonth(a: string, b: string) {
  return a.localeCompare(b);
}

function getTabStartYearMonth(_tab: LedgerTabId): string {
  return PUB_LEDGER_START_YM;
}

export function listMonthTabsForYear(tab: LedgerTabId, year: number) {
  const startYm = getTabStartYearMonth(tab);
  const [startYearStr, startMonthStr] = startYm.split("-");
  const startYear = Number(startYearStr);
  const startMonth = Number(startMonthStr);
  const { year: currentYear, month: currentMonth } = getTodayYearMonth();

  if (year < startYear || year > currentYear) return [];

  const minMonth = year === startYear ? startMonth : 1;
  const maxMonth = year === currentYear ? currentMonth : 12;

  const tabs: { value: string; month: number; label: string }[] = [];
  for (let month = minMonth; month <= maxMonth; month += 1) {
    tabs.push({
      value: toYearMonthParam(year, month),
      month,
      label: `${month}월`,
    });
  }
  return tabs;
}

export function resolveSelectedMonthForTab(
  tab: LedgerTabId,
  year: number,
  preferredMonth: number,
) {
  const tabs = listMonthTabsForYear(tab, year);
  if (tabs.length === 0) {
    const { year: y, month: m } = getTodayYearMonth();
    return { year: y, month: m };
  }

  const preferredValue = toYearMonthParam(year, preferredMonth);
  if (tabs.some((t) => t.value === preferredValue)) {
    return { year, month: preferredMonth };
  }

  const { year: currentYear, month: currentMonth } = getTodayYearMonth();
  if (year === currentYear) {
    const currentValue = toYearMonthParam(currentYear, currentMonth);
    const currentTab = tabs.find((t) => t.value === currentValue);
    if (currentTab) return { year: currentYear, month: currentMonth };
  }

  const last = tabs[tabs.length - 1];
  return { year, month: last.month };
}

export function listYearOptions() {
  const { year: currentYear } = getTodayYearMonth();
  const [startYearStr] = PUB_LEDGER_START_YM.split("-");
  const startYear = Number(startYearStr);
  return Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i);
}
