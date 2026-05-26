"use client";

import { useMemo, useRef, useState } from "react";
import { LedgerProductCells } from "@/component/common/ledger-product-cells";
import { DatePickerInput } from "@/component/common/date-picker-input";
import {
  createEmptyProduct,
  withNewId,
} from "@/component/purchases/purchase-row-factory";
import {
  DraftRowActions,
  GutterHeaderSpacer,
  GutterRowSlot,
  InlineInput,
  RowActions,
  TableDataScroll,
  TableInsertGutter,
  TablePanel,
  dataRowClass,
  draftRowClass,
  registerRowClass,
  tdClass,
  thClass,
} from "@/component/purchases/table-ui";
import { useRowHover } from "@/component/purchases/use-row-hover";
import { calcMarkupPercentFromCost, calcPurchase } from "@/lib/calc";
import { mapProductToPurchaseFields } from "@/lib/product-factory";
import { formatDisplayDate } from "@/lib/date";
import { formatAmount } from "@/lib/utils";
import {
  insertAfterRow,
  useTableRowInsert,
} from "@/component/purchases/use-table-row-insert";
import type { Product } from "@/types/product";
import type { PurchaseRow } from "@/types/purchase";

interface ProductTableProps {
  rows: PurchaseRow[];
  onChange: (rows: PurchaseRow[]) => void;
  search: string;
  onSearchChange: (value: string) => void;
  products: Product[];
  onAddProduct: (payload: {
    name: string;
    category: Product["category"];
  }) => Product;
}

function applyCalc(row: PurchaseRow): PurchaseRow {
  const result = calcPurchase({
    quantity: row.quantity,
    totalPayment: row.totalPayment,
  });
  return { ...row, ...result };
}

function displayDash(value: number | null) {
  return value == null || value === 0 ? "-" : formatAmount(value);
}

function ProductRowContent({
  data,
  editing,
  onChange,
  products,
  onAddProduct,
}: {
  data: PurchaseRow;
  editing: boolean;
  onChange: (patch: Partial<PurchaseRow>) => void;
  products: Product[];
  onAddProduct: ProductTableProps["onAddProduct"];
}) {
  const markupPercent = calcMarkupPercentFromCost(
    data.costPerUnit,
    data.recommendedPrice,
  );

  return (
    <>
      <td className={tdClass}>
        {editing ? (
          <DatePickerInput
            value={data.date}
            onChange={(date) => onChange({ date })}
          />
        ) : (
          formatDisplayDate(data.date)
        )}
      </td>
      <td className={tdClass}>
        {editing ? (
          <InlineInput
            value={data.vendor}
            onChange={(v) => onChange({ vendor: v })}
          />
        ) : (
          data.vendor
        )}
      </td>
      <LedgerProductCells
        editing={editing}
        productId={data.productId}
        sku={data.sku}
        productName={data.name}
        products={products}
        onSelect={(product) =>
          onChange(mapProductToPurchaseFields(product, data.vendor))
        }
        onAddProduct={onAddProduct}
      />
      <td className={`${tdClass} text-right`}>
        {editing ? (
          <InlineInput
            type="number"
            value={String(data.quantity)}
            onChange={(v) => onChange({ quantity: Number(v) || 0 })}
            className="ml-auto max-w-[5rem] text-right"
          />
        ) : (
          data.quantity
        )}
      </td>
      <td className={`${tdClass} text-right tabular-nums`}>
        {editing ? (
          <InlineInput
            type="number"
            value={String(data.totalPayment)}
            onChange={(v) => onChange({ totalPayment: Number(v) || 0 })}
            className="ml-auto max-w-[7rem] text-right"
          />
        ) : (
          <span className="font-medium">{formatAmount(data.totalPayment)}</span>
        )}
      </td>
      <td className={`${tdClass} text-right tabular-nums`}>
        {editing ? (
          <InlineInput
            type="number"
            value={data.vat != null ? String(data.vat) : ""}
            onChange={(v) =>
              onChange({
                vat: v === "" ? null : Number(v) || 0,
              })
            }
            className="ml-auto max-w-[6rem] text-right"
          />
        ) : (
          displayDash(data.vat)
        )}
      </td>
      <td className={`${tdClass} text-right tabular-nums text-black/70`}>
        {data.quantity > 0 ? formatAmount(data.costPerUnit) : "—"}
      </td>
      <td className={`${tdClass} text-right tabular-nums font-medium`}>
        <div className="flex items-center justify-end gap-1.5">
          {markupPercent != null ? (
            <span className="text-xs font-medium text-black/50">
              +{markupPercent}%
            </span>
          ) : null}
          <span className="inline-block rounded-md border border-black px-2 py-0.5">
            {formatAmount(data.recommendedPrice)}
          </span>
        </div>
      </td>
    </>
  );
}

