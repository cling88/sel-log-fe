"use client";

import { useState } from "react";
import { ProductPickerModal } from "@/component/common/product-picker-modal";
import { tdClass } from "@/component/purchases/table-ui";
import { cn } from "@/lib/utils";
import type { Product } from "@/types/product";

interface LedgerProductCellsProps {
  editing: boolean;
  productId: string;
  sku: string;
  productName: string;
  products: Product[];
  onSelect: (product: Product) => void;
  onAddProduct: (payload: {
    name: string;
    category: string;
  }) => Product;
  /** 매입 테이블은 name, 매출은 productName 필드명 차이 */
  nameLabel?: string;
}

const pickerButtonClass =
  "w-full rounded-md border border-dashed border-zinc-300 bg-zinc-50/80 px-2 py-1.5 text-left text-sm hover:border-zinc-400 hover:bg-zinc-50";

export function LedgerProductCells({
  editing,
  productId,
  sku,
  productName,
  products,
  onSelect,
  onAddProduct,
  nameLabel = "상품명",
}: LedgerProductCellsProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const hasProduct = Boolean(productId && productName);

  const openPicker = () => {
    if (editing) setPickerOpen(true);
  };

  return (
    <>
      <td className={tdClass}>
        {editing ? (
          <button
            type="button"
            onClick={openPicker}
            className={cn(
              pickerButtonClass,
              "font-mono text-xs",
              hasProduct ? "border-zinc-200 bg-white text-zinc-800" : "text-zinc-400",
            )}
          >
            {sku || "SKU 선택"}
          </button>
        ) : (
          <span className="font-mono text-xs text-zinc-600">{sku || "—"}</span>
        )}
      </td>
      <td className={tdClass}>
        {editing ? (
          <button
            type="button"
            onClick={openPicker}
            className={cn(
              pickerButtonClass,
              hasProduct ? "border-zinc-200 bg-white text-zinc-900" : "text-zinc-400",
            )}
          >
            {productName || `${nameLabel} 선택`}
          </button>
        ) : (
          productName || "—"
        )}
      </td>

      <ProductPickerModal
        open={pickerOpen}
        products={products}
        selectedProductId={productId}
        onClose={() => setPickerOpen(false)}
        onSelect={onSelect}
        onAddProduct={onAddProduct}
      />
    </>
  );
}
