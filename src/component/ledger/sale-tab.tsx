"use client";

import { Fragment, useMemo, useState } from "react";
import type { SaleChannelFilter } from "@/component/ledger/sale-channel-tabs";
import { formatDisplayDate } from "@/lib/date";
import { summarizeSaleOrder } from "@/lib/sale-order-calc";
import { cn, formatAmount } from "@/lib/utils";
import type { Product } from "@/types/product";
import {
  getSaleChannelLabel,
  type SaleChannelItem,
} from "@/types/sale-channel";
import type { SaleOrder, SaleProductLine } from "@/types/sale-order";

interface SaleTabProps {
  products: Product[];
  onAddProduct: (payload: {
    name: string;
    category: string;
    mainVendor?: string;
  }) => Product;
  orders: SaleOrder[];
  onOrdersChange: (orders: SaleOrder[]) => void;
  channels: SaleChannelItem[];
  channelFilter: SaleChannelFilter;
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.35-4.35"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className={cn(
        "shrink-0 text-black/50 transition-transform",
        expanded && "rotate-90",
      )}
      aria-hidden
    >
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SaleOrderDetail({
  order,
  products,
}: {
  order: SaleOrder;
  products: Product[];
}) {
  const summary = summarizeSaleOrder(order, products);
  const productLines = order.lines.filter(
    (l): l is SaleProductLine => l.lineType === "product",
  );
  const shipping = order.lines.find((l) => l.lineType === "shipping");
  const coupon = order.lines.find((l) => l.lineType === "coupon");

  return (
    <div className="border-t border-black/15 bg-white px-4 py-4">
      <table className="w-full min-w-[640px] border-collapse bg-transparent text-sm">
        <thead>
          <tr className="text-left text-xs font-medium text-black/60">
            <th className="px-3 pb-2 pt-3 pr-3 font-medium">SKU</th>
            <th className="pb-2 pr-3 pt-3 font-medium">상품명</th>
            <th className="pb-2 pr-3 pt-3 text-right font-medium">판매가</th>
            <th className="pb-2 pr-3 pt-3 text-right font-medium">부가세</th>
            <th className="px-3 pb-2 pt-3 text-right font-medium">수량</th>
          </tr>
        </thead>
        <tbody className="text-black">
          {productLines.map((line) => (
            <tr key={line.id} className="border-b border-black/10">
              <td className="px-3 py-2 pr-3 font-mono text-xs text-black/70">
                {line.sku}
              </td>
              <td className="py-2 pr-3">{line.productName}</td>
              <td className="py-2 pr-3 text-right tabular-nums">
                {formatAmount(line.salePrice)}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums text-black/60">
                {formatAmount(line.vat)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{line.quantity}</td>
            </tr>
          ))}
          {shipping && shipping.lineType === "shipping" ? (
            <tr className="border-b border-black/10 text-black">
              <td className="px-3 py-2 pr-3 font-mono text-xs text-black/70">
                &nbsp;
              </td>
              <td className="py-2 pr-3">배송비</td>
              <td className="py-2 pr-3 text-right tabular-nums">
                {formatAmount(shipping.amount)}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums text-black/60">
                {shipping.vat != null ? formatAmount(shipping.vat) : "—"}
              </td>
              <td className="px-3 py-2 text-right">—</td>
            </tr>
          ) : null}
          {coupon && coupon.lineType === "coupon" ? (
            <tr className="border-b border-black/10 text-black">
              <td className="px-3 py-2 pr-3 font-mono text-xs text-black/70">
                &nbsp;
              </td>
              <td className="py-2 pr-3">쿠폰적용</td>
              <td className="py-2 pr-3 text-right tabular-nums">
                -{formatAmount(coupon.amount)}
              </td>
              <td className="py-2 pr-3 text-right">—</td>
              <td className="px-3 py-2 text-right">—</td>
            </tr>
          ) : null}
        </tbody>
      </table>

      <div className="mt-4 space-y-2 border-t border-black/15 pt-3">
        <p className="flex flex-wrap items-center justify-end gap-x-1.5 gap-y-1 text-right text-sm tabular-nums text-black/70">
          <span>
            총 결제{" "}
            <span className="font-semibold text-black">
              {formatAmount(summary.totalPaid)}원
            </span>
          </span>
          <span className="text-black/40">−</span>
          <span>부가 {formatAmount(summary.totalVat)}원</span>
          <span className="text-black/40">−</span>
          <span>수수료 {formatAmount(summary.platformFee)}원</span>
          <span className="text-black/40">−</span>
          <span>원가 {formatAmount(summary.totalCogs)}원</span>
          <span className="text-black/40">=</span>
          <span className="font-semibold text-black">
            순수익 {formatAmount(summary.netProfit)}원
          </span>
        </p>
        <p className="flex flex-wrap items-center justify-end gap-x-1.5 gap-y-1 text-right text-sm tabular-nums text-black/70">
          <span>순수익 {formatAmount(summary.netProfit)}원</span>
          <span className="text-black/40">−</span>
          <span>소득세(대략 3%) {formatAmount(summary.incomeTaxReserve)}원</span>
          <span className="text-black/40">=</span>
          <span className="font-semibold text-black">
            최종 {formatAmount(summary.finalAfterTaxReserve)}원
          </span>
        </p>
      </div>

      {order.memo ? (
        <p className="mt-2 text-right text-xs text-black/60">메모: {order.memo}</p>
      ) : null}
    </div>
  );
}

export function SaleTab({
  products,
  orders,
  onOrdersChange: _onOrdersChange,
  channels,
  channelFilter,
}: SaleTabProps) {
  void _onOrdersChange;
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(
    orders[0]?.id ?? null,
  );

  const channelFiltered = useMemo(() => {
    if (channelFilter === "all") return orders;
    return orders.filter((order) => order.channel === channelFilter);
  }, [orders, channelFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return channelFiltered;
    return channelFiltered.filter((order) => {
      if (order.orderNo?.toLowerCase().includes(q)) return true;
      if (getSaleChannelLabel(channels, order.channel).includes(q)) return true;
      if (order.date.includes(q)) return true;
      return order.lines.some(
        (line) =>
          line.lineType === "product" &&
          (line.productName.toLowerCase().includes(q) ||
            line.sku.toLowerCase().includes(q)),
      );
    });
  }, [channelFiltered, search, channels]);

  const listTotal = useMemo(
    () =>
      filtered.reduce(
        (sum, order) => sum + summarizeSaleOrder(order, products).totalPaid,
        0,
      ),
    [filtered, products],
  );

  const thClass =
    "whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-black/60";
  const tdClass = "whitespace-nowrap px-3 py-3 text-sm";

  return (
    <div className="rounded-2xl border border-black/15 bg-white">
      <div className="flex flex-col gap-3 border-b border-black/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative max-w-xs flex-1">
          <span className="sr-only">검색</span>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-black/40">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="검색"
            className="h-10 w-full rounded-xl border border-black/15 bg-white pl-10 pr-3 text-sm outline-none focus:border-black"
          />
        </label>
        <p className="text-sm font-medium text-black/80">
          결제 합계{" "}
          <span className="font-semibold text-black">
            {listTotal.toLocaleString("ko-KR")}원
          </span>
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="border-b border-black/10 bg-white">
              <th className={`${thClass} w-10`} aria-label="펼치기" />
              <th className={thClass}>날짜</th>
              <th className={thClass}>채널</th>
              <th className={`${thClass} text-right`}>총 결제금액</th>
              <th className={`${thClass} text-right`}>총 빠져나간금액</th>
              <th className={`${thClass} text-right`}>최종 순수익</th>
              <th className={`${thClass} text-right`}>상품개수</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-12 text-center text-sm text-black/50"
                >
                  검색 결과가 없습니다
                </td>
              </tr>
            ) : (
              filtered.map((order) => {
                const summary = summarizeSaleOrder(order, products);
                const expanded = expandedId === order.id;

                return (
                  <Fragment key={order.id}>
                    <tr
                      className={cn(
                        "cursor-pointer border-b border-black/5 transition-colors hover:bg-black/[0.03]",
                        expanded && "bg-black/[0.02]",
                      )}
                      onClick={() =>
                        setExpandedId(expanded ? null : order.id)
                      }
                    >
                      <td className={`${tdClass} w-10`}>
                        <ChevronIcon expanded={expanded} />
                      </td>
                      <td className={`${tdClass} tabular-nums`}>
                        {formatDisplayDate(order.date)}
                        {order.orderNo ? (
                          <span className="mt-0.5 block font-mono text-xs text-black/50">
                            {order.orderNo}
                          </span>
                        ) : null}
                      </td>
                      <td className={tdClass}>
                        {getSaleChannelLabel(channels, order.channel)}
                      </td>
                      <td
                        className={`${tdClass} text-right tabular-nums font-medium`}
                      >
                        {formatAmount(summary.totalPaid)}원
                      </td>
                      <td
                        className={`${tdClass} text-right tabular-nums text-black/60`}
                      >
                        {formatAmount(summary.totalOut)}원
                      </td>
                      <td
                        className={`${tdClass} text-right tabular-nums font-medium text-black`}
                      >
                        {formatAmount(summary.netProfit)}원
                      </td>
                      <td className={`${tdClass} text-right tabular-nums`}>
                        {summary.productCount}개
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="bg-white">
                        <td colSpan={7} className="p-0">
                          <SaleOrderDetail order={order} products={products} />
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <p className="border-t border-black/10 px-4 py-2 text-xs text-black/60">
        {filtered.length}건 주문
        {channelFilter !== "all"
          ? ` · ${getSaleChannelLabel(channels, channelFilter)}`
          : null}
        {" · "}행을 클릭하면 상세 내역이 펼쳐집니다
      </p>
    </div>
  );
}
