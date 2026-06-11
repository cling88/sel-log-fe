"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  lineRowClickHandlers,
  stopRowClickPropagation,
} from "@/components/ledger/purchase/purchase-line-row-click";
import { AmendedAmount } from "@/components/common/amended-amount";
import {
  calcFinalUnitPrice,
  calcUnitPrice,
  formatAmount,
  formatRecommendedPriceRange,
  type MarginRateRange,
} from "@/lib/purchase-product-calc";
import { useMarginRates } from "@/hooks/use-settings";
import { formatPurchaseLineBankLabel } from "@/lib/purchase-bank-display";
import { formatPurchaseLineVendorLabel } from "@/lib/purchase-vendor-display";
import { PurchaseVendorLabel } from "@/components/ledger/purchase/purchase-vendor-label";
import type { ProductPurchaseLine } from "@/types/purchase-product";
import {
  isPurchaseLineMultilineMobileLabel,
  PurchaseLineFieldTextDesktop,
  PurchaseLineFieldTextMobile,
} from "@/components/ledger/purchase/purchase-line-field-text";
import {
  purchasePrimaryActionClass,
  purchaseProductLineClickClass,
  purchaseProductStockPendingBgClass,
  purchaseStatusBadgeDoneClass,
  productPurchaseTableShellClass,
  purchaseTableScrollClass,
} from "@/components/ledger/purchase/purchase-ui";
import { cn } from "@/lib/utils";

/** 열 너비 고정 — 헤더·본문이 동일 grid를 공유해야 정렬됨 */
const PRODUCT_TABLE_GRID_CLASS =
  "grid w-full min-w-[1360px] grid-cols-[64px_108px_58px_minmax(140px,200px)_96px_56px_96px_88px_88px_112px_minmax(128px,max-content)_minmax(100px,140px)_minmax(120px,1fr)]";

const cellBase = "flex items-center px-2.5 text-xs leading-snug";

const headerCellClass = cn(
  cellBase,
  "min-h-7 border-b border-[var(--color-border)]/40 py-1 text-[11px] font-medium text-[var(--color-text-muted)]",
);

const bodyCellClass = cn(
  cellBase,
  "min-h-[52px] py-1 text-[var(--color-text-primary)]",
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
  stockActionsDisabled?: boolean;
  onReflectStock: (lineId: string) => void;
  onCancelStockReflect: (lineId: string) => void;
  onLineClick: (lineId: string) => void;
}

function StockActions({
  line,
  disabled,
  busy,
  onReflectStock,
  onCancelStockReflect,
  compact,
}: {
  line: ProductPurchaseLine;
  disabled?: boolean;
  busy?: boolean;
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
      <div
        className={cn(
          "flex flex-col items-center gap-1",
          compact && "w-full",
        )}
      >
        <span className={purchaseStatusBadgeDoneClass}>반영완료</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={busy}
          className="h-6 px-1.5 text-[11px] font-semibold text-[var(--color-danger)] underline-offset-2 hover:bg-red-50 hover:text-red-700 hover:underline"
          onClick={() => onCancelStockReflect(line.id)}
        >
          {busy ? "처리 중…" : "반영취소"}
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      size="sm"
      disabled={busy}
      className={cn(purchasePrimaryActionClass, compact && "w-full")}
      onClick={() => onReflectStock(line.id)}
    >
      {busy ? "처리 중…" : "재고반영"}
    </Button>
  );
}

const PRODUCT_IMAGE_THUMB_CLASS =
  "relative size-[46px] shrink-0 overflow-hidden rounded-sm bg-[var(--color-bg)] ring-1 ring-[var(--color-border)]/50";

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
    "font-medium",
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

const desktopRowGridClass = "col-span-full grid grid-cols-subgrid";

