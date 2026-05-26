"use client";

import { useEffect, useMemo, useState } from "react";
import { ManagedSelectField } from "@/component/common/managed-select-field";
import { suggestNextSkuCode } from "@/lib/category";
import { nextSku } from "@/lib/sku";
import { useMasterData } from "@/context/master-data-context";
import type { Product } from "@/types/product";

interface ProductModalProps {
  open: boolean;
  mode?: "create" | "edit";
  initial?: Partial<Product>;
  existingProducts?: Product[];
  onClose: () => void;
  onSave: (payload: {
    name: string;
    category: string;
    mainVendor: string;
    memo: string;
  }) => void;
}

export function ProductModal({
  open,
  mode = "create",
  initial,
  existingProducts = [],
  onClose,
  onSave,
}: ProductModalProps) {
  const {
    categories,
    vendors,
    getCategorySkuCode,
    addCategory,
    updateCategory,
    removeCategory,
    addVendor,
    updateVendor,
    removeVendor,
  } = useMasterData();

  const defaultCategoryId = categories[0]?.id ?? "goods";

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(defaultCategoryId);
  const [mainVendor, setMainVendor] = useState("");
  const [memo, setMemo] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? "");
    setCategoryId(initial?.category ?? defaultCategoryId);
    setMainVendor(initial?.mainVendor ?? vendors[0] ?? "");
    setMemo(initial?.memo ?? "");
  }, [open, initial, defaultCategoryId, vendors]);

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

  if (!open) return null;

  const title = mode === "edit" ? "상품 수정" : "상품 등록";
  const skuCode = getCategorySkuCode(categoryId);
  const previewSku =
    mode === "edit"
      ? initial?.sku
      : nextSku(existingProducts, categoryId, skuCode);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      category: categoryId,
      mainVendor,
      memo: memo.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
      role="presentation"
    >
      <form
        className="max-h-[90vh] w-full max-w-md overflow-auto rounded-2xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-black">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-black/50 hover:bg-white hover:text-black"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 space-y-4 text-sm">
          <div className="rounded-lg border border-black/10 bg-white px-3 py-2">
            <span className="text-xs text-black/60">SKU</span>
            <p className="mt-0.5 font-mono text-sm font-medium text-black">
              {previewSku ?? "—"}
            </p>
            {mode === "create" ? (
              <p className="mt-1 text-xs text-black/50">
                카테고리별 순번 자동 부여 (코드 {skuCode})
              </p>
            ) : (
              <p className="mt-1 text-xs text-black/50">등록 후 변경할 수 없습니다</p>
            )}
          </div>

          <label className="block">
            <span className="text-black/70">상품명</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 h-9 w-full rounded-md border border-black/15 px-2 outline-none focus:border-black"
            />
          </label>

          <ManagedSelectField
            label="카테고리"
            value={categoryId}
            options={categoryOptions}
            onChange={setCategoryId}
            showSkuCodeOnAdd
            suggestedSkuCode={suggestNextSkuCode(categories)}
            onAdd={({ label, skuCode }) => {
              const created = addCategory({
                label,
                skuCode: skuCode ?? suggestNextSkuCode(categories),
              });
              setCategoryId(created.id);
            }}
            onEdit={(id, label, skuCode) => {
              updateCategory(id, {
                label,
                ...(skuCode ? { skuCode } : {}),
              });
            }}
            onRemove={removeCategory}
            canRemove={(id) => categories.length > 1}
          />

          <ManagedSelectField
            label="주 구매처 (도매처)"
            value={mainVendor}
            options={vendorOptions}
            onChange={setMainVendor}
            allowEmpty
            emptyLabel="선택 안 함"
            onAdd={({ label }) => {
              addVendor(label);
              setMainVendor(label.trim());
            }}
            onEdit={(oldName, newLabel) => {
              updateVendor(oldName, newLabel);
              if (mainVendor === oldName) setMainVendor(newLabel.trim());
            }}
            onRemove={(vendorName) => {
              removeVendor(vendorName);
            }}
          />

          <label className="block">
            <span className="text-black/70">메모</span>
            <input
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="mt-1 h-9 w-full rounded-md border border-black/15 px-2 outline-none focus:border-black"
            />
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-sm text-black/70 hover:bg-white"
          >
            취소
          </button>
          <button
            type="submit"
            className="rounded-md bg-black px-3 py-1.5 text-sm text-white hover:bg-black/90"
          >
            저장
          </button>
        </div>
      </form>
    </div>
  );
}
