"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDisplayDate, todayIso } from "@/lib/date";
import { cn } from "@/lib/utils";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import { REGISTER_MODAL_FOOTER_CLASS } from "@/components/ledger/purchase/ledger-register-dialog-classes";
import { PurchaseBankSelectField } from "@/components/ledger/purchase/purchase-bank-select-field";
import { PurchaseVendorSelectField } from "@/components/ledger/purchase/purchase-vendor-select-field";
import { useVendors } from "@/hooks/use-vendors";
import type { VendorSummary } from "@/types/vendor";
import {
  createEmptySupplyExpenseInput,
  type SupplyExpenseLine,
  type SupplyExpenseLineInput,
} from "@/types/purchase-supply";

interface SupplyExpenseRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPaymentDate?: string;
  editLine?: SupplyExpenseLine | null;
  onSave: (
    line: Omit<SupplyExpenseLine, "id" | "stockReflected">,
    options?: { closeAfter?: boolean },
  ) => void | Promise<void>;
  onUpdate?: (
    lineId: string,
    line: Omit<SupplyExpenseLine, "id" | "stockReflected">,
  ) => void;
  onDelete?: () => void | Promise<void>;
  canDelete?: boolean;
  deleteDisabledReason?: string;
}

function lineToInput(line: SupplyExpenseLine): SupplyExpenseLineInput {
  return {
    paymentDate: line.paymentDate,
    itemName: line.itemName,
    vendorId: line.vendorId ?? "",
    quantity: String(line.quantity),
    paymentAmount: String(line.paymentAmount),
    memo: line.memo,
    bankId: line.bankId ?? "",
  };
}

function resolvePaymentDate(defaultPaymentDate?: string): string {
  if (typeof defaultPaymentDate === "string") {
    const trimmed = defaultPaymentDate.trim();
    if (trimmed) return trimmed;
  }
  return todayIso();
}

function resolveBankId(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed || null;
}

function resolveVendorId(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed || null;
}

function parseForm(
  form: SupplyExpenseLineInput,
  selectedVendor: VendorSummary | null,
  editLine?: SupplyExpenseLine | null,
): Omit<SupplyExpenseLine, "id" | "stockReflected"> | null {
  const itemName = form.itemName.trim();
  const paymentDate = form.paymentDate.trim();
  const quantity = Number(form.quantity);
  const paymentAmount = Number(form.paymentAmount);
  const vendorId = resolveVendorId(form.vendorId);

  if (!paymentDate || !itemName || quantity <= 0 || paymentAmount < 0) {
    return null;
  }
  if (vendorId && (!selectedVendor || selectedVendor.id !== vendorId)) {
    return null;
  }

  const bankId = resolveBankId(form.bankId);

  return {
    paymentDate,
    itemName,
    vendor: selectedVendor?.name ?? "",
    vendorId,
    vendorSnapshot: selectedVendor,
    quantity,
    paymentAmount,
    memo: form.memo.trim(),
    bankId,
    bank:
      editLine && editLine.bankId === bankId && editLine.bank
        ? editLine.bank
        : null,
  };
}

/** 재고반영 후 PATCH에 넣으면 안 되는 필드 — 원본 라인 값 유지 */
function applySupplyStockLockedFields(
  payload: Omit<SupplyExpenseLine, "id" | "stockReflected">,
  editLine: SupplyExpenseLine,
): Omit<SupplyExpenseLine, "id" | "stockReflected"> {
  return {
    ...payload,
    paymentDate: editLine.paymentDate,
    itemName: editLine.itemName,
    quantity: editLine.quantity,
    paymentAmount: editLine.paymentAmount,
  };
}

