"use client";

import { Fragment, useMemo, useState } from "react";
import { formatDisplayDate } from "@/lib/date";
import { INITIAL_SALE_ORDERS } from "@/lib/pub-seed";
import { summarizeSaleOrder } from "@/lib/sale-order-calc";
import { cn, formatAmount } from "@/lib/utils";
import type { Product } from "@/types/product";
import type { SaleOrder, SaleProductLine } from "@/types/sale-order";
import { SALE_CHANNEL_LABEL } from "@/types/sale";

interface SaleTabProps {
  products: Product[];
  onAddProduct: (payload: {
    name: string;
    category: string;
    mainVendor?: string;
  }) => Product;
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
        "shrink-0 text-zinc-500 transition-transform",
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
    <div className="border-t border-zinc-200 bg-zinc-100 px-4 py-4">
      <table className="w-full min-w-[640px] border-collapse bg-transparent text-sm">
        <thead>
          <tr className="text-left text-xs font-medium text-zinc-500">
            <th className="px-3 pb-2 pt-3 pr-3 font-medium">SKU</th>
            <th className="pb-2 pr-3 pt-3 font-medium">상품명</th>
            <th className="pb-2 pr-3 pt-3 text-right font-medium">판매가</th>
            <th className="pb-2 pr-3 pt-3 text-right font-medium">부가세</th>
            <th className="px-3 pb-2 pt-3 text-right font-medium">수량</th>
          </tr>
        </thead>
        <tbody className="text-zinc-800">
          {productLines.map((line) => (
            <tr key={line.id} className="border-b border-zinc-100/80">
              <td className="px-3 py-2 pr-3 font-mono text-xs text-zinc-600">
                {line.sku}
              </td>
              <td className="py-2 pr-3">{line.productName}</td>
              <td className="py-2 pr-3 text-right tabular-nums">
                {formatAmount(line.salePrice)}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums text-zinc-500">
                {formatAmount(line.vat)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{line.quantity}</td>
            </tr>
          ))}
          {shipping && shipping.lineType === "shipping" ? (
            <tr className="border-b border-zinc-100/80 text-zinc-700">
              <td className="px-3 py-2 pr-3 font-mono text-xs text-zinc-600">
                &nbsp;
              </td>
              <td className="py-2 pr-3">배송비</td>
              <td className="py-2 pr-3 text-right tabular-nums">
                {formatAmount(shipping.amount)}
              </td>
              <td className="py-2 pr-3 text-right tabular-nums text-zinc-500">
                {shipping.vat != null ? formatAmount(shipping.vat) : "—"}
              </td>
              <td className="px-3 py-2 text-right">—</td>
            </tr>
          ) : null}
          {coupon && coupon.lineType === "coupon" ? (
            <tr className="border-b border-zinc-100/80 text-red-600">
              <td className="px-3 py-2 pr-3 font-mono text-xs text-zinc-600">
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

      <div className="mt-4 space-y-2 border-t border-zinc-300/80 pt-3">
        <p className="flex flex-wrap items-center justify-end gap-x-1.5 gap-y-1 text-right text-sm tabular-nums">
          <span className="text-zinc-500">
            총 결제{" "}
            <span className="font-semibold text-zinc-900">
              {formatAmount(summary.totalPaid)}원
            </span>
          </span>
          <span className="text-zinc-400">−</span>
          <span className="text-zinc-500">
            부가 {formatAmount(summary.totalVat)}원
          </span>
          <span className="text-zinc-400">−</span>
          <span className="text-zinc-500">
            수수료 {formatAmount(summary.platformFee)}원
          </span>
          <span className="text-zinc-400">−</span>
          <span className="text-zinc-500">
            원가 {formatAmount(summary.totalCogs)}원
          </span>
          <span className="text-zinc-400">=</span>
          <span className="font-semibold text-emerald-700">
            순수익 {formatAmount(summary.netProfit)}원
          </span>
        </p>
        <p className="flex flex-wrap items-center justify-end gap-x-1.5 gap-y-1 text-right text-sm tabular-nums">
          <span className="text-zinc-500">
            순수익 {formatAmount(summary.netProfit)}원
          </span>
          <span className="text-zinc-400">−</span>
          <span className="text-zinc-500">
            소득세(대략 3%) {formatAmount(summary.incomeTaxReserve)}원
          </span>
          <span className="text-zinc-400">=</span>
          <span className="font-semibold text-zinc-900">
            최종 {formatAmount(summary.finalAfterTaxReserve)}원
          </span>
        </p>
      </div>

      {order.memo ? (
        <p className="mt-2 text-right text-xs text-zinc-500">메모: {order.memo}</p>
      ) : null}
    </div>
  );
}

export function SaleTab({ products }: SaleTabProps) {
  const [orders] = useState<SaleOrder[]>(INITIAL_SALE_ORDERS);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(
    INITIAL_SALE_ORDERS[0]?.id ?? null,
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((order) => {
      if (order.orderNo?.toLowerCase().includes(q)) return true;
      if (SALE_CHANNEL_LABEL[order.channel].includes(q)) return true;
      if (order.date.includes(q)) return true;
      return order.lines.some(
        (line) =>
          line.lineType === "product" &&
          (line.productName.toLowerCase().includes(q) ||
            line.sku.toLowerCase().includes(q)),
      );
    });
  }, [orders, search]);

  const listTotal = useMemo(
    () =>
      filtered.reduce(
        (sum, order) => sum + summarizeSaleOrder(order, products).totalPaid,
        0,
      ),
    [filtered, products],
  );

  const thClass =
    "whitespace-nowrap px-3 py-2.5 text-left text-xs font-medium text-zinc-500";
  const tdClass = "whitespace-nowrap px-3 py-3 text-sm";

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white">
      <div className="flex flex-col gap-3 border-b border-zinc-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative max-w-xs flex-1">
          <span className="sr-only">검색</span>
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="검색"
            className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-3 text-sm outline-none focus:border-zinc-300 focus:bg-white"
          />
        </label>
        <p className="text-sm font-medium text-zinc-700">
          결제 합계{" "}
          <span className="font-semibold text-zinc-900">
            {listTotal.toLocaleString("ko-KR")}원
          </span>
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/80">
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
                  className="px-3 py-12 text-center text-sm text-zinc-400"
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
                        "cursor-pointer border-b border-zinc-50 transition-colors hover:bg-zinc-50/80",
                        expanded && "bg-zinc-50/50",
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
                          <span className="mt-0.5 block font-mono text-xs text-zinc-400">
                            {order.orderNo}
                          </span>
                        ) : null}
                      </td>
                      <td className={tdClass}>
                        {SALE_CHANNEL_LABEL[order.channel]}
                      </td>
                      <td
                        className={`${tdClass} text-right tabular-nums font-medium`}
                      >
                        {formatAmount(summary.totalPaid)}원
                      </td>
                      <td
                        className={`${tdClass} text-right tabular-nums text-zinc-500`}
                      >
                        {formatAmount(summary.totalOut)}원
                      </td>
                      <td
                        className={`${tdClass} text-right tabular-nums font-medium text-emerald-700`}
                      >
                        {formatAmount(summary.netProfit)}원
                      </td>
                      <td className={`${tdClass} text-right tabular-nums`}>
                        {summary.productCount}개
                      </td>
                    </tr>
                    {expanded ? (
                      <tr className="bg-zinc-100">
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

      <p className="border-t border-zinc-100 px-4 py-2 text-xs text-zinc-500">
        {filtered.length}건 주문 · 행을 클릭하면 상세 내역이 펼쳐집니다
      </p>
    </div>
  );
}
