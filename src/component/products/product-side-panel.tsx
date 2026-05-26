"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDisplayDate } from "@/lib/date";
import { formatAmount, formatWon, cn } from "@/lib/utils";
import type { ProductHistoryEntry } from "@/types/product-history";
import type { Product } from "@/types/product";
import { useMasterData } from "@/context/master-data-context";

type HistoryTab = "purchase" | "sale";

interface ProductSidePanelProps {
  product: Product;
  purchaseHistory: ProductHistoryEntry[];
  saleHistory: ProductHistoryEntry[];
  onEdit: () => void;
  onDelete: () => void;
  onBack?: () => void;
  className?: string;
}

export function ProductSidePanel({
  product,
  purchaseHistory,
  saleHistory,
  onEdit,
  onDelete,
  onBack,
  className,
}: ProductSidePanelProps) {
  const { getCategoryLabel } = useMasterData();
  const [historyTab, setHistoryTab] = useState<HistoryTab>("purchase");
  const rows = historyTab === "purchase" ? purchaseHistory : saleHistory;
  const ledgerTab = historyTab === "purchase" ? "purchase" : "sale";

  return (
    <section
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-auto bg-white p-5",
        className,
      )}
    >
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="mb-3 flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-900 lg:hidden"
        >
          ← 목록으로
        </button>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">{product.name}</h2>
          <p className="mt-1 font-mono text-sm text-zinc-600">{product.sku}</p>
          <p className="mt-1 text-sm text-zinc-500">
            {getCategoryLabel(product.category)} · 주 구매처{" "}
            {product.mainVendor || "—"}
          </p>
          {product.memo ? (
            <p className="mt-1 text-sm text-zinc-400">{product.memo}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            수정
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            삭제
          </button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
          <p className="text-xs text-zinc-500">현재 재고</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-900">
            {product.currentStock}개
          </p>
        </div>
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
          <p className="text-xs text-zinc-500">개당 원가</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-900">
            {formatWon(product.latestCostPerUnit)}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
          <p className="text-xs text-zinc-500">권장 판매가</p>
          <p className="mt-1 text-xl font-semibold tabular-nums text-zinc-900">
            {formatWon(product.recommendedPrice)}
          </p>
        </div>
      </div>

      <div className="mt-6 flex min-h-0 flex-1 flex-col">
        <div className="flex gap-4 border-b border-zinc-200 text-sm font-medium">
          <button
            type="button"
            onClick={() => setHistoryTab("purchase")}
            className={cn(
              "pb-2 transition-colors",
              historyTab === "purchase"
                ? "border-b-2 border-zinc-900 text-zinc-900"
                : "text-zinc-400 hover:text-zinc-600",
            )}
          >
            매입 이력
          </button>
          <button
            type="button"
            onClick={() => setHistoryTab("sale")}
            className={cn(
              "pb-2 transition-colors",
              historyTab === "sale"
                ? "border-b-2 border-zinc-900 text-zinc-900"
                : "text-zinc-400 hover:text-zinc-600",
            )}
          >
            매출 이력
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-400">
            {historyTab === "purchase" ? "매입" : "매출"} 이력이 없습니다.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-100">
            {rows.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between py-2.5 text-sm text-zinc-700"
              >
                <span className="tabular-nums text-zinc-500">
                  {formatDisplayDate(row.date)}
                  {row.sku ? (
                    <span className="ml-2 font-mono text-xs text-zinc-400">
                      {row.sku}
                    </span>
                  ) : null}
                </span>
                <span className="tabular-nums">
                  {row.quantity}개 · {formatAmount(row.amount)}원
                </span>
              </li>
            ))}
          </ul>
        )}

        <Link
          href={`/ledger?tab=${ledgerTab}&product=${product.id}`}
          className="mt-4 inline-block text-sm font-medium text-zinc-700 hover:underline"
        >
          → 전체 보기 (장부로 이동)
        </Link>
      </div>
    </section>
  );
}
