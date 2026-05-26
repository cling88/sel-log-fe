"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ManagedSelectField } from "@/component/common/managed-select-field";
import { suggestNextSkuCode } from "@/lib/category";
import { cn } from "@/lib/utils";
import { useMasterData } from "@/context/master-data-context";
import type { Product } from "@/types/product";

interface ProductPickerModalProps {
  open: boolean;
  title?: string;
  products: Product[];
  selectedProductId?: string;
  onClose: () => void;
  onSelect: (product: Product) => void;
  onAddProduct: (payload: {
    name: string;
    category: string;
    mainVendor?: string;
  }) => Product;
}

export function ProductPickerModal({
  open,
  title = "상품 선택",
  products,
  selectedProductId,
  onClose,
  onSelect,
  onAddProduct,
}: ProductPickerModalProps) {
  const {
    categories,
    vendors,
    getCategoryLabel,
    addCategory,
    updateCategory,
    removeCategory,
    addVendor,
    updateVendor,
    removeVendor,
  } = useMasterData();

  const defaultCategoryId = categories[0]?.id ?? "goods";

  const [query, setQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategoryId, setNewCategoryId] = useState(defaultCategoryId);
  const [newVendor, setNewVendor] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.mainVendor.toLowerCase().includes(q),
    );
  }, [products, query]);

  const canAdd =
    query.trim().length > 0 &&
    !products.some((p) => p.name.toLowerCase() === query.trim().toLowerCase());

  const categoryOptions = useMemo(
    () =>
      categories.map((c) => ({
        value: c.id,
        label: c.label,
        skuCode: c.skuCode,
      })),
    [categories],
  );

  const vendorOptions = useMemo(
    () => vendors.map((v) => ({ value: v, label: v })),
    [vendors],
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      setShowAddForm(false);
      setNewName("");
      setNewCategoryId(defaultCategoryId);
      setNewVendor(vendors[0] ?? "");
    }
  }, [open, defaultCategoryId, vendors]);

  const handleSelect = (product: Product) => {
    onSelect(product);
    setQuery("");
    setShowAddForm(false);
    onClose();
  };

  const handleAdd = () => {
    const created = onAddProduct({
      name: newName.trim(),
      category: newCategoryId,
      mainVendor: newVendor || undefined,
    });
    handleSelect(created);
  };

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[min(640px,90vh)] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-picker-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-black/10 px-5 py-4">
          <div>
            <h2
              id="product-picker-title"
              className="text-base font-semibold text-black"
            >
              {title}
            </h2>
            <p className="mt-0.5 text-xs text-black/60">
              SKU와 상품명을 확인한 뒤 선택하세요
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-black/50 hover:bg-white hover:text-black"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="border-b border-black/10 px-5 py-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SKU · 상품명 · 구매처 검색"
            autoFocus
            className="h-9 w-full rounded-lg border border-black/15 px-3 text-sm outline-none focus:border-black"
          />
        </div>

        <ul className="min-h-0 flex-1 overflow-auto px-3 py-2">
          {filtered.length === 0 ? (
            <li className="px-2 py-8 text-center text-sm text-black/50">
              검색 결과가 없습니다
            </li>
          ) : (
            filtered.map((product) => {
              const active = product.id === selectedProductId;
              return (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(product)}
                    className={cn(
                      "mb-1 w-full rounded-xl border px-4 py-3 text-left transition-colors",
                      active
                        ? "border-black bg-black text-white"
                        : "border-black/10 hover:border-black/15 hover:bg-white",
                    )}
                  >
                    <p
                      className={cn(
                        "text-sm font-medium",
                        active ? "text-white" : "text-black",
                      )}
                    >
                      <span className="font-mono font-semibold tracking-wide">
                        {product.sku}
                      </span>
                      <span className={active ? "text-white/70" : "text-black/50"}>
                        {" "}
                        {product.name}
                      </span>
                      <span
                        className={cn(
                          "ml-1",
                          active ? "text-white/60" : "text-black/40",
                        )}
                        aria-hidden
                      >
                        →
                      </span>
                    </p>
                    <p
                      className={cn(
                        "mt-1 text-xs",
                        active ? "text-white/60" : "text-black/60",
                      )}
                    >
                      {getCategoryLabel(product.category)}
                      {product.mainVendor ? ` · ${product.mainVendor}` : ""}
                      {" · 재고 "}
                      {product.currentStock}개
                    </p>
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <div className="border-t border-black/10 px-5 py-4">
          {showAddForm ? (
            <div className="space-y-3 rounded-xl border border-black/10 bg-white p-3">
              <p className="text-sm font-medium text-black">새 상품 추가</p>
              <label className="block text-sm">
                <span className="text-black/70">상품명</span>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-black/15 bg-white px-2 text-sm"
                />
              </label>
              <ManagedSelectField
                label="카테고리"
                value={newCategoryId}
                options={categoryOptions}
                onChange={setNewCategoryId}
                showSkuCodeOnAdd
                suggestedSkuCode={suggestNextSkuCode(categories)}
                onAdd={({ label, skuCode }) => {
                  const created = addCategory({
                    label,
                    skuCode: skuCode ?? suggestNextSkuCode(categories),
                  });
                  setNewCategoryId(created.id);
                }}
                onEdit={(id, label, skuCode) => {
                  updateCategory(id, {
                    label,
                    ...(skuCode ? { skuCode } : {}),
                  });
                }}
                onRemove={removeCategory}
                canRemove={() => categories.length > 1}
              />
              <ManagedSelectField
                label="주 구매처"
                value={newVendor}
                options={vendorOptions}
                onChange={setNewVendor}
                allowEmpty
                emptyLabel="선택 안 함"
                onAdd={({ label }) => {
                  addVendor(label);
                  setNewVendor(label.trim());
                }}
                onEdit={(oldName, newLabel) => {
                  updateVendor(oldName, newLabel);
                  if (newVendor === oldName) setNewVendor(newLabel.trim());
                }}
                onRemove={removeVendor}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="rounded-md px-3 py-1.5 text-sm text-black/70 hover:bg-black/10"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={!newName.trim()}
                  className="rounded-md bg-black px-3 py-1.5 text-sm text-white hover:bg-black/90 disabled:opacity-40"
                >
                  저장 후 선택
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              {canAdd ? (
                <button
                  type="button"
                  onClick={() => {
                    setNewName(query.trim());
                    setShowAddForm(true);
                  }}
                  className="text-sm font-medium text-black hover:underline"
                >
                  + &quot;{query.trim()}&quot; 새 상품으로 추가
                </button>
              ) : (
                <span className="text-xs text-black/50">
                  목록에서 SKU·상품명을 눌러 선택
                </span>
              )}
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-black/15 px-3 py-1.5 text-sm text-black hover:bg-white"
              >
                닫기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
