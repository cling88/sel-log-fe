"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  lineRowClickableClass,
  lineRowClickHandlers,
  stopRowClickPropagation,
} from "@/components/ledger/purchase/purchase-line-row-click";
import {
  calcFinalUnitPrice,
  calcUnitPrice,
  formatAmount,
  formatRecommendedPriceRange,
} from "@/lib/purchase-product-calc";
import { formatPurchaseLineBankLabel } from "@/lib/purchase-bank-display";
import type { ProductPurchaseLine } from "@/types/purchase-product";
import {
  purchasePrimaryActionClass,
  purchaseStatusBadgeDoneClass,
  purchaseTableScrollClass,
  purchaseTableShellClass,
} from "@/components/ledger/purchase/purchase-ui";
import { cn } from "@/lib/utils";

/** 열 너비 고정 — 헤더·본문이 동일 grid를 공유해야 정렬됨 */
const PRODUCT_TABLE_GRID_CLASS =
  "grid w-full min-w-[1360px] grid-cols-[64px_108px_58px_minmax(160px,1.2fr)_96px_56px_96px_88px_88px_112px_minmax(128px,max-content)_minmax(120px,1fr)_minmax(80px,1fr)]";

const cellBase = "flex items-center px-2.5 text-xs leading-snug";

const headerCellClass = cn(
  cellBase,
  "min-h-8 py-1.5 text-[11px] font-medium text-[var(--color-text-muted)] bg-[var(--primary-50)]/50",
);

const bodyCellClass = cn(
  cellBase,
  "min-h-[58px] py-1.5 text-[var(--color-text-primary)]",
);

const truncateCellClass = "min-w-0 overflow-hidden";

const truncateTextClass = "block w-full truncate";

export interface ProductGroupPricing {
  totalOrder: number;
  totalExpense: number;
}

interface ProductPurchaseLineListProps {
  lines: ProductPurchaseLine[];
  pricing: ProductGroupPricing;
  groupDisabled?: boolean;
  onReflectStock: (lineId: string) => void;
  onCancelStockReflect: (lineId: string) => void;
  onLineClick: (lineId: string) => void;
}

function StockActions({
  line,
  disabled,
  onReflectStock,
  onCancelStockReflect,
  compact,
}: {
  line: ProductPurchaseLine;
  disabled?: boolean;
  onReflectStock: (lineId: string) => void;
  onCancelStockReflect: (lineId: string) => void;
  compact?: boolean;
}) {
  if (disabled) {
    return (
      <span className="text-xs text-[var(--color-text-muted)]">주문취소</span>
    );
  }

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

const PRODUCT_IMAGE_THUMB_CLASS =
  "relative size-[50px] shrink-0 overflow-hidden rounded-sm border border-[var(--color-border)] bg-[var(--color-bg)]";

function ProductImageThumb({ imageUrl }: { imageUrl: string }) {
  if (!imageUrl) {
    return <span className="text-[10px] text-[var(--color-text-muted)]">—</span>;
  }
  return (
    <div className={PRODUCT_IMAGE_THUMB_CLASS}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imageUrl} alt="" className="size-full object-cover" />
    </div>
  );
}

function ProductNameCell({
  name,
  href,
  onLinkClick,
}: {
  name: string;
  href: string;
  onLinkClick?: () => void;
}) {
  const hasLink = href.trim().length > 0;
  const className = cn(
    truncateTextClass,
    "max-w-[150px] font-medium",
    hasLink
      ? "text-[var(--primary-600)] hover:underline"
      : "text-[var(--color-text-primary)]",
  );

  if (hasLink) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        title={name}
        onClick={(event) => {
          stopRowClickPropagation(event);
          onLinkClick?.();
        }}
      >
        {name}
      </a>
    );
  }

  return (
    <span className={className} title={name}>
      {name}
    </span>
  );
}

function TruncatedText({
  value,
  fallback = "—",
  className,
}: {
  value: string;
  fallback?: string;
  className?: string;
}) {
  const text = value.trim() || fallback;
  return (
    <span className={cn(truncateTextClass, className)} title={text}>
      {text}
    </span>
  );
}

