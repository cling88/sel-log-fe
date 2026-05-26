"use client";

import { useMemo, useRef, useState } from "react";
import {
  createEmptyExpense,
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
import type { ExpenseRow } from "@/types/purchase";

interface ExpenseTableProps {
  rows: ExpenseRow[];
  onChange: (rows: ExpenseRow[]) => void;
  search: string;
  onSearchChange: (value: string) => void;
}

function ExpenseRowContent({
  data,
  editing,
  onChange,
}: {
  data: ExpenseRow;
  editing: boolean;
  onChange: (patch: Partial<ExpenseRow>) => void;
}) {
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
            value={data.content}
            onChange={(v) => onChange({ content: v })}
            className="min-w-[10rem]"
          />
        ) : (
          data.content
        )}
      </td>
      <td className={`${tdClass} text-right tabular-nums`}>
        {editing ? (
          <InlineInput
            type="number"
            value={String(data.amount)}
            onChange={(v) => onChange({ amount: Number(v) || 0 })}
            className="ml-auto max-w-[7rem] text-right"
          />
        ) : (
          formatAmount(data.amount)
        )}
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

export function ExpenseTable({
  rows,
  onChange,
  search,
  onSearchChange,
}: ExpenseTableProps) {
  const registerRef = useRef<HTMLTableRowElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ExpenseRow | null>(null);
  const { bindRow, isHovered } = useRowHover();

  const {
    registerDraft,
    insertAfter,
    updatePending,
    removePending,
    resetRegister,
    updateRegister,
    buildList,
  } = useTableRowInsert<ExpenseRow>(createEmptyExpense);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (row) =>
        row.vendor.toLowerCase().includes(q) ||
        row.content.toLowerCase().includes(q) ||
        row.memo.toLowerCase().includes(q) ||
        row.date.includes(q),
    );
  }, [rows, search]);

  const displayItems = buildList(filtered);
  const total = filtered.reduce((sum, row) => sum + row.amount, 0);

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const startEdit = (row: ExpenseRow) => {
    cancelEdit();
    setEditingId(row.id);
    setEditDraft({ ...row });
  };

  const saveEdit = () => {
    if (!editDraft) return;
    onChange(rows.map((row) => (row.id === editDraft.id ? editDraft : row)));
    cancelEdit();
  };

  const deleteRow = (id: string) => {
    onChange(rows.filter((row) => row.id !== id));
    if (editingId === id) cancelEdit();
  };

  const savePending = (tempId: string, draft: ExpenseRow, afterId: string) => {
    onChange(insertAfterRow(rows, afterId, withNewId(draft)));
    removePending(tempId);
  };

  const saveRegister = () => {
    onChange([...rows, withNewId(registerDraft)]);
    resetRegister();
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
        <table className="w-full min-w-[640px] border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/80">
              <th className={thClass}>날짜</th>
              <th className={thClass}>구매처</th>
              <th className={thClass}>내용</th>
              <th className={`${thClass} text-right`}>금액</th>
              <th className={thClass}>메모</th>
              <th className={`${thClass} text-right`}>액션</th>
            </tr>
          </thead>
          <tbody>
            {displayItems.map((item) => {
              if (item.type === "pending") {
                return (
                  <tr key={item.tempId} className={draftRowClass}>
                    <ExpenseRowContent
                      data={item.draft}
                      editing
                      onChange={(patch) =>
                        updatePending(item.tempId, (d) => ({ ...d, ...patch }))
                      }
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
                  <ExpenseRowContent
                    data={data}
                    editing={!!editing}
                    onChange={(patch) =>
                      setEditDraft((prev) => (prev ? { ...prev, ...patch } : prev))
                    }
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
              <ExpenseRowContent
                data={registerDraft}
                editing
                onChange={(patch) =>
                  updateRegister((d) => ({ ...d, ...patch }))
                }
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
