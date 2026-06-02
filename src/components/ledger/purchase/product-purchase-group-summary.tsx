"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatAmount } from "@/lib/purchase-product-calc";
import {
  areGroupAdjustmentsDirty,
  cloneGroupAdjustments,
  createEmptyAdjustment,
  sanitizeAdjustments,
  sumAdjustmentAmounts,
  type PurchaseGroupAdjustment,
  type PurchaseGroupMeta,
} from "@/types/purchase-group";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductPurchaseGroupSummaryProps {
  groupKey: string;
  totalOrder: number;
  meta: PurchaseGroupMeta;
  disabled?: boolean;
  saving?: boolean;
  onSave: (patch: Pick<PurchaseGroupMeta, "extraFees" | "discounts">) => void;
}

const adjustmentInputClass =
  "h-6 w-[4.25rem] rounded-[4px] border-[var(--color-border)] bg-white px-1.5 text-[11px]! leading-tight shadow-none placeholder:text-[11px] md:text-[11px]!";

function AdjustmentColumn({
  groupKey,
  title,
  items,
  fieldKey,
  sign,
  signClassName,
  labelPlaceholder,
  disabled,
  onItemsChange,
}: {
  groupKey: string;
  title: string;
  items: PurchaseGroupAdjustment[];
  fieldKey: "extraFees" | "discounts";
  sign: "-" | "+";
  signClassName: string;
  labelPlaceholder: string;
  disabled?: boolean;
  onItemsChange: (
    fieldKey: "extraFees" | "discounts",
    items: PurchaseGroupAdjustment[],
  ) => void;
}) {
  const updateItem = (id: string, patch: Partial<PurchaseGroupAdjustment>) => {
    onItemsChange(
      fieldKey,
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const addItem = () => {
    onItemsChange(fieldKey, [...items, createEmptyAdjustment()]);
  };

  const removeItem = (id: string) => {
    onItemsChange(
      fieldKey,
      items.filter((item) => item.id !== id),
    );
  };

  return (
    <div className="min-w-0 max-w-[400px] flex-1 space-y-1">
      <div className="flex items-center justify-between gap-1">
        <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
          {title}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={disabled}
          className="size-5 border-[var(--color-border)] bg-white shadow-none"
          aria-label={`${title} 추가`}
          onClick={addItem}
        >
          <Plus className="size-3" />
        </Button>
      </div>

      {items.length === 0 ? (
        <p className="text-[10px] text-[var(--color-text-muted)]">없음</p>
      ) : (
        <div className="space-y-1">
          {items.map((item) => {
            const hasAmount = item.amount > 0;

            return (
              <div key={item.id} className="flex items-center gap-1">
                <Input
                  id={`${fieldKey}-label-${groupKey}-${item.id}`}
                  type="text"
                  disabled={disabled}
                  value={item.label}
                  onChange={(e) => updateItem(item.id, { label: e.target.value })}
                  placeholder={labelPlaceholder}
                  className={adjustmentInputClass}
                />
                <Input
                  id={`${fieldKey}-amount-${groupKey}-${item.id}`}
                  type="number"
                  min={0}
                  disabled={disabled}
                  value={hasAmount ? item.amount : ""}
                  onChange={(e) =>
                    updateItem(item.id, {
                      amount: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  placeholder="0"
                  className={cn(adjustmentInputClass, "tabular-nums")}
                />
                {hasAmount ? (
                  <span
                    className={cn(
                      "w-[3.25rem] shrink-0 text-[10px] font-medium tabular-nums",
                      signClassName,
                    )}
                  >
                    {sign}
                    {formatAmount(item.amount)}
                  </span>
                ) : (
                  <span className="w-[3.25rem] shrink-0" aria-hidden />
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={disabled}
                  className="size-5 shrink-0 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                  aria-label={`${title} 삭제`}
                  onClick={() => removeItem(item.id)}
                >
                  <X className="size-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function displayAdjustmentLabel(label: string, fallback: string) {
  const trimmed = label.trim();
  return trimmed || fallback;
}

function FormulaBar({
  totalOrder,
  extraFees,
  discounts,
  totalExpense,
}: {
  totalOrder: number;
  extraFees: PurchaseGroupAdjustment[];
  discounts: PurchaseGroupAdjustment[];
  totalExpense: number;
}) {
  const extraTerms = extraFees.filter((item) => item.amount > 0);
  const discountTerms = discounts.filter((item) => item.amount > 0);

  return (
    <div className="flex flex-1 flex-wrap items-center justify-end gap-x-1.5 gap-y-1 text-[14px] tabular-nums">
      <span className="text-[var(--color-text-muted)]">주문금액</span>
      <span className="font-medium text-[var(--color-text-primary)]">
        {formatAmount(totalOrder)}
      </span>

      {extraTerms.map((item) => (
        <span key={item.id} className="inline-flex items-center gap-1.5">
          <span className="text-[var(--color-text-muted)]">−</span>
          <span className="text-[var(--color-text-muted)]">
            {displayAdjustmentLabel(item.label, "추가금")}
          </span>
          <span className="font-medium text-[var(--color-expense)]">
            {formatAmount(item.amount)}
          </span>
        </span>
      ))}

      {discountTerms.map((item) => (
        <span key={item.id} className="inline-flex items-center gap-1.5">
          <span className="text-[var(--color-text-muted)]">+</span>
          <span className="text-[var(--color-text-muted)]">
            {displayAdjustmentLabel(item.label, "할인금")}
          </span>
          <span className="font-medium text-[var(--primary-400)]">
            {formatAmount(item.amount)}
          </span>
        </span>
      ))}

      <span className="text-[var(--color-text-muted)]">=</span>
      <span className="text-[var(--color-text-muted)]">총금액</span>
      <span className="font-semibold text-[var(--color-expense)]">
        {formatAmount(totalExpense)}원
      </span>
    </div>
  );
}

export function ProductPurchaseGroupSummary({
  groupKey,
  totalOrder,
  meta,
  disabled,
  saving,
  onSave,
}: ProductPurchaseGroupSummaryProps) {
  const [draft, setDraft] = useState(() => cloneGroupAdjustments(meta));

  const savedKey = JSON.stringify({
    extraFees: meta.extraFees,
    discounts: meta.discounts,
  });

  useEffect(() => {
    setDraft(cloneGroupAdjustments(meta));
  }, [groupKey, savedKey, meta]);

  const isDirty = areGroupAdjustmentsDirty(meta, draft);

  const draftExpense = useMemo(
    () =>
      totalOrder +
      sumAdjustmentAmounts(draft.extraFees) -
      sumAdjustmentAmounts(draft.discounts),
    [totalOrder, draft.extraFees, draft.discounts],
  );

  const updateDraftItems = (
    fieldKey: "extraFees" | "discounts",
    items: PurchaseGroupAdjustment[],
  ) => {
    setDraft((prev) => ({ ...prev, [fieldKey]: items }));
  };

  const handleSave = () => {
    onSave({
      extraFees: sanitizeAdjustments(draft.extraFees),
      discounts: sanitizeAdjustments(draft.discounts),
    });
  };

  return (
    <div className="space-y-1.5 rounded-md border border-[var(--color-border)]/80 bg-[var(--color-bg)]/50 px-2.5 py-2">
      <div className="flex flex-col gap-4 sm:flex-row sm:gap-10">
        <AdjustmentColumn
          groupKey={groupKey}
          title="추가금"
          items={draft.extraFees}
          fieldKey="extraFees"
          sign="-"
          signClassName="text-[var(--color-expense)]"
          labelPlaceholder="배송비"
          disabled={disabled || saving}
          onItemsChange={updateDraftItems}
        />
        <AdjustmentColumn
          groupKey={groupKey}
          title="할인금"
          items={draft.discounts}
          fieldKey="discounts"
          sign="+"
          signClassName="text-[var(--primary-400)]"
          labelPlaceholder="쿠폰"
          disabled={disabled || saving}
          onItemsChange={updateDraftItems}
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[var(--color-border)]/80 pt-2">
        <FormulaBar
          totalOrder={totalOrder}
          extraFees={draft.extraFees}
          discounts={draft.discounts}
          totalExpense={draftExpense}
        />
        <Button
          type="button"
          size="sm"
          disabled={disabled || saving || !isDirty}
          className="h-7 shrink-0 bg-[var(--primary-500)] px-3 text-xs text-white hover:bg-[var(--primary-600)] disabled:opacity-50"
          onClick={handleSave}
        >
          {saving ? "저장 중…" : "저장"}
        </Button>
      </div>
    </div>
  );
}