function DesktopHeader() {
  return (
    <div role="row" className="contents">
      <div className={cn(headerCellClass, "justify-center")} role="columnheader">
        번호
      </div>
      <div className={headerCellClass} role="columnheader">
        주문번호
      </div>
      <div
        className={cn(headerCellClass, "justify-center px-1")}
        role="columnheader"
      >
        이미지
      </div>
      <div className={headerCellClass} role="columnheader">
        상품명
      </div>
      <div className={headerCellClass} role="columnheader">
        구매처
      </div>
      <div className={cn(headerCellClass, "justify-end")} role="columnheader">
        개수
      </div>
      <div className={cn(headerCellClass, "justify-end")} role="columnheader">
        결제금액
      </div>
      <div className={cn(headerCellClass, "justify-end")} role="columnheader">
        개당금액
      </div>
      <div className={cn(headerCellClass, "justify-end")} role="columnheader">
        최종개당
      </div>
      <div className={cn(headerCellClass, "justify-end")} role="columnheader">
        추천판매가
      </div>
      <div className={headerCellClass} role="columnheader">
        재고
      </div>
      <div className={headerCellClass} role="columnheader">
        출금계좌
      </div>
      <div className={headerCellClass} role="columnheader">
        비고
      </div>
    </div>
  );
}

function clickableCellProps(
  lineId: string,
  onLineClick: (lineId: string) => void,
  groupDisabled: boolean | undefined,
  rowBg: string,
  rowBorder: string,
  extra?: string,
) {
  return {
    className: cn(
      bodyCellClass,
      rowBg,
      rowBorder,
      lineRowClickableClass(groupDisabled),
      extra,
    ),
    ...lineRowClickHandlers(lineId, onLineClick, groupDisabled),
  };
}

function DesktopRow({
  line,
  index,
  pricing,
  groupDisabled,
  onReflectStock,
  onCancelStockReflect,
  onLineClick,
}: {
  line: ProductPurchaseLine;
  index: number;
  pricing: ProductGroupPricing;
  groupDisabled?: boolean;
  onReflectStock: (lineId: string) => void;
  onCancelStockReflect: (lineId: string) => void;
  onLineClick: (lineId: string) => void;
}) {
  const unitPrice = calcUnitPrice(line.quantity, line.paymentAmount);
  const finalUnit = calcFinalUnitPrice(
    line,
    pricing.totalOrder,
    pricing.totalExpense,
  );
  const recommended = formatRecommendedPriceRange(unitPrice, finalUnit);

  const pending = !line.stockReflected && !groupDisabled;
  const rowBg = cn(
    pending ? "bg-[var(--primary-50)]/15" : "bg-white",
  );
  const rowBorder = index > 0 ? "border-t border-[var(--color-border)]/80" : "";

  return (
    <div role="row" className="contents">
      <div
        {...clickableCellProps(
          line.id,
          onLineClick,
          groupDisabled,
          rowBg,
          rowBorder,
          "justify-center tabular-nums text-[var(--color-text-muted)]",
        )}
      >
        {index + 1}
      </div>
      <div
        {...clickableCellProps(
          line.id,
          onLineClick,
          groupDisabled,
          rowBg,
          rowBorder,
          cn(truncateCellClass, "text-[var(--color-text-secondary)]"),
        )}
      >
        <TruncatedText value={line.orderNo} />
      </div>
      <div
        {...clickableCellProps(
          line.id,
          onLineClick,
          groupDisabled,
          rowBg,
          rowBorder,
          "justify-center px-1",
        )}
      >
        <ProductImageThumb imageUrl={line.imageUrl} />
      </div>
      <div
        {...clickableCellProps(
          line.id,
          onLineClick,
          groupDisabled,
          rowBg,
          rowBorder,
          truncateCellClass,
        )}
      >
        <ProductNameCell name={line.productName} href={line.productLink} />
      </div>
      <div
        {...clickableCellProps(
          line.id,
          onLineClick,
          groupDisabled,
          rowBg,
          rowBorder,
          cn(truncateCellClass, "text-[var(--color-text-secondary)]"),
        )}
      >
        <TruncatedText value={line.vendor} />
      </div>
      <div
        {...clickableCellProps(
          line.id,
          onLineClick,
          groupDisabled,
          rowBg,
          rowBorder,
          "justify-end whitespace-nowrap tabular-nums",
        )}
      >
        {line.quantity}
      </div>
      <div
        {...clickableCellProps(
          line.id,
          onLineClick,
          groupDisabled,
          rowBg,
          rowBorder,
          "justify-end whitespace-nowrap tabular-nums",
        )}
      >
        {formatAmount(line.paymentAmount)}원
      </div>
      <div
        {...clickableCellProps(
          line.id,
          onLineClick,
          groupDisabled,
          rowBg,
          rowBorder,
          "justify-end whitespace-nowrap tabular-nums",
        )}
      >
        {formatAmount(unitPrice)}원
      </div>
      <div
        {...clickableCellProps(
          line.id,
          onLineClick,
          groupDisabled,
          rowBg,
          rowBorder,
          "justify-end whitespace-nowrap tabular-nums",
        )}
      >
        {formatAmount(finalUnit)}원
      </div>
      <div
        {...clickableCellProps(
          line.id,
          onLineClick,
          groupDisabled,
          rowBg,
          rowBorder,
          cn(truncateCellClass, "justify-end text-[var(--color-text-secondary)]"),
        )}
      >
        <TruncatedText value={recommended} fallback="—" />
      </div>
      <div
        className={cn(bodyCellClass, rowBg, rowBorder)}
        onClick={stopRowClickPropagation}
        onKeyDown={stopRowClickPropagation}
      >
        <StockActions
          line={line}
          disabled={groupDisabled}
          onReflectStock={onReflectStock}
          onCancelStockReflect={onCancelStockReflect}
        />
      </div>
      <div
        {...clickableCellProps(
          line.id,
          onLineClick,
          groupDisabled,
          rowBg,
          rowBorder,
          cn(truncateCellClass, "text-[var(--color-text-secondary)]"),
        )}
      >
        <TruncatedText value={formatPurchaseLineBankLabel(line)} />
      </div>
      <div
        {...clickableCellProps(
          line.id,
          onLineClick,
          groupDisabled,
          rowBg,
          rowBorder,
          cn(truncateCellClass, "text-[var(--color-text-muted)]"),
        )}
      >
        <TruncatedText value={line.memo} />
      </div>
    </div>
  );
}

