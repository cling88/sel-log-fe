"use client";

import { createPortal } from "react-dom";
import { formatDisplayDate } from "@/lib/date";
import type { ManualAdjustmentLine } from "@/lib/ledger-period-summary";
import { formatAmount, formatWon } from "@/lib/utils";

interface AdjustmentDetailModalProps {
  open: boolean;
  title: string;
  lines: ManualAdjustmentLine[];
  variant: "add" | "subtract";
  onClose: () => void;
}

export function AdjustmentDetailModal({
  open,
  title,
  lines,
  variant,
  onClose,
}: AdjustmentDetailModalProps) {
  if (!open || typeof document === "undefined") return null;

  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  const sign = variant === "add" ? "+" : "−";

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[min(520px,90vh)] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="adjustment-detail-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-black/10 px-5 py-4">
          <div>
            <h3 id="adjustment-detail-title" className="text-base font-semibold">
              {title}
            </h3>
            <p className="mt-0.5 text-sm text-black/60">
              {lines.length}건 · 합계 {sign}
              {formatWon(total)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-black/50 hover:bg-black/5 hover:text-black"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <ul className="min-h-0 flex-1 overflow-auto px-3 py-2">
          {lines.length === 0 ? (
            <li className="px-2 py-10 text-center text-sm text-black/50">
              해당 내역이 없습니다
            </li>
          ) : (
            lines.map((line) => (
              <li
                key={line.id}
                className="mb-2 rounded-xl border border-black/10 px-4 py-3 text-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-black">{line.productName}</p>
                    <p className="mt-0.5 text-xs text-black/60">
                      {formatDisplayDate(line.date)} ·{" "}
                      {Math.abs(line.quantity)}개 × {formatAmount(line.unitCost)}
                      원
                    </p>
                    {line.reason ? (
                      <p className="mt-1 text-xs text-black/50">{line.reason}</p>
                    ) : null}
                  </div>
                  <p className="shrink-0 font-semibold tabular-nums text-black">
                    {sign}
                    {formatAmount(line.amount)}원
                  </p>
                </div>
              </li>
            ))
          )}
        </ul>

        <div className="border-t border-black/10 px-5 py-3 text-right">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-black/15 px-4 py-1.5 text-sm text-black hover:bg-black/[0.03]"
          >
            닫기
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
