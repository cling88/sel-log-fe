"use client";

import { useState } from "react";
import { ProductPurchaseGroupSummary } from "@/components/ledger/purchase/product-purchase-group-summary";
import { ProductPurchaseLineList } from "@/components/ledger/purchase/product-purchase-line-list";
import {
  purchaseGroupBodyClass,
  purchaseGroupCardClass,
  purchaseGroupFooterClass,
  purchaseGroupHeaderClass,
  purchaseStatusBadgePendingClass,
} from "@/components/ledger/purchase/purchase-ui";
import { Button } from "@/components/ui/button";
import { formatDisplayDate } from "@/lib/date";
import { calcGroupExpenseTotals } from "@/lib/purchase-product-calc";
import { formatWon } from "@/lib/utils";
import type { PurchaseGroupMeta } from "@/types/purchase-group";
import type { ProductPurchaseLine } from "@/types/purchase-product";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductPurchaseGroupListProps {
  groups: { paymentDate: string; lines: ProductPurchaseLine[] }[];
  groupMeta: Record<string, PurchaseGroupMeta>;
  onAddToGroup: (paymentDate: string) => void;
  onReflectStock: (lineId: string) => void;
  onCancelStockReflect: (lineId: string) => void;
  onLineClick: (lineId: string) => void;
  onEditGroup: (paymentDate: string) => void;
  onDeleteGroup: (paymentDate: string) => void;
  onSaveGroupSummary: (
    paymentDate: string,
    patch: Pick<PurchaseGroupMeta, "extraFees" | "discounts">,
  ) => void | Promise<void>;
  savingSummaryDate?: string | null;
  onBulkStockReflect: (paymentDate: string) => void;
  onToggleOrderCancel: (paymentDate: string) => void;
}

export function ProductPurchaseGroupList({
  groups,
  groupMeta,
  onAddToGroup,
  onReflectStock,
  onCancelStockReflect,
  onLineClick,
  onEditGroup,
  onDeleteGroup,
  onSaveGroupSummary,
  savingSummaryDate,
  onBulkStockReflect,
  onToggleOrderCancel,
}: ProductPurchaseGroupListProps) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(
    () => new Set(groups.map((g) => g.paymentDate)),
  );

  const toggle = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group, groupIndex) => {
        const expanded = expandedDates.has(group.paymentDate);
        const meta =
          groupMeta[group.paymentDate] ??
          ({
            groupName: `매입${groupIndex + 1}`,
            extraFees: [],
            discounts: [],
            orderCancelled: false,
          } satisfies PurchaseGroupMeta);
        const { totalOrder, totalExpense } = calcGroupExpenseTotals(
          group.lines,
          meta.extraFees,
          meta.discounts,
        );
        const pendingStock = group.lines.filter((l) => !l.stockReflected).length;
        const hasPendingStock = pendingStock > 0;
        const cancelled = meta.orderCancelled;

        return (
          <div
            key={group.paymentDate}
            className={cn(
              "relative",
              purchaseGroupCardClass(hasPendingStock && !cancelled),
            )}
          >
            {cancelled ? (
              <div
                className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-slate-900/50 backdrop-blur-[1px]"
                aria-hidden
              >
                <span className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-slate-800 shadow-md">
                  주문취소
                </span>
              </div>
            ) : null}

            <div className="flex items-center justify-between gap-2 px-2.5 py-1.5">
              <button
                type="button"
                onClick={() => toggle(group.paymentDate)}
                className={cn(purchaseGroupHeaderClass, "flex-1 rounded-md -mx-1")}
              >
                <span
                  className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary-50)] text-[var(--primary-600)]",
                    expanded && "bg-[var(--primary-100)]",
                  )}
                >
                  <ChevronDown
                    className={cn(
                      "size-3.5 transition-transform duration-200",
                      expanded && "rotate-180",
                    )}
                  />
                </span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {meta.groupName}
                    </span>
                    {hasPendingStock && !cancelled ? (
                      <span className={purchaseStatusBadgePendingClass}>
                        재고 미반영 {pendingStock}
                      </span>
                    ) : !cancelled ? (
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        재고 반영 완료
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-[var(--color-text-muted)]">
                    {formatDisplayDate(group.paymentDate)} · {group.lines.length}건
                  </span>
                </span>
              </button>

              <div className="flex shrink-0 items-center gap-2">
                <p className="text-sm font-semibold tabular-nums tracking-tight text-[var(--color-expense)]">
                  -{formatWon(totalExpense)}
                </p>
                {!cancelled ? (
                  <div className="flex gap-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="size-7 text-[var(--color-text-muted)] hover:text-[var(--primary-600)]"
                      aria-label="그룹 수정"
                      onClick={() => onEditGroup(group.paymentDate)}
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="size-7 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                      aria-label="그룹 삭제"
                      onClick={() => onDeleteGroup(group.paymentDate)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>

            {expanded ? (
              <div
                className={cn(
                  purchaseGroupBodyClass,
                  cancelled && "pointer-events-none opacity-50",
                )}
              >
                <ProductPurchaseLineList
                  lines={group.lines}
                  pricing={{ totalOrder, totalExpense }}
                  groupDisabled={cancelled}
                  onReflectStock={onReflectStock}
                  onCancelStockReflect={onCancelStockReflect}
                  onLineClick={onLineClick}
                />

                <ProductPurchaseGroupSummary
                  groupKey={group.paymentDate}
                  totalOrder={totalOrder}
                  meta={meta}
                  disabled={cancelled}
                  saving={savingSummaryDate === group.paymentDate}
                  onSave={(patch) => onSaveGroupSummary(group.paymentDate, patch)}
                />

                <div className={purchaseGroupFooterClass}>
                  {!cancelled ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        className="bg-[var(--primary-500)] text-white hover:bg-[var(--primary-600)]"
                        onClick={() => onAddToGroup(group.paymentDate)}
                      >
                        + 내역 추가
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={pendingStock === 0}
                        className="border-[var(--color-border)] bg-white"
                        onClick={() => onBulkStockReflect(group.paymentDate)}
                      >
                        일괄 재고반영
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="border-[var(--color-border)] bg-white text-[var(--color-text-secondary)]"
                        onClick={() => onToggleOrderCancel(group.paymentDate)}
                      >
                        일괄 주문취소
                      </Button>
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="bg-white"
                      onClick={() => onToggleOrderCancel(group.paymentDate)}
                    >
                      주문취소 해제
                    </Button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
