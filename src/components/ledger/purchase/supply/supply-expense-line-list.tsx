"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  lineRowClickableClass,
  stopRowClickPropagation,
} from "@/components/ledger/purchase/purchase-line-row-click";
import {
  purchasePrimaryActionClass,
  purchaseStatusBadgeDoneClass,
  purchaseTableBodyCellClass,
  purchaseTableHeaderCellClass,
  purchaseTableRowClass,
  purchaseTableScrollClass,
  purchaseTableShellClass,
} from "@/components/ledger/purchase/purchase-ui";
import { formatAmount } from "@/lib/purchase-product-calc";
import { formatPurchaseLineBankLabel } from "@/lib/purchase-bank-display";
import { PurchaseVendorLabel } from "@/components/ledger/purchase/purchase-vendor-label";
import { formatPurchaseLineVendorLabel } from "@/lib/purchase-vendor-display";
import type { SupplyExpenseLine } from "@/types/purchase-supply";
import { cn } from "@/lib/utils";

const DESKTOP_GRID_CLASS =
  "grid w-full min-w-[1000px] items-center grid-cols-[minmax(56px,72px)_minmax(160px,1.6fr)_minmax(100px,1fr)_minmax(56px,64px)_minmax(96px,104px)_minmax(128px,auto)_minmax(120px,1fr)_minmax(88px,1fr)]";

interface SupplyExpenseLineListProps {
  lines: SupplyExpenseLine[];
  onReflectStock: (lineId: string) => void;
  onCancelStockReflect: (lineId: string) => void;
  onLineClick: (lineId: string) => void;
}

