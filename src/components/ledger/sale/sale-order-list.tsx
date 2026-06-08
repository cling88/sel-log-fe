"use client";

import { useState } from "react";
import {
  purchaseGroupBodyClass,
  purchaseGroupCardClass,
  purchaseGroupFooterClass,
  purchaseGroupHeaderClass,
  purchaseTableBodyCellClass,
  purchaseTableHeaderCellClass,
  purchaseTableScrollClass,
  purchaseTableShellClass,
} from "@/components/ledger/purchase/purchase-ui";
import { Button } from "@/components/ui/button";
import { formatDisplayDate } from "@/lib/date";
import { formatAmount } from "@/lib/purchase-product-calc";
import { formatSaleChannelLabel } from "@/lib/sale-channel-label";
import type { SaleOrder } from "@/types/sale";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const SALE_ITEM_GRID_CLASS =
  "grid w-full min-w-[640px] grid-cols-[minmax(88px,0.8fr)_minmax(140px,1.4fr)_56px_88px_96px]";

interface SaleOrderListProps {
  orders: SaleOrder[];
  onEdit: (orderId: string) => void;
  onToggleCancel: (order: SaleOrder) => void;
  onRemove: (order: SaleOrder) => void;
}

function calcItemsSubtotal(order: SaleOrder) {
  return order.items.reduce((sum, item) => sum + item.lineAmount, 0);
}

function calcUnitPrice(item: { quantity: number; lineAmount: number }) {
  if (item.quantity <= 0) return 0;
  return Math.round(item.lineAmount / item.quantity);
}

export function SaleOrderList({
  orders,
  onEdit,
  onToggleCancel,
  onRemove,
}: SaleOrderListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(orders.map((o) => o.id)),
  );

  const toggle = (orderId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {orders.map((order) => {
        const expanded = expandedIds.has(order.id);
        const cancelled = order.status === "cancelled";
        const itemsSubtotal = calcItemsSubtotal(order);

        const channelLabel = formatSaleChannelLabel(
          order.channelId,
          order.channel,
        );

        return (
          <div
            key={order.id}
            className={cn("relative", purchaseGroupCardClass(false))}
          >
            {cancelled ? (
              <>
                <span className="absolute left-2.5 top-2 z-20 rounded border border-red-600/25 bg-red-50 px-1.5 py-px text-[10px] font-semibold leading-tight text-[var(--color-danger)]">
                  주문취소
                </span>
                <div className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-xl bg-slate-900/50 backdrop-blur-[1px]">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="bg-white shadow-md"
                    onClick={() => void onToggleCancel(order)}
                  >
                    주문취소 해제
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-[var(--color-danger)]/40 bg-white text-[var(--color-danger)] shadow-md hover:bg-red-50"
                    onClick={() => void onRemove(order)}
                  >
                    삭제
                  </Button>
                </div>
              </>
            ) : null}

            <button
              type="button"
              onClick={() => toggle(order.id)}
              className={cn(purchaseGroupHeaderClass, "w-full justify-between")}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary-50)] text-[var(--primary-600)]",
                    expanded && "bg-[var(--primary-100)]",
                  )}
                >
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform duration-200",
                      !expanded && "-rotate-90",
                    )}
                  />
                </span>
                <div className="min-w-0 text-left">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                      {formatDisplayDate(order.orderDate)} · {order.orderNo}
                    </p>
                    {channelLabel !== "선택" ? (
                      <span className="shrink-0 rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-1.5 py-px text-[10px] font-medium text-[var(--color-text-secondary)]">
                        {channelLabel}
                      </span>
                    ) : null}
                  </div>
                  <p className="truncate text-xs text-[var(--color-text-secondary)]">
                    {order.customerName} · 품목 {order.items.length}건
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!cancelled ? (
                  <span className="rounded-full border border-emerald-600/20 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                    정상
                  </span>
                ) : null}
                <span className="tabular-nums text-sm font-semibold text-[var(--color-text-primary)]">
                  {formatAmount(order.totalAmount)}원
                </span>
              </div>
            </button>

            {expanded ? (
              <div
                className={cn(
                  purchaseGroupBodyClass,
                  cancelled && "pointer-events-none opacity-50",
                )}
              >
                <div className={purchaseTableScrollClass}>
                  <div className={purchaseTableShellClass}>
                    <div className={SALE_ITEM_GRID_CLASS}>
                      {["SKU", "상품명", "수량", "개당", "금액"].map((label) => (
                        <div key={label} className={purchaseTableHeaderCellClass}>
                          {label}
                        </div>
                      ))}
                    </div>
                    {order.items.map((item, index) => (
                      <div
                        key={`${order.id}-item-${index}`}
                        className={cn(SALE_ITEM_GRID_CLASS, "border-t border-[var(--color-border)]")}
                      >
                        <div className={cn(purchaseTableBodyCellClass, "truncate")}>
                          {item.productSku}
                        </div>
                        <div className={cn(purchaseTableBodyCellClass, "truncate")}>
                          {item.productName}
                        </div>
                        <div className={cn(purchaseTableBodyCellClass, "tabular-nums")}>
                          {item.quantity}
                        </div>
                        <div className={cn(purchaseTableBodyCellClass, "tabular-nums")}>
                          {formatAmount(calcUnitPrice(item))}원
                        </div>
                        <div
                          className={cn(
                            purchaseTableBodyCellClass,
                            "tabular-nums font-medium",
                          )}
                        >
                          {formatAmount(item.lineAmount)}원
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {order.memo ? (
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    비고: {order.memo}
                  </p>
                ) : null}

                <div className={purchaseGroupFooterClass}>
                  <div className="mr-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums text-[var(--color-text-secondary)]">
                    <span>
                      품목합계{" "}
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {formatAmount(itemsSubtotal)}원
                      </span>
                    </span>
                    {order.extraAdjustments.map((adj) =>
                      adj.amount > 0 ? (
                        <span key={adj.id}>
                          + {adj.label || "추가금"}{" "}
                          <span className="font-medium text-[var(--color-text-primary)]">
                            {formatAmount(adj.amount)}원
                          </span>
                        </span>
                      ) : null,
                    )}
                    {order.discountAdjustments.map((adj) =>
                      adj.amount > 0 ? (
                        <span key={adj.id}>
                          − {adj.label || "할인"}{" "}
                          <span className="font-medium text-[var(--color-text-primary)]">
                            {formatAmount(adj.amount)}원
                          </span>
                        </span>
                      ) : null,
                    )}
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      = 총 {formatAmount(order.totalAmount)}원
                    </span>
                  </div>
                  {!cancelled ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(order.id)}
                      >
                        수정
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => void onToggleCancel(order)}
                      >
                        취소처리
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
