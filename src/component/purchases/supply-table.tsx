"use client";

import { useMemo, useRef, useState } from "react";
import {
  createEmptySupply,
  withNewId,
} from "@/component/purchases/purchase-row-factory";
import { DatePickerInput } from "@/component/common/date-picker-input";
import { MemoField } from "@/component/purchases/memo-field";
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
import { formatDisplayDate } from "@/lib/date";
import {
  insertAfterRow,
  useTableRowInsert,
} from "@/component/purchases/use-table-row-insert";
import { formatAmount } from "@/lib/utils";
import type { SupplyRow } from "@/types/purchase";

interface SupplyTableProps {
  rows: SupplyRow[];
  onChange: (rows: SupplyRow[]) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

function calcSupplyTotal(row: SupplyRow) {
  if (row.unitPrice != null) {
    return Math.round(row.quantity * row.unitPrice);
  }
  return row.totalPayment;
}

function applySupply(row: SupplyRow): SupplyRow {
  return { ...row, totalPayment: calcSupplyTotal(row) };
}

function SupplyRowContent({
  data,
  editing,
  onChange,
}: {
  data: SupplyRow;
  editing: boolean;
  onChange: (patch: Partial<SupplyRow>) => void;
}) {
  const displayTotal = calcSupplyTotal(data);

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
      <td className={tdClass}>
        {editing ? (
          <InlineInput
            value={data.name}
            onChange={(v) => onChange({ name: v })}
            className="min-w-[8rem]"
          />
        ) : (
          data.name
        )}
      </td>
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
            value={data.unitPrice != null ? String(data.unitPrice) : ""}
            onChange={(v) =>
              onChange({
                unitPrice: v === "" ? null : Number(v) || 0,
              })
            }
            className="ml-auto max-w-[6rem] text-right"
            placeholder="-"
          />
        ) : rowUnitPrice(data.unitPrice)}
      </td>
      <td className={`${tdClass} text-right tabular-nums font-medium`}>
        {formatAmount(displayTotal)}
      </td>
      <td className={tdClass}>
        <MemoField
          value={data.memo}
          editing={editing}
          onChange={(memo) => onChange({ memo })}
        />
      </td>
    </>
  );
}

function rowUnitPrice(unitPrice: number | null) {
  return unitPrice != null ? formatAmount(unitPrice) : "-";
}

export function SupplyTable({
  rows,
  onChange,
  search,
  onSearchChange,
}: SupplyTableProps) {
  const registerRef = useRef<HTMLTableRowElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<SupplyRow | null>(null);
  const { bindRow, isHovered } = useRowHover();

  const {
    registerDraft,
    insertAfter,
    updatePending,
    removePending,
    resetRegister,
    updateRegister,
    buildList,
  } = useTableRowInsert<SupplyRow>(createEmptySupply);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.vendor.toLowerCase().includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.memo.toLowerCase().includes(q) ||
        row.date.includes(q),
    );
  }, [rows, search]);

  const displayItems = buildList(filtered);
  const total = filtered.reduce((sum, row) => sum + calcSupplyTotal(row), 0);

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const startEdit = (row: SupplyRow) => {
    cancelEdit();
    setEditingId(row.id);
    setEditDraft({ ...row });
  };

  const saveEdit = () => {
    if (!editDraft) return;
    onChange(
      rows.map((row) =>
        row.id === editDraft.id ? applySupply(editDraft) : row,
      ),
    );
    cancelEdit();
  };

  const deleteRow = (id: string) => {
    onChange(rows.filter((row) => row.id !== id));
    if (editingId === id) cancelEdit();
  };

  const savePending = (tempId: string, draft: SupplyRow, afterId: string) => {
    onChange(insertAfterRow(rows, afterId, withNewId(applySupply(draft))));
    removePending(tempId);
  };

  const saveRegister = () => {
    onChange([...rows, withNewId(applySupply(registerDraft))]);
    resetRegister();
  };

  const patchEdit = (patch: Partial<SupplyRow>) => {
    setEditDraft((prev) => (prev ? applySupply({ ...prev, ...patch }) : prev));
  };

  const patchPending = (tempId: string, patch: Partial<SupplyRow>) => {
    updatePending(tempId, (d) => applySupply({ ...d, ...patch }));
  };

  const patchRegister = (patch: Partial<SupplyRow>) => {
    updateRegister((d) => applySupply({ ...d, ...patch }));
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
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/80">
              <th className={thClass}>날짜</th>
              <th className={thClass}>구매처</th>
              <th className={thClass}>품목명</th>
              <th className={`${thClass} text-right`}>수량</th>
              <th className={`${thClass} text-right`}>단가</th>
              <th className={`${thClass} text-right`}>실결제액</th>
              <th className={thClass}>메모</th>
              <th className={`${thClass} text-right`}>액션</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map((item) => {
              if (item.type === "pending") {
                return (
                  <tr key={item.tempId} className={draftRowClass}>
                    <SupplyRowContent
                      data={item.draft}
                      editing
                      onChange={(patch) => patchPending(item.tempId, patch)}
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
                  <SupplyRowContent
                    data={data}
                    editing={!!editing}
                    onChange={patchEdit}
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
              <SupplyRowContent
                data={registerDraft}
                editing
                onChange={patchRegister}
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
