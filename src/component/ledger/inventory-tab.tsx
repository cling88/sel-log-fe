"use client";

import { Fragment, useState } from "react";
import { DatePickerInput } from "@/component/common/date-picker-input";
import { formatDisplayDate, todayIso } from "@/lib/date";
import {
  INITIAL_INVENTORY_HISTORY,
  INITIAL_INVENTORY_SUMMARY,
} from "@/lib/pub-seed";
import type { InventoryHistoryRow } from "@/types/inventory";

const typeLabel: Record<InventoryHistoryRow["type"], string> = {
  purchase: "📦 입고",
  sale: "🛒 출고",
  manual: "✏️ 조정",
};

export function InventoryTab() {
  const [expandedId, setExpandedId] = useState<string | null>("prod-1");
  const [history, setHistory] = useState(INITIAL_INVENTORY_HISTORY);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustProductName, setAdjustProductName] = useState("");
  const [adjustDate, setAdjustDate] = useState("");
  const [adjustType, setAdjustType] = useState<"in" | "out">("in");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustReason, setAdjustReason] = useState("");

  const productHistory = (productId: string) =>
    history.filter((row) => row.productId === productId);

  const openAdjust = (productId: string, productName: string) => {
    setAdjustProductName(productName);
    setAdjustDate(todayIso());
    setAdjustType("in");
    setAdjustQty("");
    setAdjustReason("");
    setAdjustOpen(true);
    setExpandedId(productId);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/80 text-left text-xs font-medium text-zinc-500">
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
                  <tr className="border-b border-zinc-100 hover:bg-zinc-50/50">
                    <td className="px-4 py-3 text-sm font-medium text-zinc-900">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(expanded ? null : row.productId)
                        }
                        className="flex items-center gap-2"
                      >
                        <span className="text-zinc-400">
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
                        className="rounded-md border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                      >
                        +
                      </button>
                    </td>
                  </tr>
                  {expanded ? (
                    <tr key={`${row.productId}-detail`}>
                      <td colSpan={6} className="bg-zinc-50/80 px-4 py-3">
                        <p className="mb-2 text-sm font-medium text-zinc-700">
                          현재 재고: {row.currentStock}개
                        </p>
                        <table className="w-full border-collapse text-sm">
                          <thead>
                            <tr className="text-left text-xs text-zinc-500">
                              <th className="pb-2 pr-3">날짜</th>
                              <th className="pb-2 pr-3">구분</th>
                              <th className="pb-2 pr-3 text-right">수량</th>
                              <th className="pb-2 pr-3">사유</th>
                              <th className="pb-2 pr-3">출처</th>
                              <th className="pb-2 text-right">액션</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((entry) => (
                              <tr
                                key={entry.id}
                                className="border-t border-zinc-200/80"
                              >
                                <td className="py-2 pr-3">
                                  {formatDisplayDate(entry.date)}
                                </td>
                                <td className="py-2 pr-3">
                                  {typeLabel[entry.type]}
                                </td>
                                <td className="py-2 pr-3 text-right tabular-nums">
                                  {entry.quantity > 0
                                    ? `+${entry.quantity}`
                                    : entry.quantity}
                                </td>
                                <td className="py-2 pr-3 text-zinc-600">
                                  {entry.reason}
                                </td>
                                <td className="py-2 pr-3 text-zinc-500">
                                  {entry.source === "auto" ? "자동" : "수동"}
                                </td>
                                <td className="py-2 text-right">
                                  {entry.source === "manual" ? (
                                    <div className="flex justify-end gap-1">
                                      <button
                                        type="button"
                                        className="text-xs text-zinc-600 hover:underline"
                                      >
                                        수정
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setHistory((prev) =>
                                            prev.filter((h) => h.id !== entry.id),
                                          )
                                        }
                                        className="text-xs text-red-600 hover:underline"
                                      >
                                        삭제
                                      </button>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-zinc-400">—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <button
                          type="button"
                          onClick={() => openAdjust(row.productId, row.productName)}
                          className="mt-3 text-sm font-medium text-zinc-700 hover:underline"
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

      {adjustOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold">재고 조정 추가</h3>
              <button
                type="button"
                onClick={() => setAdjustOpen(false)}
                className="text-zinc-400 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <label className="block">
                <span className="text-zinc-600">상품</span>
                <input
                  readOnly
                  value={adjustProductName}
                  className="mt-1 h-9 w-full rounded-md border border-zinc-200 bg-zinc-50 px-2"
                />
              </label>
              <label className="block">
                <span className="text-zinc-600">날짜</span>
                <div className="mt-1">
                  <DatePickerInput
                    value={adjustDate}
                    onChange={setAdjustDate}
                  />
                </div>
              </label>
              <label className="block">
                <span className="text-zinc-600">구분</span>
                <select
                  value={adjustType}
                  onChange={(e) =>
                    setAdjustType(e.target.value as "in" | "out")
                  }
                  className="mt-1 h-9 w-full rounded-md border border-zinc-200 px-2"
                >
                  <option value="in">입고</option>
                  <option value="out">출고</option>
                </select>
              </label>
              <label className="block">
                <span className="text-zinc-600">수량</span>
                <input
                  type="number"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-zinc-200 px-2"
                />
              </label>
              <label className="block">
                <span className="text-zinc-600">사유</span>
                <input
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="반품, 파손, 증정 등"
                  className="mt-1 h-9 w-full rounded-md border border-zinc-200 px-2"
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAdjustOpen(false)}
                className="rounded-md px-3 py-1.5 text-sm text-zinc-600 hover:bg-zinc-100"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => setAdjustOpen(false)}
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm text-white"
              >
                저장
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