export function ProductTable({
  rows,
  onChange,
  search,
  onSearchChange,
  products,
  onAddProduct,
}: ProductTableProps) {
  const registerRef = useRef<HTMLTableRowElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<PurchaseRow | null>(null);
  const { bindRow, isHovered } = useRowHover();

  const {
    registerDraft,
    insertAfter,
    updatePending,
    removePending,
    resetRegister,
    updateRegister,
    buildList,
  } = useTableRowInsert<PurchaseRow>(createEmptyProduct);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.vendor.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.sku.toLowerCase().includes(q) ||
        row.date.includes(q),
    );
  }, [rows, search]);

  const displayItems = buildList(filtered);
  const total = filtered.reduce((sum, row) => sum + row.totalPayment, 0);

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const startEdit = (row: PurchaseRow) => {
    cancelEdit();
    setEditingId(row.id);
    setEditDraft({ ...row });
  };

  const saveEdit = () => {
    if (!editDraft) return;
    onChange(
      rows.map((row) => (row.id === editDraft.id ? applyCalc(editDraft) : row)),
    );
    cancelEdit();
  };

  const deleteRow = (id: string) => {
    onChange(rows.filter((row) => row.id !== id));
    if (editingId === id) cancelEdit();
  };

  const savePending = (tempId: string, draft: PurchaseRow, afterId: string) => {
    onChange(insertAfterRow(rows, afterId, withNewId(applyCalc(draft))));
    removePending(tempId);
  };

  const saveRegister = () => {
    onChange([...rows, withNewId(applyCalc(registerDraft))]);
    resetRegister();
  };

  const patchEdit = (patch: Partial<PurchaseRow>) => {
    setEditDraft((prev) => (prev ? applyCalc({ ...prev, ...patch }) : prev));
  };

  const patchPending = (tempId: string, patch: Partial<PurchaseRow>) => {
    updatePending(tempId, (d) => applyCalc({ ...d, ...patch }));
  };

  const patchRegister = (patch: Partial<PurchaseRow>) => {
    updateRegister((d) => applyCalc({ ...d, ...patch }));
  };

  return (
    <TablePanel
      search={search}
      onSearchChange={onSearchChange}
      totalAmount={total}
      itemCount={filtered.length}
    >
      <TableInsertGutter>
        <GutterHeaderSpacer />
        {displayItems.map((item) => {
          if (item.type === "pending") {
            return (
              <GutterRowSlot key={`g-${item.tempId}`} className={draftRowClass} />
            );
          }
          const row = item.data;
          const editing = editingId === row.id && editDraft;
          return (
            <GutterRowSlot
              key={`g-${row.id}`}
              showInsert={!editing}
              onInsert={() => insertAfter(row.id)}
              visible={isHovered(row.id)}
              rowHoverHandlers={bindRow(row.id)}
            />
          );
        })}
        <GutterRowSlot className={registerRowClass} />
      </TableInsertGutter>

      <TableDataScroll>
        <table className="min-w-[1180px] w-full border-collapse">
          <thead>
            <tr className="border-b border-black/10 bg-white">
              <th className={thClass}>날짜</th>
              <th className={thClass}>구매처</th>
              <th className={thClass}>SKU</th>
              <th className={thClass}>상품명</th>
              <th className={`${thClass} text-right`}>수량</th>
              <th className={`${thClass} text-right`}>최종 결제금액</th>
              <th className={`${thClass} text-right`}>부가세</th>
              <th className={`${thClass} text-right`}>개당 단가</th>
              <th className={`${thClass} text-right`}>권장 판매가</th>
              <th className={`${thClass} text-right`}>액션</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map((item) => {
              if (item.type === "pending") {
                return (
                  <tr key={item.tempId} className={draftRowClass}>
                    <ProductRowContent
                      data={item.draft}
                      editing
                      onChange={(patch) => patchPending(item.tempId, patch)}
                      products={products}
                      onAddProduct={onAddProduct}
                    />
                    <td className={tdClass}>
                      <DraftRowActions
                        onSave={() =>
                          savePending(item.tempId, item.draft, item.afterId)
                        }
                        onCancel={() => removePending(item.tempId)}
                      />
                    </td>
                  </tr>
                );
              }

              const row = item.data;
              const editing = editingId === row.id && editDraft;
              const data = editing ? editDraft : row;

              return (
                <tr key={row.id} className={dataRowClass} {...bindRow(row.id)}>
                  <ProductRowContent
                    data={data}
                    editing={!!editing}
                    onChange={patchEdit}
                    products={products}
                    onAddProduct={onAddProduct}
                  />
                  <td className={tdClass}>
                    {editing ? (
                      <DraftRowActions onSave={saveEdit} onCancel={cancelEdit} />
                    ) : (
                      <RowActions
                        editing={false}
                        onEdit={() => startEdit(row)}
                        onSave={saveEdit}
                        onCancel={cancelEdit}
                        onDelete={() => deleteRow(row.id)}
                      />
                    )}
                  </td>
                </tr>
              );
            })}

            <tr ref={registerRef} id="ledger-register-row" className={registerRowClass}>
              <ProductRowContent
                data={registerDraft}
                editing
                onChange={patchRegister}
                products={products}
                onAddProduct={onAddProduct}
              />
              <td className={tdClass}>
                <DraftRowActions onSave={saveRegister} onCancel={resetRegister} />
              </td>
            </tr>
          </tbody>
        </table>
      </TableDataScroll>
    </TablePanel>
  );
}
