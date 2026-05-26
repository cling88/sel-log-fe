"use client";

import { useState } from "react";
import { ManagedSelectField } from "@/component/common/managed-select-field";
import { suggestNextSkuCode } from "@/lib/category";
import { formatWon } from "@/lib/utils";
import { useMasterData } from "@/context/master-data-context";

export function SettingsView() {
  const [margin, setMargin] = useState(30);
  const [fee, setFee] = useState(5.85);
  const {
    categories,
    vendors,
    addCategory,
    updateCategory,
    removeCategory,
    addVendor,
    updateVendor,
    removeVendor,
  } = useMasterData();

  const [editingVendor, setEditingVendor] = useState<string | null>(null);
  const [vendorDraft, setVendorDraft] = useState("");

  const exampleCost = 1650;
  const rate = margin / 100 + fee / 100;
  const examplePrice =
    rate < 1 ? Math.round(exampleCost / (1 - rate)) : 0;

  const categoryOptions = categories.map((c) => ({
    value: c.id,
    label: `${c.label} (SKU ${c.skuCode})`,
    skuCode: c.skuCode,
  }));

  const [previewCategoryId, setPreviewCategoryId] = useState(
    categories[0]?.id ?? "",
  );

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
        설정
      </h1>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold text-zinc-900">수익 계산 설정</h2>
        <div className="mt-4 space-y-4">
          <label className="flex items-center justify-between text-sm">
            <span className="text-zinc-600">기본 마진율</span>
            <span className="flex items-center gap-1">
              <input
                type="number"
                value={margin}
                onChange={(e) => setMargin(Number(e.target.value) || 0)}
                className="h-9 w-20 rounded-md border border-zinc-200 px-2 text-right"
              />
              %
            </span>
          </label>
          <label className="flex items-center justify-between text-sm">
            <span className="text-zinc-600">네이버 수수료율</span>
            <span className="flex items-center gap-1">
              <input
                type="number"
                step="0.01"
                value={fee}
                onChange={(e) => setFee(Number(e.target.value) || 0)}
                className="h-9 w-20 rounded-md border border-zinc-200 px-2 text-right"
              />
              %
            </span>
          </label>
        </div>

        <div className="mt-5 rounded-xl bg-zinc-50 p-4 text-sm text-zinc-600">
          <p className="font-medium text-zinc-800">권장판매가 계산식</p>
          <p className="mt-2">= 원가 ÷ (1 - 마진율 - 수수료율)</p>
          <p className="mt-2">
            예) {exampleCost.toLocaleString()} ÷ (1 - {margin / 100} -{" "}
            {fee / 100}) = {formatWon(examplePrice)}
          </p>
        </div>
      </section>

      <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold text-zinc-900">카테고리 관리</h2>
        <p className="mt-1 text-xs text-zinc-500">
          상품 등록 시 선택 목록에 반영됩니다. SKU 코드는 SL-코드-순번 형식에 사용됩니다.
        </p>
        <div className="mt-4">
          <ManagedSelectField
            label="카테고리"
            value={previewCategoryId}
            options={categoryOptions}
            onChange={setPreviewCategoryId}
            showSkuCodeOnAdd
            suggestedSkuCode={suggestNextSkuCode(categories)}
            onAdd={({ label, skuCode }) => {
              const created = addCategory({
                label,
                skuCode: skuCode ?? suggestNextSkuCode(categories),
              });
              setPreviewCategoryId(created.id);
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
        </div>
        <ul className="mt-3 space-y-1 text-sm text-zinc-600">
          {categories.map((c) => (
            <li key={c.id} className="font-mono text-xs">
              {c.label} · SL-{c.skuCode}-*****
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-4 rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-semibold text-zinc-900">구매처 · 도매처 관리</h2>
        <p className="mt-1 text-xs text-zinc-500">
          상품 등록 시 주 구매처 목록에 반영됩니다.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {vendors.map((vendor) => (
            <span
              key={vendor}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm"
            >
              {editingVendor === vendor ? (
                <>
                  <input
                    value={vendorDraft}
                    onChange={(e) => setVendorDraft(e.target.value)}
                    className="h-6 w-24 rounded border border-zinc-200 bg-white px-1 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        updateVendor(vendor, vendorDraft);
                        setEditingVendor(null);
                      } catch (e) {
                        window.alert(
                          e instanceof Error ? e.message : "수정에 실패했습니다.",
                        );
                      }
                    }}
                    className="text-xs text-zinc-700"
                  >
                    저장
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingVendor(null)}
                    className="text-xs text-zinc-400"
                  >
                    취소
                  </button>
                </>
              ) : (
                <>
                  {vendor}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingVendor(vendor);
                      setVendorDraft(vendor);
                    }}
                    className="text-xs text-zinc-400 hover:text-zinc-700"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    onClick={() => removeVendor(vendor)}
                    className="text-zinc-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </>
              )}
            </span>
          ))}
          <button
            type="button"
            onClick={() => {
              const name = window.prompt("구매처 · 도매처 이름");
              if (name?.trim()) addVendor(name.trim());
            }}
            className="rounded-full border border-dashed border-zinc-300 px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-50"
          >
            + 추가
          </button>
        </div>
      </section>
    </div>
  );
}
