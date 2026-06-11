import type { LedgerEarliestMonthTab } from "@/lib/api/ledger";
import type { LedgerTabId } from "@/types/common";

export type MonthTab = { value: string; month: number; label: string };

/** URL `month=2026-all` — 선택 연도 전체 */
export const LEDGER_MONTH_ALL_SUFFIX = "-all";

export type LedgerListScope = {
  /** URL·쿼리키용 (`2026-06` | `2026-all`) */
  scopeKey: string;
  year: number;
  /** null이면 해당 연도 전체 */
  month: number | null;
};

export function toLedgerMonthAllParam(year: number) {
  return `${year}${LEDGER_MONTH_ALL_SUFFIX}`;
}

export function isLedgerMonthAllParam(value: string | null | undefined): boolean {
  return !!value && value.endsWith(LEDGER_MONTH_ALL_SUFFIX);
}

export function parseLedgerMonthAllYear(value: string): number | null {
  if (!isLedgerMonthAllParam(value)) return null;
  const year = Number(value.slice(0, 4));
  return Number.isFinite(year) && year >= 2000 && year <= 2100 ? year : null;
}

export function parseLedgerMonthFilter(
  monthParam: string | null,
): LedgerListScope {
  if (monthParam && isLedgerMonthAllParam(monthParam)) {
    const year = parseLedgerMonthAllYear(monthParam);
    if (year != null) {
      return { scopeKey: monthParam, year, month: null };
    }
  }
  const parsed = parseYearMonth(monthParam);
  if (parsed) {
    return {
      scopeKey: toYearMonthParam(parsed.year, parsed.month),
      year: parsed.year,
      month: parsed.month,
    };
  }
  const { year, month } = getTodayYearMonth();
  return { scopeKey: toYearMonthParam(year, month), year, month };
}

/** 목록 API — `month=YYYY-MM` 또는 연도 전체 시 `year=YYYY` */
export function toLedgerListApiScope(
  scope: LedgerListScope,
): { month?: string; year?: string } {
  if (scope.month == null) {
    return { year: String(scope.year) };
  }
  return { month: scope.scopeKey };
}

export type MonthTabRangeOptions = {
  earliestYm: string | null;
  extraMonths?: string[];
};

/** 매입·매출·수익만 월별 조회. 상품관리는 마스터 데이터라 월 필터 없음 */
export function isMonthScopedLedgerTab(tab: LedgerTabId): boolean {
  return tab === "purchase" || tab === "sale" || tab === "income";
}

export function toEarliestMonthTab(tab: LedgerTabId): LedgerEarliestMonthTab | null {
  if (tab === "purchase" || tab === "sale" || tab === "income") return tab;
  return null;
}

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

/** API earliest-month + 수동 추가 월 기준 탭 목록 */
export function buildMonthTabs(
  year: number,
  options: MonthTabRangeOptions,
): MonthTab[] {
  const { year: currentYear, month: currentMonth } = getTodayYearMonth();
  if (year > currentYear) return [];

  const values = new Set<string>();

  if (options.earliestYm) {
    const start = parseYearMonth(options.earliestYm);
    if (start && start.year === year) {
      const maxMonth = year === currentYear ? currentMonth : 12;
      for (let m = start.month; m <= maxMonth; m += 1) {
        values.add(toYearMonthParam(year, m));
      }
    }
  }

  for (const ym of options.extraMonths ?? []) {
    const parsed = parseYearMonth(ym);
    if (parsed?.year === year) values.add(ym);
  }

  // 데이터 없어도 현재 연도는 이번 달 탭 항상 표시
  if (year === currentYear) {
    values.add(toYearMonthParam(currentYear, currentMonth));
  }

  const monthTabs = Array.from(values)
    .sort(compareYearMonth)
    .map((value) => {
      const parsed = parseYearMonth(value)!;
      return { value, month: parsed.month, label: `${parsed.month}월` };
    });

  return [
    { value: toLedgerMonthAllParam(year), month: 0, label: "전체" },
    ...monthTabs,
  ];
}

/** 상품 이력 등 레거시 — 고정 시작 월 기준 */
export function listMonthTabsForYear(tab: LedgerTabId, year: number) {
  const startYm = getTabStartYearMonth(tab);
  const [startYearStr, startMonthStr] = startYm.split("-");
  const startYear = Number(startYearStr);
  const startMonth = Number(startMonthStr);
  const { year: currentYear, month: currentMonth } = getTodayYearMonth();

  if (year < startYear || year > currentYear) return [];

  const minMonth = year === startYear ? startMonth : 1;
  const maxMonth = year === currentYear ? currentMonth : 12;

  const tabs: MonthTab[] = [];
  for (let month = minMonth; month <= maxMonth; month += 1) {
    tabs.push({
      value: toYearMonthParam(year, month),
      month,
      label: `${month}월`,
    });
  }
  return tabs;
}

export function resolveSelectedMonth(
  year: number,
  preferredMonth: number,
  tabs: MonthTab[],
) {
  if (tabs.length === 0) {
    return { year, month: preferredMonth };
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
  return resolveSelectedMonth(year, preferredMonth, tabs);
}

export function listYearOptions() {
  const { year: currentYear } = getTodayYearMonth();
  const [startYearStr] = PUB_LEDGER_START_YM.split("-");
  const startYear = Number(startYearStr);
  return Array.from({ length: currentYear - startYear + 1 }, (_, i) => startYear + i);
}

/** 장부 시작 월 ~ 이번 달 범위에서 이전/다음 달 (없으면 null) */
export function shiftYearMonth(
  year: number,
  month: number,
  direction: "prev" | "next",
): { year: number; month: number } | null {
  const tab: LedgerTabId = "purchase";
  const tabs = listMonthTabsForYear(tab, year);
  const current = toYearMonthParam(year, month);
  let idx = tabs.findIndex((t) => t.value === current);

  if (idx === -1) {
    const resolved = resolveSelectedMonthForTab(tab, year, month);
    if (resolved.year === year && resolved.month === month) return null;
    return shiftYearMonth(resolved.year, resolved.month, direction);
  }

  if (direction === "prev") {
    if (idx > 0) {
      const prev = parseYearMonth(tabs[idx - 1].value);
      return prev;
    }
    const prevYearTabs = listMonthTabsForYear(tab, year - 1);
    if (prevYearTabs.length === 0) return null;
    return parseYearMonth(prevYearTabs[prevYearTabs.length - 1].value);
  }

  if (idx < tabs.length - 1) {
    return parseYearMonth(tabs[idx + 1].value);
  }
  const nextYearTabs = listMonthTabsForYear(tab, year + 1);
  if (nextYearTabs.length === 0) return null;
  return parseYearMonth(nextYearTabs[0].value);
}

/** ISO 날짜 문자열이 지정 연·월에 속하는지 (API 이력 필터용) */
export function isoMatchesYearMonth(
  iso: string,
  year: number,
  month: number,
): boolean {
  const match = /^(\d{4})-(\d{2})/.exec(iso);
  if (match) {
    return Number(match[1]) === year && Number(match[2]) === month;
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  return d.getFullYear() === year && d.getMonth() + 1 === month;
}
