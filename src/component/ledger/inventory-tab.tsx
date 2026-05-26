"use client";

import { Fragment, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { DatePickerInput } from "@/component/common/date-picker-input";
import { formatDisplayDate, todayIso } from "@/lib/date";
import { INITIAL_INVENTORY_SUMMARY } from "@/lib/pub-seed";
import { formatAmount } from "@/lib/utils";
import type { InventoryHistoryRow } from "@/types/inventory";
import type { Product } from "@/types/product";

function entryTypeLabel(entry: InventoryHistoryRow): string {
  if (entry.type === "purchase") return "매입 반영";
  if (entry.type === "sale") return "매출 반영";
  return entry.quantity > 0 ? "추가" : "차감";
}

interface InventoryTabProps {
  products: Product[];
  history: InventoryHistoryRow[];
  onHistoryChange: (rows: InventoryHistoryRow[]) => void;
}

export function InventoryTab({
  products,
  history,
  onHistoryChange,
}: InventoryTabProps) {
  const [expandedId, setExpandedId] = useState<string | null>("prod-1");
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState("");
  const [adjustProductName, setAdjustProductName] = useState("");
  const [adjustDate, setAdjustDate] = useState("");
  const [adjustKind, setAdjustKind] = useState<"add" | "subtract">("add");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustUnitCost, setAdjustUnitCost] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const productHistory = (productId: string) =>
    history.filter((row) => row.productId === productId);

  const defaultUnitCost = useMemo(() => {
    const map = new Map(products.map((p) => [p.id, p.latestCostPerUnit]));
    return map;
  }, [products]);

  const openAdjust = (productId: string, productName: string) => {
    setAdjustProductId(productId);
    setAdjustProductName(productName);
    setAdjustDate(todayIso());
    setAdjustKind("add");
    setAdjustQty("");
    setAdjustUnitCost(String(defaultUnitCost.get(productId) ?? ""));
    setAdjustReason("");
    setAdjustOpen(true);
    setExpandedId(productId);
  };

  const saveAdjust = () => {
    const qty = Number(adjustQty);
    const unitCost = Number(adjustUnitCost);
    if (!adjustProductId || !adjustDate || qty <= 0 || unitCost < 0) return;

    const signedQty = adjustKind === "add" ? qty : -qty;
    const row: InventoryHistoryRow = {
      id: `ih-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
      productId: adjustProductId,
      date: adjustDate,
      type: "manual",
      quantity: signedQty,
      unitCost,
      reason: adjustReason.trim() || (adjustKind === "add" ? "재고 추가" : "재고 차감"),
      source: "manual",
    };
    onHistoryChange([...history, row]);
    setAdjustOpen(false);
  };

  const previewAmount =
    Number(adjustQty) > 0 && Number(adjustUnitCost) >= 0
      ? Math.round(Number(adjustQty) * Number(adjustUnitCost))
      : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-2xl border border-black/15 bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-black/10 bg-white text-left text-xs font-medium text-black/60">
              <th className="px-4 py-2.5">상품명</th>
              <th className="px-4 py-2.5 text-right">매입</th>
              <th className="px-4 py-2.5 text-right">매출</th>
              <th className="px-4 py-2.5 text-right">조정</th>
              <th className="px-4 py-2.5 text-right">현재재고</th>
              <th className="px-4 py-2.5 text-right">액션</th>
            </tr>
          </thead>
          <tbody>
            {INITIAL_INVENTORY_SUMMARY.map((row) => {
              const expanded = expandedId === row.productId;
              const rows = productHistory(row.productId);

              return (
                <Fragment key={row.productId}>
                  <tr className="border-b border-black/10 hover:bg-black/[0.02]">
                    <td className="px-4 py-3 text-sm font-medium text-black">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(expanded ? null : row.productId)
                        }
                        className="flex items-center gap-2"
                      >
                        <span className="text-black/50">
                          {expanded ? "▼" : "▶"}
                        </span>
                        {row.productName}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums">
                      {row.purchaseQty}
                    </td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums">
                      {row.saleQty}
                    </td>
                    <td className="px-4 py-3 text-right text-sm tabular-nums">
                      {row.adjustmentQty > 0
                        ? `+${row.adjustmentQty}`
                        : row.adjustmentQty}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums">
                      {row.currentStock}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => openAdjust(row.productId, row.productName)}
                        className="rounded-md border border-black/15 px-2 py-1 text-xs font-medium text-black/70 hover:bg-white"
                      >
                        +
                      </button>
                    </td>
                  </tr>
                  {expanded ? (
                    <tr key={`${row.productId}-detail`}>
                      <td colSpan={6} className="bg-white px-4 py-3">
                        <p className="mb-2 text-sm font-medium text-black">
                          현재 재고: {row.currentStock}개
                        </p>
                        <table className="w-full border-collapse text-sm">
                          <thead>
                            <tr className="text-left text-xs text-black/60">
                              <th className="pb-2 pr-3">날짜</th>
                              <th className="pb-2 pr-3">구분</th>
                              <th className="pb-2 pr-3 text-right">수량</th>
                              <th className="pb-2 pr-3 text-right">금액</th>
                              <th className="pb-2 pr-3">사유</th>
                              <th className="pb-2 pr-3">출처</th>
                              <th className="pb-2 text-right">액션</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((entry) => {
                              const amount =
                                entry.type === "manual" && entry.unitCost != null
                                  ? Math.round(
                                      entry.unitCost * Math.abs(entry.quantity),
                                    )
                                  : null;
                              return (
                                <tr
                                  key={entry.id}
                                  className="border-t border-black/10"
                                >
                                  <td className="py-2 pr-3">
                                    {formatDisplayDate(entry.date)}
                                  </td>
                                  <td className="py-2 pr-3">
                                    {entryTypeLabel(entry)}
                                  </td>
                                  <td className="py-2 pr-3 text-right tabular-nums">
                                    {entry.quantity > 0
                                      ? `+${entry.quantity}`
                                      : entry.quantity}
                                  </td>
                                  <td className="py-2 pr-3 text-right tabular-nums text-black/70">
                                    {amount != null
                                      ? `${entry.quantity > 0 ? "+" : "−"}${formatAmount(amount)}`
                                      : "—"}
                                  </td>
                                  <td className="py-2 pr-3 text-black/70">
                                    {entry.reason}
                                  </td>
                                  <td className="py-2 pr-3 text-black/60">
                                    {entry.source === "auto" ? "자동" : "수동"}
                                  </td>
                                  <td className="py-2 text-right">
                                    {entry.source === "manual" ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          onHistoryChange(
                                            history.filter((h) => h.id !== entry.id),
                                          )
                                        }
                                        className="text-xs text-black hover:underline"
                                      >
                                        삭제
                                      </button>
                                    ) : (
                                      <span className="text-xs text-black/50">—</span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                        <button
                          type="button"
                          onClick={() => openAdjust(row.productId, row.productName)}
                          className="mt-3 text-sm font-medium text-black hover:underline"
                        >
                          + 조정 추가
                        </button>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {adjustOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4">
              <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">재고 조정</h3>
                  <button
                    type="button"
                    onClick={() => setAdjustOpen(false)}
                    className="text-black/50 hover:text-black"
                    aria-label="닫기"
                  >
                    ✕
                  </button>
                </div>
                <div className="mt-4 space-y-3 text-sm">
                  <label className="block">
                    <span className="text-black/70">상품</span>
                    <input
                      readOnly
                      value={adjustProductName}
                      className="mt-1 h-9 w-full rounded-md border border-black/15 bg-white px-2"
                    />
                  </label>
                  <label className="block">
                    <span className="text-black/70">날짜</span>
                    <div className="mt-1">
                      <DatePickerInput
                        value={adjustDate}
                        onChange={setAdjustDate}
                      />
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-black/70">구분</span>
                    <select
                      value={adjustKind}
                      onChange={(e) =>
                        setAdjustKind(e.target.value as "add" | "subtract")
                      }
                      className="mt-1 h-9 w-full rounded-md border border-black/15 px-2"
                    >
                      <option value="add">추가</option>
                      <option value="subtract">차감</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-black/70">수량</span>
                    <input
                      type="number"
                      min={1}
                      value={adjustQty}
                      onChange={(e) => setAdjustQty(e.target.value)}
                      className="mt-1 h-9 w-full rounded-md border border-black/15 px-2"
                    />
                  </label>
                  <label className="block">
                    <span className="text-black/70">개당 원가</span>
                    <input
                      type="number"
                      min={0}
                      value={adjustUnitCost}
                      onChange={(e) => setAdjustUnitCost(e.target.value)}
                      className="mt-1 h-9 w-full rounded-md border border-black/15 px-2"
                    />
                  </label>
                  <label className="block">
                    <span className="text-black/70">사유</span>
                    <input
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      placeholder="샘플, 실사, 파손 등"
                      className="mt-1 h-9 w-full rounded-md border border-black/15 px-2"
                    />
                  </label>
                  {previewAmount > 0 ? (
                    <p className="text-right text-sm tabular-nums text-black/70">
                      반영 금액{" "}
                      <span className="font-semibold text-black">
                        {adjustKind === "add" ? "+" : "−"}
                        {formatAmount(previewAmount)}원
                      </span>
                    </p>
                  ) : null}
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustOpen(false)}
                    className="rounded-md px-3 py-1.5 text-sm text-black/70 hover:bg-black/[0.03]"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={saveAdjust}
                    className="rounded-md bg-black px-3 py-1.5 text-sm text-white"
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
