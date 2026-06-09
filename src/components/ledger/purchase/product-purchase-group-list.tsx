"use client";

import { useState } from "react";
import { ProductPurchaseDateTotals } from "@/components/ledger/purchase/product-purchase-date-totals";
import { ProductPurchaseGroupSummary } from "@/components/ledger/purchase/product-purchase-group-summary";
import { ProductPurchaseLineList } from "@/components/ledger/purchase/product-purchase-line-list";
import { PurchaseVendorLabel } from "@/components/ledger/purchase/purchase-vendor-label";
import {
  purchaseGroupBodyClass,
  purchaseGroupCardClass,
  purchaseGroupFooterClass,
  purchaseGroupHeaderClass,
  purchaseStatusBadgePendingClass,
} from "@/components/ledger/purchase/purchase-ui";
import { Button } from "@/components/ui/button";
import { formatDisplayDate } from "@/lib/date";
import { formatAmount } from "@/lib/purchase-product-calc";
import { formatWon } from "@/lib/utils";
import {
  vendorGroupLinesTotal,
  type PurchaseDateGroup,
  type PurchaseGroupAdjustment,
} from "@/types/purchase-group";
import { ChevronDown, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductPurchaseGroupListProps {
  groups: PurchaseDateGroup[];
  onAddToGroup: (paymentDate: string) => void;
  onReflectStock: (lineId: string) => void;
  onCancelStockReflect: (lineId: string) => void;
  onLineClick: (lineId: string) => void;
  onEditGroup: (paymentDate: string) => void;
  onDeleteGroup: (paymentDate: string) => void;
  onSaveVendorSummary: (
    paymentDate: string,
    vendorId: string,
    patch: { extraFees: PurchaseGroupAdjustment[]; discounts: PurchaseGroupAdjustment[] },
  ) => void | Promise<void>;
  savingSummaryKey?: string | null;
  onBulkStockReflect: (paymentDate: string) => void;
  onBulkVendorStockReflect: (paymentDate: string, vendorId: string) => void;
  onToggleDateOrderCancel: (paymentDate: string) => void;
  onToggleVendorOrderCancel: (paymentDate: string, vendorId: string) => void;
}

function summarySaveKey(paymentDate: string, vendorId: string) {
  return `${paymentDate}:${vendorId}`;
}

export function ProductPurchaseGroupList({
  groups,
  onAddToGroup,
  onReflectStock,
  onCancelStockReflect,
  onLineClick,
  onEditGroup,
  onDeleteGroup,
  onSaveVendorSummary,
  savingSummaryKey,
  onBulkStockReflect,
  onBulkVendorStockReflect,
  onToggleDateOrderCancel,
  onToggleVendorOrderCancel,
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
        const groupName =
          group.groupName?.trim() || `매입${groupIndex + 1}`;
        const allLines = group.vendorGroups.flatMap((vg) => vg.lines);
        const lineCount = allLines.length;
        const pendingStock = allLines.filter((l) => !l.stockReflected).length;
        const hasPendingStock = pendingStock > 0;
        const dateCancelled = group.orderCancelled;

        return (
          <div
            key={group.paymentDate}
            className={cn(
              "relative",
              purchaseGroupCardClass(hasPendingStock && !dateCancelled),
            )}
          >
            {dateCancelled ? (
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
                      {groupName}
                    </span>
                    {hasPendingStock && !dateCancelled ? (
                      <span className={purchaseStatusBadgePendingClass}>
                        재고 미반영 {pendingStock}
                      </span>
                    ) : !dateCancelled ? (
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        재고 반영 완료
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-[var(--color-text-muted)]">
                    {formatDisplayDate(group.paymentDate)} · {lineCount}건 ·
                    구매처 {group.vendorGroups.length}곳
                  </span>
                </span>
              </button>

              <div className="flex shrink-0 items-center gap-2">
                <p className="text-sm font-semibold tabular-nums tracking-tight text-[var(--color-expense)]">
                  -{formatWon(group.totals.grandTotal)}
                </p>
                {!dateCancelled ? (
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
                  dateCancelled && "pointer-events-none opacity-50",
                )}
              >
                <div className="flex flex-col gap-4">
                  {group.vendorGroups.map((vendorGroup) => {
                    const vendorLinesTotal = vendorGroupLinesTotal(
                      vendorGroup.lines,
                    );
                    const vendorKey = summarySaveKey(
                      group.paymentDate,
                      vendorGroup.vendorId,
                    );
                    const vendorCancelled = vendorGroup.orderCancelled;
                    const vendorPending = vendorGroup.lines.filter(
                      (l) => !l.stockReflected,
                    ).length;

                    return (
                      <div
                        key={vendorGroup.vendorId}
                        className="relative rounded-lg border border-[var(--color-border)]/90 bg-white"
                      >
                        {vendorCancelled && !dateCancelled ? (
                          <div
                            className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center rounded-lg bg-slate-900/40"
                            aria-hidden
                          >
                            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800 shadow">
                              구매처 주문취소
                            </span>
                          </div>
                        ) : null}

                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)]/80 px-2.5 py-2">
                          <div className="min-w-0">
                            <PurchaseVendorLabel
                              vendorId={vendorGroup.vendorId}
                              vendorSnapshot={vendorGroup.vendorSnapshot}
                              vendor={vendorGroup.vendorSnapshot.name}
                              className="text-sm font-semibold text-[var(--color-text-primary)]"
                            />
                            <p className="mt-0.5 text-[11px] text-[var(--color-text-muted)]">
                              {vendorGroup.lines.length}건
                              {vendorPending > 0 && !vendorCancelled
                                ? ` · 재고 미반영 ${vendorPending}`
                                : ""}
                            </p>
                          </div>
                          <p className="text-sm font-semibold tabular-nums text-[var(--color-expense)]">
                            -{formatAmount(vendorGroup.subtotal)}원
                          </p>
                        </div>

                        <div
                          className={cn(
                            "px-1 pb-2 pt-1",
                            vendorCancelled && "opacity-60",
                          )}
                        >
                          <ProductPurchaseLineList
                            lines={vendorGroup.lines}
                            pricing={{
                              totalOrder: vendorLinesTotal,
                              totalExpense: vendorGroup.subtotal,
                            }}
                            groupDisabled={dateCancelled || vendorCancelled}
                            onReflectStock={onReflectStock}
                            onCancelStockReflect={onCancelStockReflect}
                            onLineClick={onLineClick}
                          />

                          <div className="px-2">
                            <ProductPurchaseGroupSummary
                              groupKey={vendorKey}
                              totalOrder={vendorLinesTotal}
                              meta={{
                                groupName: "",
                                extraFees: vendorGroup.extraFees,
                                discounts: vendorGroup.discounts,
                                orderCancelled: vendorGroup.orderCancelled,
                              }}
                              disabled={dateCancelled || vendorCancelled}
                              saving={savingSummaryKey === vendorKey}
                              onSave={(patch) =>
                                onSaveVendorSummary(
                                  group.paymentDate,
                                  vendorGroup.vendorId,
                                  patch,
                                )
                              }
                            />
                          </div>

                          {!dateCancelled ? (
                            <div className="flex justify-end gap-2 px-2 pt-1">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={vendorPending === 0 || vendorCancelled}
                                className="h-7 border-[var(--color-border)] bg-white text-xs"
                                onClick={() =>
                                  onBulkVendorStockReflect(
                                    group.paymentDate,
                                    vendorGroup.vendorId,
                                  )
                                }
                              >
                                재고반영
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 border-[var(--color-border)] bg-white text-xs"
                                onClick={() =>
                                  onToggleVendorOrderCancel(
                                    group.paymentDate,
                                    vendorGroup.vendorId,
                                  )
                                }
                              >
                                {vendorCancelled
                                  ? "구매처 취소 해제"
                                  : "구매처 주문취소"}
                              </Button>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <ProductPurchaseDateTotals totals={group.totals} />

                <div className={purchaseGroupFooterClass}>
                  {!dateCancelled ? (
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
                        onClick={() => onToggleDateOrderCancel(group.paymentDate)}
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
                      onClick={() => onToggleDateOrderCancel(group.paymentDate)}
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
