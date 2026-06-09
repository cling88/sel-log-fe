"use client";

import { formatAmount } from "@/lib/purchase-product-calc";
import type { PurchaseDateGroupTotals } from "@/types/purchase-group";

interface ProductPurchaseDateTotalsProps {
  totals: PurchaseDateGroupTotals;
}

export function ProductPurchaseDateTotals({
  totals,
}: ProductPurchaseDateTotalsProps) {
  return (
    <div className="mt-2 space-y-0.5 border-t border-[var(--color-border)]/50 pt-2">
      <p className="text-[11px] font-medium text-[var(--color-text-muted)]">
        결제일 합계
      </p>
      <div className="flex flex-wrap items-center justify-end gap-x-2.5 gap-y-1 text-[13px] tabular-nums">
        <span className="text-[var(--color-text-muted)]">주문금액</span>
        <span className="font-medium text-[var(--color-text-primary)]">
          {formatAmount(totals.linesTotal)}원
        </span>
        <span className="text-[var(--color-text-muted)]">총 추가금</span>
        <span className="font-medium text-[var(--color-expense)]">
          {formatAmount(totals.extraFeesTotal)}원
        </span>
        <span className="text-[var(--color-text-muted)]">총 할인금</span>
        <span className="font-medium text-[var(--primary-400)]">
          {formatAmount(totals.discountsTotal)}원
        </span>
        <span className="text-[var(--color-text-muted)]">= 총금액</span>
        <span className="text-base font-semibold text-[var(--color-expense)]">
          {formatAmount(totals.grandTotal)}원
        </span>
      </div>
    </div>
  );
}
