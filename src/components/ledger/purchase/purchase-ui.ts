import { cn } from "@/lib/utils";

/** 매입 그룹 카드 */
export function purchaseGroupCardClass(attention?: boolean) {
  return cn(
    "rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-sm)]",
    attention && "border-l-[3px] border-l-[var(--color-warning)]",
  );
}

export const purchaseGroupHeaderClass =
  "flex w-full items-center gap-2 px-2 py-1 text-left transition-colors hover:bg-[var(--primary-50)]/30";

export const purchaseGroupBodyClass =
  "min-w-0 space-y-2 border-t border-[var(--color-border)] px-2.5 py-2";

export const purchaseGroupFooterClass =
  "flex flex-wrap items-center justify-end gap-2 rounded-lg px-2.5 py-2";

/** PC 목록 테이블 */
export const purchaseTableScrollClass = "overflow-x-auto";

export const purchaseTableShellClass =
  "w-max min-w-full overflow-hidden rounded-lg border border-[var(--color-border)] bg-white";

export const purchaseTableHeaderCellClass =
  "flex min-h-8 items-center px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--color-text-muted)] bg-[var(--primary-50)]/50";

export const purchaseTableBodyCellClass =
  "flex min-h-9 items-center px-2.5 py-1.5 text-xs leading-snug text-[var(--color-text-primary)]";

export function purchaseTableRowClass(pending?: boolean) {
  return cn(
    "bg-white transition-colors hover:bg-[var(--primary-50)]/20",
    pending && "bg-[var(--primary-50)]/15",
  );
}

/** 상품매입 — 재고 미반영 라인 배경 */
export function purchaseProductStockPendingBgClass(pending?: boolean) {
  return pending ? "bg-red-50" : "bg-white";
}

export function purchaseProductLineClickClass(
  disabled?: boolean,
  stockPending?: boolean,
) {
  if (disabled) return "";
  return cn(
    "cursor-pointer transition-colors",
    stockPending ? "hover:bg-red-100" : "hover:bg-[var(--primary-50)]/25",
  );
}

export const purchaseStatusBadgeDoneClass =
  "inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-600/10";

export const purchaseStatusBadgePendingClass =
  "inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800 ring-1 ring-amber-600/10";

export const purchasePrimaryActionClass =
  "h-7 bg-[var(--primary-500)] px-2.5 text-xs text-white hover:bg-[var(--primary-600)]";
