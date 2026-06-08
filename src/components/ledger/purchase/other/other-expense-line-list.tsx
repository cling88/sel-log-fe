"use client";

import type { ReactNode } from "react";
import {
  lineRowClickableClass,
  lineRowClickHandlers,
} from "@/components/ledger/purchase/purchase-line-row-click";
import {
  purchaseTableBodyCellClass,
  purchaseTableHeaderCellClass,
  purchaseTableRowClass,
  purchaseTableScrollClass,
  purchaseTableShellClass,
} from "@/components/ledger/purchase/purchase-ui";
import { formatAmount } from "@/lib/purchase-product-calc";
import { formatPurchaseLineBankLabel } from "@/lib/purchase-bank-display";
import type { OtherExpenseLine } from "@/types/purchase-other";
import { cn } from "@/lib/utils";

const DESKTOP_GRID_CLASS =
  "grid w-full min-w-[820px] items-center grid-cols-[minmax(56px,72px)_minmax(180px,2fr)_minmax(104px,120px)_minmax(120px,1.2fr)_minmax(120px,1.4fr)]";

interface OtherExpenseLineListProps {
  lines: OtherExpenseLine[];
  onLineClick: (lineId: string) => void;
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
      <div className={cn(purchaseTableHeaderCellClass, "justify-end")} role="columnheader">
        금액
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
  onLineClick,
}: {
  line: OtherExpenseLine;
  index: number;
  onLineClick: (lineId: string) => void;
}) {
  return (
    <div
      role="row"
      className={cn(
        DESKTOP_GRID_CLASS,
        purchaseTableRowClass(),
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
      <div className={cn(purchaseTableBodyCellClass, "justify-end tabular-nums")}>
        {formatAmount(line.paymentAmount)}원
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
  onLineClick,
}: {
  line: OtherExpenseLine;
  index: number;
  onLineClick: (lineId: string) => void;
}) {
  const fields: { label: string; value: ReactNode }[] = [
    { label: "번호", value: index + 1 },
    { label: "항목명", value: line.itemName },
    { label: "금액", value: `${formatAmount(line.paymentAmount)}원` },
    { label: "출금계좌", value: formatPurchaseLineBankLabel(line) },
    { label: "비고", value: line.memo || "—" },
  ];

  return (
    <article
      className={cn(
        "rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2.5 shadow-[var(--shadow-sm)]",
        lineRowClickableClass(false),
      )}
      {...lineRowClickHandlers(line.id, onLineClick, false)}
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
            <dd className="min-w-0 truncate text-[var(--color-text-primary)]">{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

export function OtherExpenseLineList({
  lines,
  onLineClick,
}: OtherExpenseLineListProps) {
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
                onLineClick={onLineClick}
              />
            ))}
          </div>
        </div>
      </div>

      <ul className="flex flex-col gap-2 md:hidden">
        {lines.map((line, index) => (
          <li key={line.id}>
            <MobileCard line={line} index={index} onLineClick={onLineClick} />
          </li>
        ))}
      </ul>
    </>
  );
}