export function SupplyExpenseRegisterDialog({
  open,
  onOpenChange,
  defaultPaymentDate,
  editLine,
  onSave,
  onUpdate,
  onDelete,
  canDelete = true,
  deleteDisabledReason,
}: SupplyExpenseRegisterDialogProps) {
  const { alert } = useAppDialog();
  const { vendors } = useVendors();
  const isEdit = editLine != null;
  const stockLocked = Boolean(editLine?.stockReflected);
  const [form, setForm] = useState<SupplyExpenseLineInput>(() =>
    createEmptySupplyExpenseInput(resolvePaymentDate(defaultPaymentDate)),
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formSessionRef = useRef<string | null>(null);

  const resetForm = (paymentDate?: string) => {
    setForm(createEmptySupplyExpenseInput(resolvePaymentDate(paymentDate)));
    setError(null);
  };

  useEffect(() => {
    if (!open) {
      formSessionRef.current = null;
      return;
    }

    const sessionKey = editLine
      ? `edit:${editLine.id}`
      : `new:${defaultPaymentDate ?? ""}`;
    if (formSessionRef.current === sessionKey) return;
    formSessionRef.current = sessionKey;

    if (editLine) {
      setForm(lineToInput(editLine));
      setError(null);
      return;
    }
    resetForm(defaultPaymentDate);
  }, [open, defaultPaymentDate, editLine]);

  const patch = (patch: Partial<SupplyExpenseLineInput>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setError(null);
  };

  const handleDelete = async () => {
    if (!isEdit || !onDelete) return;
    if (!canDelete) {
      await alert(deleteDisabledReason ?? "삭제할 수 없는 상태입니다.");
      return;
    }
    await onDelete();
  };

  const submit = async (closeAfter: boolean) => {
    const vendorId = resolveVendorId(form.vendorId);
    const selectedVendor =
      vendorId != null
        ? vendors.find((v) => v.id === vendorId) ?? null
        : null;
    const parsed = parseForm(form, selectedVendor, editLine);
    if (!parsed) {
      setError("결제날짜, 항목명, 수량, 금액을 확인해 주세요.");
      return;
    }

    const payload =
      stockLocked && editLine
        ? applySupplyStockLockedFields(parsed, editLine)
        : parsed;

    setSubmitting(true);
    try {
      if (isEdit && editLine && onUpdate) {
        await Promise.resolve(onUpdate(editLine.id, payload));
        await alert("수정되었습니다.");
        onOpenChange(false);
        return;
      }
      await Promise.resolve(onSave(payload, { closeAfter }));
      if (!closeAfter) {
        formSessionRef.current = `new:${payload.paymentDate}`;
        resetForm(payload.paymentDate);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const displayDate = form.paymentDate || todayIso();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(85vh,560px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b border-[var(--color-border)] px-5 py-4">
          <DialogTitle>{isEdit ? "부가 항목 상세" : "부가 항목 등록"}</DialogTitle>
          <DialogDescription>
            {stockLocked
              ? "재고 반영된 내역입니다. 구매처·출금계좌·메모만 수정할 수 있습니다."
              : isEdit
                ? "내역을 확인·수정하거나 삭제할 수 있습니다."
                : "포장·소모품 등 부가 비용입니다. 재고 반영은 저장 후 목록에서 진행할 수 있습니다."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {stockLocked ? (
            <p className="mb-4 rounded-lg border border-[var(--color-warning)]/40 bg-amber-50 px-3 py-2 text-sm text-[var(--color-text-secondary)]">
              구매처·출금계좌·메모만 수정할 수 있습니다. 결제일·항목명·수량·금액은 재고반영과
              연결되어 변경할 수 없습니다.
            </p>
          ) : null}
          {stockLocked && editLine?.productSku ? (
            <p className="mb-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text-secondary)]">
              재고 반영 SKU{" "}
              <span className="font-mono font-medium text-[var(--color-text-primary)]">
                {editLine.productSku}
              </span>
              {editLine.reflectedQty != null ? (
                <>
                  {" · 반영 "}
                  <span className="tabular-nums text-[var(--color-text-primary)]">
                    {editLine.reflectedQty}개
                  </span>
                </>
              ) : null}
            </p>
          ) : null}
          {error ? (
            <p className="mb-4 rounded-lg border border-[var(--color-danger)]/30 bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
              {error}
            </p>
          ) : null}

          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="se-date">
                결제날짜 <span className="text-[var(--color-danger)]">*</span>
              </Label>
              <Input
                id="se-date"
                type="date"
                value={form.paymentDate || todayIso()}
                disabled={stockLocked}
                onChange={(e) => patch({ paymentDate: e.target.value })}
              />
              <p className="text-xs text-[var(--color-text-muted)]">
                기본값: 오늘 ({formatDisplayDate(displayDate)})
              </p>
            </div>

            <PurchaseBankSelectField
              bankId={resolveBankId(form.bankId)}
              bankSnapshot={editLine?.bank}
              onBankIdChange={(id) => patch({ bankId: id ?? "" })}
            />

            <div className="space-y-1.5">
              <Label htmlFor="se-name">
                항목명 <span className="text-[var(--color-danger)]">*</span>
              </Label>
              <Input
                id="se-name"
                value={form.itemName}
                disabled={stockLocked}
                onChange={(e) => patch({ itemName: e.target.value })}
                placeholder="예: 골판지 박스, 완충재"
              />
            </div>

            <PurchaseVendorSelectField
              vendorId={resolveVendorId(form.vendorId)}
              vendorSnapshot={editLine?.vendorSnapshot}
              legacyVendorName={
                !editLine?.vendorId && editLine?.vendor
                  ? editLine.vendor
                  : undefined
              }
              onVendorIdChange={(id) => patch({ vendorId: id ?? "" })}
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="se-qty">
                  수량 <span className="text-[var(--color-danger)]">*</span>
                </Label>
                <Input
                  id="se-qty"
                  type="number"
                  min={1}
                  value={form.quantity}
                  disabled={stockLocked}
                  onChange={(e) => patch({ quantity: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="se-amount">
                  금액 <span className="text-[var(--color-danger)]">*</span>
                </Label>
                <Input
                  id="se-amount"
                  type="number"
                  min={0}
                  value={form.paymentAmount}
                  disabled={stockLocked}
                  onChange={(e) => patch({ paymentAmount: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="se-memo">비고</Label>
              <Textarea
                id="se-memo"
                rows={4}
                value={form.memo}
                onChange={(e) => patch({ memo: e.target.value })}
                placeholder="메모, 특이사항 등"
                className="min-h-[6.5rem] resize-y"
              />
            </div>
          </div>
        </div>

        <DialogFooter
          className={cn(
            REGISTER_MODAL_FOOTER_CLASS,
            isEdit && onDelete && !stockLocked && "sm:justify-between",
          )}
        >
          {isEdit && onDelete && !stockLocked ? (
            <Button
              type="button"
              variant="outline"
              className="border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-red-50"
              onClick={() => void handleDelete()}
            >
              삭제
            </Button>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>
              취소
            </Button>
            {isEdit ? (
              <Button type="button" disabled={submitting} onClick={() => void submit(true)}>
                {submitting ? "저장 중…" : "저장"}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={submitting}
                  onClick={() => void submit(false)}
                >
                  {submitting ? "저장 중…" : "저장 후 계속 추가"}
                </Button>
                <Button type="button" disabled={submitting} onClick={() => void submit(true)}>
                  {submitting ? "저장 중…" : "저장하고 닫기"}
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
