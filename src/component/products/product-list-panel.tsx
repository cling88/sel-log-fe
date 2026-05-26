"use client";

import { cn, formatWon } from "@/lib/utils";
import { useMasterData } from "@/context/master-data-context";
import type { Product } from "@/types/product";

interface ProductListPanelProps {
  products: Product[];
  selectedId: string;
  search: string;
  onSearchChange: (value: string) => void;
  onSelect: (id: string) => void;
  onRegister: () => void;
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductListPanel({
  products,
  selectedId,
  search,
  onSearchChange,
  onSelect,
  onRegister,
  onEdit,
  onDelete,
}: ProductListPanelProps) {
  const { getCategoryLabel } = useMasterData();

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-black/15 lg:w-[min(100%,520px)] lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-2 border-b border-black/10 p-3">
        <button
          type="button"
          onClick={onRegister}
          className="shrink-0 rounded-lg bg-black px-3 py-1.5 text-sm font-medium text-white hover:bg-black/90"
        >
          + 상품 등록
        </button>
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="검색"
          className="h-9 min-w-0 flex-1 rounded-lg border border-black/15 px-3 text-sm outline-none focus:border-black"
        />
      </div>

      <div className="hidden max-h-[calc(100vh-220px)] overflow-auto lg:block">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-black/10 bg-white text-xs font-medium text-black/60">
            <tr>
              <th className="px-3 py-2.5 font-medium">SKU</th>
              <th className="px-3 py-2.5 font-medium">상품명</th>
              <th className="px-2 py-2.5 font-medium">카테고리</th>
              <th className="px-2 py-2.5 font-medium">주 구매처</th>
              <th className="px-2 py-2.5 text-right font-medium">최근 원가</th>
              <th className="px-2 py-2.5 text-right font-medium">권장가</th>
              <th className="px-2 py-2.5 text-right font-medium">재고</th>
              <th className="px-3 py-2.5 text-right font-medium">액션</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-3 py-8 text-center text-sm text-black/50"
                >
                  검색 결과가 없습니다.
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const active = product.id === selectedId;
                return (
                  <tr
                    key={product.id}
                    onClick={() => onSelect(product.id)}
                    className={cn(
                      "cursor-pointer border-b border-black/5 transition-colors",
                      active ? "bg-black text-white" : "hover:bg-white",
                    )}
                  >
                    <td
                      className={cn(
                        "whitespace-nowrap px-3 py-2.5 font-mono text-xs",
                        active ? "text-black/40" : "text-black/60",
                      )}
                    >
                      {product.sku}
                    </td>
                    <td
                      className={cn(
                        "max-w-[140px] truncate px-2 py-2.5 font-medium",
                        active ? "text-white" : "text-black",
                      )}
                    >
                      {product.name}
                    </td>
                    <td
                      className={cn(
                        "whitespace-nowrap px-2 py-2.5",
                        active ? "text-black/40" : "text-black/70",
                      )}
                    >
                      {getCategoryLabel(product.category)}
                    </td>
                    <td
                      className={cn(
                        "whitespace-nowrap px-2 py-2.5",
                        active ? "text-black/40" : "text-black/70",
                      )}
                    >
                      {product.mainVendor || "—"}
                    </td>
                    <td
                      className={cn(
                        "whitespace-nowrap px-2 py-2.5 text-right tabular-nums",
                        active ? "text-white" : "text-black",
                      )}
                    >
                      {formatWon(product.latestCostPerUnit)}
                    </td>
                    <td
                      className={cn(
                        "whitespace-nowrap px-2 py-2.5 text-right tabular-nums",
                        active ? "text-white" : "text-black",
                      )}
                    >
                      {formatWon(product.recommendedPrice)}
                    </td>
                    <td
                      className={cn(
                        "whitespace-nowrap px-2 py-2.5 text-right tabular-nums",
                        active ? "text-white" : "text-black",
                      )}
                    >
                      {product.currentStock}개
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div
                        className="flex justify-end gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => onEdit(product)}
                          className={cn(
                            "rounded px-1.5 py-0.5 text-xs font-medium",
                            active
                              ? "text-white/70 hover:bg-black/90"
                              : "text-black/70 hover:bg-white",
                          )}
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(product)}
                          className={cn(
                            "rounded px-1.5 py-0.5 text-xs font-medium",
                            active
                              ? "text-black/50 hover:bg-black/90"
                              : "text-black hover:bg-black/5",
                          )}
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ul className="max-h-[360px] overflow-auto p-2 lg:hidden">
        {products.length === 0 ? (
          <li className="px-3 py-8 text-center text-sm text-black/50">
            검색 결과가 없습니다.
          </li>
        ) : (
          products.map((product) => {
            const active = product.id === selectedId;
            return (
              <li key={product.id}>
                <button
                  type="button"
                  onClick={() => onSelect(product.id)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2.5 text-left",
                    active
                      ? "bg-black text-white"
                      : "text-black hover:bg-white",
                  )}
                >
                  <span className="block text-sm font-medium">{product.name}</span>
                  <span
                    className={cn(
                      "mt-0.5 block font-mono text-xs",
                      active ? "text-black/40" : "text-black/60",
                    )}
                  >
                    {product.sku}
                  </span>
                  <span
                    className={cn(
                      "mt-0.5 block text-xs",
                      active ? "text-black/50" : "text-black/50",
                    )}
                  >
                    {getCategoryLabel(product.category)} · 재고{" "}
                    {product.currentStock}개
                  </span>
                </button>
              </li>
            );
          })
        )}
      </ul>
    </aside>
  );
}