function DesktopHeader() {
  return (
    <div role="row" className={desktopRowGridClass}>
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
      <div className={cn(headerCellClass, "justify-center")} role="columnheader">
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

function bodyCellProps(extra?: string) {
  return {
    className: cn(bodyCellClass, extra),
  };
}

function DesktopRow({
  line,
  index,
  pricing,
  marginRates,
  groupDisabled,
  stockActionsDisabled,
  onReflectStock,
  onCancelStockReflect,
  onLineClick,
}: {
  line: ProductPurchaseLine;
  index: number;
  pricing: ProductGroupPricing;
  marginRates: MarginRateRange;
  groupDisabled?: boolean;
  stockActionsDisabled?: boolean;
  onReflectStock: (lineId: string) => void;
  onCancelStockReflect: (lineId: string) => void;
  onLineClick: (lineId: string) => void;
}) {
  const unitPrice =
    line.unitPrice ?? calcUnitPrice(line.quantity, line.paymentAmount);
  const finalUnit = calcFinalUnitPrice(
    line,
    pricing.totalOrder,
    pricing.totalExpense,
  );
  const recommended = formatRecommendedPriceRange(unitPrice, finalUnit, marginRates);

  const pending = !line.stockReflected && !groupDisabled;
  const rowBg = purchaseProductStockPendingBgClass(pending);

  return (
    <div
      role="row"
      className={cn(
        desktopRowGridClass,
        rowBg,
        index > 0 && "border-t border-[var(--color-border)]/35",
        purchaseProductLineClickClass(groupDisabled, pending),
      )}
      {...lineRowClickHandlers(line.id, onLineClick, groupDisabled)}
    >
      <div
        {...bodyCellProps(
          "justify-center tabular-nums text-[var(--color-text-muted)]",
        )}
      >
        {index + 1}
      </div>
      <div
        {...bodyCellProps(
          cn(truncateCellClass, "text-[var(--color-text-secondary)]"),
        )}
      >
        <TruncatedText value={line.orderNo} />
      </div>
      <div {...bodyCellProps("justify-center px-1")}>
        <ProductImageThumb imageUrl={line.imageUrl} />
      </div>
      <div {...bodyCellProps(truncateCellClass)}>
        <ProductNameCell name={line.productName} href={line.productLink} />
      </div>
      <div
        {...bodyCellProps(
          cn(truncateCellClass, "text-[var(--color-text-secondary)]"),
        )}
      >
        <PurchaseVendorLabel
          vendorId={line.vendorId}
          vendorSnapshot={line.vendorSnapshot}
          vendor={line.vendor}
          className="block min-w-0 truncate"
        />
      </div>
      <div
        {...bodyCellProps("justify-end whitespace-nowrap tabular-nums")}
      >
        {line.quantity}
      </div>
      <div
        {...bodyCellProps("justify-end whitespace-nowrap tabular-nums")}
      >
        <AmendedAmount
          current={line.paymentAmount}
          previous={line.previousPaymentAmount}
        />
      </div>
      <div
        {...bodyCellProps("justify-end whitespace-nowrap tabular-nums")}
      >
        <AmendedAmount
          current={unitPrice}
          previous={line.previousUnitPrice}
        />
      </div>
      <div
        {...bodyCellProps("justify-end whitespace-nowrap tabular-nums")}
      >
        {formatAmount(finalUnit)}원
      </div>
      <div
        {...bodyCellProps(
          cn(truncateCellClass, "justify-end text-[var(--color-text-secondary)]"),
        )}
      >
        <TruncatedText
          value={recommended}
          fallback="—"
          className="text-right"
        />
      </div>
      <div
        className={cn(bodyCellClass, "justify-center")}
        onClick={stopRowClickPropagation}
        onKeyDown={stopRowClickPropagation}
      >
        <StockActions
          line={line}
          disabled={groupDisabled}
          busy={stockActionsDisabled}
          onReflectStock={onReflectStock}
          onCancelStockReflect={onCancelStockReflect}
        />
      </div>
      <div
        {...bodyCellProps(
          cn(truncateCellClass, "text-[var(--color-text-secondary)]"),
        )}
      >
        <TruncatedText value={formatPurchaseLineBankLabel(line)} />
      </div>
      <div
        {...bodyCellProps(
          cn(truncateCellClass, "text-[var(--color-text-muted)]"),
        )}
      >
        <PurchaseLineFieldTextDesktop text={line.memo} />
      </div>
    </div>
  );
}

function MobileCard({
  line,
  index,
  pricing,
  marginRates,
  groupDisabled,
  stockActionsDisabled,
  onReflectStock,
  onCancelStockReflect,
  onLineClick,
}: {
  line: ProductPurchaseLine;
  index: number;
  pricing: ProductGroupPricing;
  marginRates: MarginRateRange;
  groupDisabled?: boolean;
  stockActionsDisabled?: boolean;
  onReflectStock: (lineId: string) => void;
  onCancelStockReflect: (lineId: string) => void;
  onLineClick: (lineId: string) => void;
}) {
  const unitPrice =
    line.unitPrice ?? calcUnitPrice(line.quantity, line.paymentAmount);
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
    {
      label: "구매처",
      value: formatPurchaseLineVendorLabel(line),
    },
    { label: "개수", value: `${line.quantity}개` },
    {
      label: "결제금액",
      value: (
        <AmendedAmount
          current={line.paymentAmount}
          previous={line.previousPaymentAmount}
          className="justify-start"
        />
      ),
    },
    {
      label: "개당금액",
      value: (
        <AmendedAmount
          current={unitPrice}
          previous={line.previousUnitPrice}
          className="justify-start"
        />
      ),
    },
    { label: "최종개당", value: `${formatAmount(finalUnit)}원` },
    {
      label: "추천판매가",
      value: formatRecommendedPriceRange(unitPrice, finalUnit, marginRates),
    },
    { label: "출금계좌", value: formatPurchaseLineBankLabel(line) },
    { label: "비고", value: <PurchaseLineFieldTextMobile text={line.memo} /> },
  ];

  const stockPending = !line.stockReflected && !groupDisabled;

  return (
    <article
      className={cn(
        "border-b border-[var(--color-border)]/40 px-3 py-2 last:border-b-0 sm:px-4",
        purchaseProductStockPendingBgClass(stockPending),
        purchaseProductLineClickClass(groupDisabled, stockPending),
      )}
      {...lineRowClickHandlers(line.id, onLineClick, groupDisabled)}
    >
      <dl className="grid gap-2">
        {fields.map(({ label, value }) => (
          <div
            key={label}
            className={cn(
              "grid grid-cols-[5.5rem_1fr] gap-1.5 text-sm",
              isPurchaseLineMultilineMobileLabel(label)
                ? "items-start"
                : "items-center",
            )}
          >
            <dt className="text-xs font-medium text-[var(--color-text-muted)]">
              {label}
            </dt>
            <dd
              className={cn(
                "min-w-0 text-[var(--color-text-primary)]",
                !isPurchaseLineMultilineMobileLabel(label) && "truncate",
              )}
            >
              {value}
            </dd>
          </div>
        ))}
        <div
          className="grid grid-cols-[5.5rem_1fr] items-center gap-2 border-t border-[var(--color-border)]/40 pt-1.5"
          onClick={stopRowClickPropagation}
          onKeyDown={stopRowClickPropagation}
        >
          <dt className="text-xs font-medium text-[var(--color-text-muted)]">재고</dt>
          <dd>
            <StockActions
              line={line}
              disabled={groupDisabled}
              busy={stockActionsDisabled}
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
  stockActionsDisabled,
  onReflectStock,
  onCancelStockReflect,
  onLineClick,
}: ProductPurchaseLineListProps) {
  const { marginMinRate, marginMaxRate } = useMarginRates();
  const marginRates: MarginRateRange = {
    min: marginMinRate,
    max: marginMaxRate,
  };

  return (
    <>
      <div className={cn(" border border-[#c9c8c8] rounded-[8px] hidden md:block", purchaseTableScrollClass)}>
        <div className={productPurchaseTableShellClass}>
          <div className={PRODUCT_TABLE_GRID_CLASS} role="table">
            <DesktopHeader />
            {lines.map((line, index) => (
              <DesktopRow
                key={line.id}
                line={line}
                index={index}
                pricing={pricing}
                marginRates={marginRates}
                groupDisabled={groupDisabled}
                stockActionsDisabled={stockActionsDisabled}
                onReflectStock={onReflectStock}
                onCancelStockReflect={onCancelStockReflect}
                onLineClick={onLineClick}
              />
            ))}
          </div>
        </div>
      </div>

      <ul className="flex flex-col md:hidden">
        {lines.map((line, index) => (
          <li key={line.id}>
            <MobileCard
              line={line}
              index={index}
              pricing={pricing}
              marginRates={marginRates}
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
