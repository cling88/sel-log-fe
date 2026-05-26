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
  "w-full rounded-md border border-dashed border-black/20 bg-white px-2 py-1.5 text-left text-sm hover:border-black hover:bg-white";

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
              hasProduct ? "border-black/15 bg-white text-black" : "text-black/50",
            )}
          >
            {sku || "SKU 선택"}
          </button>
        ) : (
          <span className="font-mono text-xs text-black/70">{sku || "—"}</span>
        )}
      </td>
      <td className={tdClass}>
        {editing ? (
          <button
            type="button"
            onClick={openPicker}
            className={cn(
              pickerButtonClass,
              hasProduct ? "border-black/15 bg-white text-black" : "text-black/50",
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
