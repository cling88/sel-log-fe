const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function todayIso(): string {
  return isoFromDate(new Date());
}

export function isoFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseToDate(value: string, year = new Date().getFullYear()): Date {
  if (ISO_DATE_RE.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }

  const short = value.match(/^(\d{1,2})-(\d{1,2})$/);
  if (short) {
    const m = Number(short[1]);
    const d = Number(short[2]);
    return new Date(year, m - 1, d);
  }

  return new Date();
}

/** 표시용 — 예: 2026년 05월 22일 */
export function formatDisplayDate(value: string): string {
  if (!value) return "";
  if (ISO_DATE_RE.test(value)) {
    const [y, m, d] = value.split("-");
    return `${y}년 ${m}월 ${d}일`;
  }

  const short = value.match(/^(\d{1,2})-(\d{1,2})$/);
  if (short) {
    const year = new Date().getFullYear();
    const m = String(Number(short[1])).padStart(2, "0");
    const d = String(Number(short[2])).padStart(2, "0");
    return `${year}년 ${m}월 ${d}일`;
  }

  return value;
}

export function formatInputDate(value: string): string {
  if (!value) return formatDisplayDate(todayIso());
  return formatDisplayDate(value);
}
