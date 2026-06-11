"use client";

import { usePurchaseGroupExpanded } from "@/hooks/use-purchase-group-expanded";
import { ProductPurchaseDateTotals } from "@/components/ledger/purchase/product-purchase-date-totals";
import { ProductPurchaseGroupSummary } from "@/components/ledger/purchase/product-purchase-group-summary";
import { PurchaseVendorLabel } from "@/components/ledger/purchase/purchase-vendor-label";
import { SupplyExpenseLineList } from "@/components/ledger/purchase/supply/supply-expense-line-list";
import {
  productPurchaseGroupBodyClass,
  productPurchaseGroupCardClass,
  productPurchaseGroupFooterClass,
  productPurchaseGroupHeaderClass,
  purchaseGroupFooterClass,
  purchaseStatusBadgePendingClass,
} from "@/components/ledger/purchase/purchase-ui";
import { Button } from "@/components/ui/button";
import { formatDisplayDate } from "@/lib/date";
import { formatAmount } from "@/lib/purchase-product-calc";
import { formatWon } from "@/lib/utils";
import type { PurchaseGroupAdjustment } from "@/types/purchase-group";
import type { SupplyDateGroup } from "@/types/purchase-supply";
import { supplyVendorGroupKey } from "@/types/purchase-supply";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SupplyExpenseGroupListProps {
  storageScopeKey: string;
  groups: SupplyDateGroup[];
  onAddToGroup: (paymentDate: string) => void;
  onReflectStock: (lineId: string) => void;
  onCancelStockReflect: (lineId: string) => void;
  onLineClick: (lineId: string) => void;
  onSaveVendorSummary: (
    paymentDate: string,
    vendorId: string | null,
    patch: { extraFees: PurchaseGroupAdjustment[]; discounts: PurchaseGroupAdjustment[] },
  ) => void | Promise<void>;
  savingSummaryKey?: string | null;
  stockActionsDisabled?: boolean;
}

function summarySaveKey(paymentDate: string, vendorId: string | null) {
  return `${paymentDate}:${supplyVendorGroupKey(vendorId)}`;
}

export function SupplyExpenseGroupList({
  storageScopeKey,
  groups,
  onAddToGroup,
  onReflectStock,
  onCancelStockReflect,
  onLineClick,
  onSaveVendorSummary,
  savingSummaryKey,
  stockActionsDisabled = false,
}: SupplyExpenseGroupListProps) {
  const { isExpanded, toggle } = usePurchaseGroupExpanded(
    "supply",
    storageScopeKey,
    groups,
  );

  return (
    <div className="flex flex-col gap-2">
      {groups.map((group, groupIndex) => {
        const expanded = isExpanded(group.paymentDate);
        const groupName =
          group.groupName?.trim() || `부가${groupIndex + 1}`;
        const allLines = group.vendorGroups.flatMap((vg) => vg.lines);
        const lineCount = allLines.length;
        const pendingStock = allLines.filter((l) => !l.stockReflected).length;
        const hasPendingStock = pendingStock > 0;

        return (
          <div
            key={group.paymentDate}
            className={productPurchaseGroupCardClass(hasPendingStock)}
          >
            <div className="flex items-center justify-between gap-2 py-1 pl-3 pr-2 sm:pl-4">
              <button
                type="button"
                onClick={() => toggle(group.paymentDate)}
                className={cn(productPurchaseGroupHeaderClass, "flex-1 rounded-md")}
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
                    {hasPendingStock ? (
                      <span className={purchaseStatusBadgePendingClass}>
                        재고 미반영 {pendingStock}
                      </span>
                    ) : (
                      <span className="text-[11px] text-[var(--color-text-muted)]">
                        재고 반영 완료
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-[var(--color-text-muted)]">
                    {formatDisplayDate(group.paymentDate)} · {lineCount}건 ·
                    구매처 {group.vendorGroups.length}곳
                  </span>
                </span>
              </button>

              <p className="shrink-0 text-sm font-semibold tabular-nums tracking-tight text-[var(--color-expense)]">
                -{formatWon(group.totals.grandTotal)}
              </p>
            </div>

            {expanded ? (
              <div className={productPurchaseGroupBodyClass}>
                <div className="flex flex-col">
                  {group.vendorGroups.map((vendorGroup, vendorIndex) => {
                    const vendorLinesTotal = vendorGroup.lines.reduce(
                      (sum, line) => sum + line.paymentAmount,
                      0,
                    );
                    const vendorRowKey = supplyVendorGroupKey(vendorGroup.vendorId);
                    const vendorKey = summarySaveKey(
                      group.paymentDate,
                      vendorGroup.vendorId,
                    );
                    const vendorPending = vendorGroup.lines.filter(
                      (l) => !l.stockReflected,
                    ).length;

                    return (
                      <div
                        key={vendorRowKey}
                        className={cn(
                          "relative",
                          vendorIndex > 0 &&
                            "mt-2.5 border-t border-[var(--color-border)]/40 pt-2.5",
                        )}
                      >
                        <div className="mb-[6px] flex flex-wrap items-center justify-between gap-2 px-[4px] py-1">
                          <div className="flex min-w-0 items-center gap-[6px]">
                            <PurchaseVendorLabel
                              vendorId={vendorGroup.vendorId}
                              vendorSnapshot={vendorGroup.vendorSnapshot}
                              vendor={
                                vendorGroup.vendorSnapshot?.name ??
                                vendorGroup.lines[0]?.vendor
                              }
                              className="text-sm font-semibold text-[var(--color-text-primary)]"
                            />
                            <p className="text-[11px] text-[var(--color-text-muted)]">
                              {vendorGroup.lines.length}건
                              {vendorPending > 0
                                ? ` · 재고 미반영 ${vendorPending}`
                                : ""}
                            </p>
                          </div>
                          <p className="text-sm font-semibold tabular-nums text-[var(--color-expense)]">
                            -{formatAmount(vendorGroup.subtotal)}원
                          </p>
                        </div>

                        <SupplyExpenseLineList
                          lines={vendorGroup.lines}
                          hideVendorColumn
                          stockActionsDisabled={stockActionsDisabled}
                          onReflectStock={onReflectStock}
                          onCancelStockReflect={onCancelStockReflect}
                          onLineClick={onLineClick}
                        />

                        <ProductPurchaseGroupSummary
                          groupKey={vendorKey}
                          totalOrder={vendorLinesTotal}
                          meta={{
                            groupName: "",
                            extraFees: vendorGroup.extraFees,
                            discounts: vendorGroup.discounts,
                            orderCancelled: vendorGroup.orderCancelled,
                          }}
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
                    );
                  })}
                </div>

                <ProductPurchaseDateTotals totals={group.totals} />

                <div className={purchaseGroupFooterClass}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 border-[var(--color-border)] bg-white text-xs shadow-none hover:bg-[var(--primary-50)]/40"
                    onClick={() => onAddToGroup(group.paymentDate)}
                  >
                    + 내역 추가
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