function StockActions({
  line,
  onReflectStock,
  onCancelStockReflect,
  compact,
}: {
  line: SupplyExpenseLine;
  onReflectStock: (lineId: string) => void;
  onCancelStockReflect: (lineId: string) => void;
  compact?: boolean;
}) {
  if (line.stockReflected) {
    return (
      <div className={cn("flex flex-wrap items-center gap-1.5", compact && "w-full")}>
        <span className={purchaseStatusBadgeDoneClass}>반영완료</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          onClick={() => onCancelStockReflect(line.id)}
        >
          반영취소
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      className={cn(purchasePrimaryActionClass, compact && "w-full")}
      onClick={() => onReflectStock(line.id)}
    >
      재고반영
    </Button>
  );
}

function DesktopHeader() {
  return (
    <div className={DESKTOP_GRID_CLASS} role="row">
      <div className={cn(purchaseTableHeaderCellClass, "justify-center")} role="columnheader">
        번호
      </div>
      <div className={purchaseTableHeaderCellClass} role="columnheader">
        항목명
      </div>
      <div className={purchaseTableHeaderCellClass} role="columnheader">
        구매처
      </div>
      <div className={cn(purchaseTableHeaderCellClass, "justify-end")} role="columnheader">
        수량
      </div>
      <div className={cn(purchaseTableHeaderCellClass, "justify-end")} role="columnheader">
        금액
      </div>
      <div className={purchaseTableHeaderCellClass} role="columnheader">
        재고
      </div>
      <div className={purchaseTableHeaderCellClass} role="columnheader">
        출금계좌
      </div>
      <div className={purchaseTableHeaderCellClass} role="columnheader">
        비고
      </div>
    </div>
  );
}

function DesktopRow({
  line,
  index,
  onReflectStock,
  onCancelStockReflect,
  onLineClick,
}: {
  line: SupplyExpenseLine;
  index: number;
  onReflectStock: (lineId: string) => void;
  onCancelStockReflect: (lineId: string) => void;
  onLineClick: (lineId: string) => void;
}) {
  const pending = !line.stockReflected;

  return (
    <div
      role="row"
      className={cn(
        DESKTOP_GRID_CLASS,
        purchaseTableRowClass(pending),
        lineRowClickableClass(false),
      )}
      onClick={() => onLineClick(line.id)}
    >
      <div
        className={cn(
          purchaseTableBodyCellClass,
          "min-w-[56px] justify-center tabular-nums text-[var(--color-text-muted)]",
        )}
      >
        {index + 1}
      </div>
      <div className={cn(purchaseTableBodyCellClass, "font-medium text-[var(--color-text-primary)]")}>
        {line.itemName}
      </div>
      <div className={cn(purchaseTableBodyCellClass, "text-[var(--color-text-secondary)]")}>
        <PurchaseVendorLabel
          vendorId={line.vendorId}
          vendorSnapshot={line.vendorSnapshot}
          vendor={line.vendor}
          className="block min-w-0 truncate"
        />
      </div>
      <div className={cn(purchaseTableBodyCellClass, "justify-end tabular-nums")}>
        {line.quantity}
      </div>
      <div className={cn(purchaseTableBodyCellClass, "justify-end tabular-nums")}>
        {formatAmount(line.paymentAmount)}원
      </div>
      <div
        className={purchaseTableBodyCellClass}
        onClick={stopRowClickPropagation}
        onKeyDown={stopRowClickPropagation}
      >
        <StockActions
          line={line}
          onReflectStock={onReflectStock}
          onCancelStockReflect={onCancelStockReflect}
        />
      </div>
      <div className={cn(purchaseTableBodyCellClass, "truncate text-[var(--color-text-secondary)]")}>
        {formatPurchaseLineBankLabel(line)}
      </div>
      <div className={cn(purchaseTableBodyCellClass, "text-[var(--color-text-muted)]")}>
        {line.memo || "—"}
      </div>
    </div>
  );
}

function MobileCard({
  line,
  index,
  onReflectStock,
  onCancelStockReflect,
  onLineClick,
}: {
  line: SupplyExpenseLine;
  index: number;
  onReflectStock: (lineId: string) => void;
  onCancelStockReflect: (lineId: string) => void;
  onLineClick: (lineId: string) => void;
}) {
  const fields: { label: string; value: ReactNode }[] = [
    { label: "번호", value: index + 1 },
    { label: "항목명", value: line.itemName },
  {
      label: "구매처",
      value: formatPurchaseLineVendorLabel(line),
    },
    { label: "수량", value: `${line.quantity}개` },
    { label: "금액", value: `${formatAmount(line.paymentAmount)}원` },
    { label: "출금계좌", value: formatPurchaseLineBankLabel(line) },
    { label: "비고", value: line.memo || "—" },
  ];

  return (
    <article
      className={cn(
        "rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2.5 shadow-[var(--shadow-sm)]",
        !line.stockReflected && "border-l-[3px] border-l-[var(--color-warning)]",
        lineRowClickableClass(false),
      )}
      onClick={() => onLineClick(line.id)}
    >
      <dl className="grid gap-2">
        {fields.map(({ label, value }) => (
          <div
            key={label}
            className="grid grid-cols-[5.5rem_1fr] items-center gap-1.5 text-sm"
          >
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">
              {label}
            </dt>
            <dd className="min-w-0 text-[var(--color-text-primary)]">{value}</dd>
          </div>
        ))}
        <div
          className="grid grid-cols-[5.5rem_1fr] items-center gap-2 border-t border-[var(--color-border)]/80 pt-2"
          onClick={stopRowClickPropagation}
          onKeyDown={stopRowClickPropagation}
        >
          <dt className="text-xs font-medium text-[var(--color-text-muted)]">재고</dt>
          <dd>
            <StockActions
              line={line}
              onReflectStock={onReflectStock}
              onCancelStockReflect={onCancelStockReflect}
              compact
            />
          </dd>
        </div>
      </dl>
    </article>
  );
}

export function SupplyExpenseLineList({
  lines,
  onReflectStock,
  onCancelStockReflect,
  onLineClick,
}: SupplyExpenseLineListProps) {
  return (
    <>
      <div className={cn("hidden md:block", purchaseTableScrollClass)}>
        <div className={purchaseTableShellClass}>
          <DesktopHeader />
          <div className="divide-y divide-[var(--color-border)]/80">
            {lines.map((line, index) => (
              <DesktopRow
                key={line.id}
                line={line}
                index={index}
                onReflectStock={onReflectStock}
                onCancelStockReflect={onCancelStockReflect}
                onLineClick={onLineClick}
              />
            ))}
          </div>
        </div>
      </div>

      <ul className="flex flex-col gap-2 md:hidden">
        {lines.map((line, index) => (
          <li key={line.id}>
            <MobileCard
              line={line}
              index={index}
              onReflectStock={onReflectStock}
              onCancelStockReflect={onCancelStockReflect}
              onLineClick={onLineClick}
            />
          </li>
        ))}
      </ul>
    </>
  );
}
