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

const adjustmentLabelInputClass =
  "h-7 w-[4.5rem] rounded-[4px] border-[var(--color-border)] bg-white px-1.5 text-[11px]! leading-tight shadow-none placeholder:text-[11px] md:text-[11px]!";

const adjustmentAmountInputClass =
  "h-7 w-[4rem] rounded-[4px] border-[var(--color-border)] bg-white px-1.5 text-[11px]! leading-tight shadow-none tabular-nums placeholder:text-[11px] md:text-[11px]!";

function AdjustmentRow({
  groupKey,
  title,
  items,
  fieldKey,
  labelPlaceholder,
  disabled,
  onItemsChange,
}: {
  groupKey: string;
  title: string;
  items: PurchaseGroupAdjustment[];
  fieldKey: "extraFees" | "discounts";
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
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <div className="flex shrink-0 items-center gap-1.5">
        <span className="text-[11px] font-medium text-[var(--color-text-muted)]">
          {title}
        </span>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={disabled}
          className="size-6 border-[var(--color-border)] bg-white shadow-none"
          aria-label={`${title} 추가`}
          onClick={addItem}
        >
          <Plus className="size-3" />
        </Button>
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {items.map((item) => {
          const hasAmount = item.amount > 0;

          return (
            <div
              key={item.id}
              className="flex shrink-0 items-center gap-0.5 rounded-md border border-[var(--color-border)]/60 bg-white pr-0.5"
            >
              <Input
                id={`${fieldKey}-label-${groupKey}-${item.id}`}
                type="text"
                disabled={disabled}
                value={item.label}
                onChange={(e) => updateItem(item.id, { label: e.target.value })}
                placeholder={labelPlaceholder}
                className={cn(adjustmentLabelInputClass, "border-0 shadow-none")}
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
                className={cn(adjustmentAmountInputClass, "border-0 shadow-none")}
              />
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
    </div>
  );
}

function displayAdjustmentLabel(label: string, fallback: string) {
  const trimmed = label.trim();
  return trimmed || fallback;
}

function TotalSummaryRow({
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
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] tabular-nums">
      <span className="shrink-0 text-[11px] font-medium text-[var(--color-text-muted)]">
        총합계
      </span>
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
    <div className="mt-1.5 space-y-2 border-t border-[var(--color-border)]/40 pt-2">
      <AdjustmentRow
        groupKey={groupKey}
        title="추가금"
        items={draft.extraFees}
        fieldKey="extraFees"
        labelPlaceholder="배송비"
        disabled={disabled || saving}
        onItemsChange={updateDraftItems}
      />

      <AdjustmentRow
        groupKey={groupKey}
        title="할인금"
        items={draft.discounts}
        fieldKey="discounts"
        labelPlaceholder="쿠폰"
        disabled={disabled || saving}
        onItemsChange={updateDraftItems}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 gap-y-1.5">
        <TotalSummaryRow
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