function MobileCard({
  line,
  index,
  pricing,
  groupDisabled,
  onReflectStock,
  onCancelStockReflect,
  onLineClick,
}: {
  line: ProductPurchaseLine;
  index: number;
  pricing: ProductGroupPricing;
  groupDisabled?: boolean;
  onReflectStock: (lineId: string) => void;
  onCancelStockReflect: (lineId: string) => void;
  onLineClick: (lineId: string) => void;
}) {
  const unitPrice = calcUnitPrice(line.quantity, line.paymentAmount);
  const finalUnit = calcFinalUnitPrice(
    line,
    pricing.totalOrder,
    pricing.totalExpense,
  );

  const fields: { label: string; value: ReactNode }[] = [
    { label: "번호", value: index + 1 },
    { label: "주문번호", value: line.orderNo || "—" },
    {
      label: "이미지",
      value: line.imageUrl ? (
        <div className={PRODUCT_IMAGE_THUMB_CLASS}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={line.imageUrl} alt="" className="size-full object-cover" />
        </div>
      ) : (
        "—"
      ),
    },
    {
      label: "상품명",
      value: <ProductNameCell name={line.productName} href={line.productLink} />,
    },
    { label: "구매처", value: line.vendor },
    { label: "개수", value: `${line.quantity}개` },
    { label: "결제금액", value: `${formatAmount(line.paymentAmount)}원` },
    { label: "개당금액", value: `${formatAmount(unitPrice)}원` },
    { label: "최종개당", value: `${formatAmount(finalUnit)}원` },
    {
      label: "추천판매가",
      value: formatRecommendedPriceRange(unitPrice, finalUnit),
    },
    { label: "출금계좌", value: formatPurchaseLineBankLabel(line) },
    { label: "비고", value: line.memo || "—" },
  ];

  return (
    <article
      className={cn(
        "rounded-xl border border-[var(--color-border)] bg-white px-3.5 py-2.5 shadow-[var(--shadow-sm)]",
        !line.stockReflected && !groupDisabled && "border-l-[3px] border-l-[var(--color-warning)]",
        !groupDisabled && lineRowClickableClass(groupDisabled),
      )}
      {...lineRowClickHandlers(line.id, onLineClick, groupDisabled)}
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
        <div
          className="grid grid-cols-[5.5rem_1fr] items-center gap-2 border-t border-[var(--color-border)] pt-2"
          onClick={stopRowClickPropagation}
          onKeyDown={stopRowClickPropagation}
        >
          <dt className="text-xs font-medium text-[var(--color-text-muted)]">재고</dt>
          <dd>
            <StockActions
              line={line}
              disabled={groupDisabled}
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

export function ProductPurchaseLineList({
  lines,
  pricing,
  groupDisabled,
  onReflectStock,
  onCancelStockReflect,
  onLineClick,
}: ProductPurchaseLineListProps) {
  return (
    <>
      <div className={cn("hidden md:block", purchaseTableScrollClass)}>
        <div className={purchaseTableShellClass}>
          <div className={PRODUCT_TABLE_GRID_CLASS} role="table">
            <DesktopHeader />
            {lines.map((line, index) => (
              <DesktopRow
                key={line.id}
                line={line}
                index={index}
                pricing={pricing}
                groupDisabled={groupDisabled}
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
              pricing={pricing}
              groupDisabled={groupDisabled}
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
