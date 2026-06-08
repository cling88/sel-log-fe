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
import { useAppDialog } from "@/components/common/app-dialog-provider";
import { REGISTER_MODAL_FOOTER_CLASS } from "@/components/ledger/purchase/ledger-register-dialog-classes";
import { PurchaseBankSelectField } from "@/components/ledger/purchase/purchase-bank-select-field";
import { formatDisplayDate, todayIso } from "@/lib/date";
import {
  createEmptyOtherExpenseInput,
  type OtherExpenseLine,
  type OtherExpenseLineInput,
} from "@/types/purchase-other";
import { cn } from "@/lib/utils";

interface OtherExpenseRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultPaymentDate?: string;
  editLine?: OtherExpenseLine | null;
  onSave: (line: Omit<OtherExpenseLine, "id">) => void;
  onUpdate?: (lineId: string, line: Omit<OtherExpenseLine, "id">) => void;
  onDelete?: () => void | Promise<void>;
}

function lineToInput(line: OtherExpenseLine): OtherExpenseLineInput {
  return {
    paymentDate: line.paymentDate,
    itemName: line.itemName,
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

function parseForm(
  form: OtherExpenseLineInput,
  editLine?: OtherExpenseLine | null,
): Omit<OtherExpenseLine, "id"> | null {
  const itemName = form.itemName.trim();
  const paymentDate = form.paymentDate.trim();
  const paymentAmount = Number(form.paymentAmount);

  if (!paymentDate || !itemName || paymentAmount < 0) {
    return null;
  }

  const bankId = resolveBankId(form.bankId);

  return {
    paymentDate,
    itemName,
    paymentAmount,
    memo: form.memo.trim(),
    bankId,
    bank:
      editLine && editLine.bankId === bankId && editLine.bank
        ? editLine.bank
        : null,
  };
}

export function OtherExpenseRegisterDialog({
  open,
  onOpenChange,
  defaultPaymentDate,
  editLine,
  onSave,
  onUpdate,
  onDelete,
}: OtherExpenseRegisterDialogProps) {
  const { alert } = useAppDialog();
  const isEdit = editLine != null;
  const [form, setForm] = useState<OtherExpenseLineInput>(() =>
    createEmptyOtherExpenseInput(resolvePaymentDate(defaultPaymentDate)),
  );
  const [error, setError] = useState<string | null>(null);
  const formSessionRef = useRef<string | null>(null);

  const resetForm = (paymentDate?: string) => {
    setForm(createEmptyOtherExpenseInput(resolvePaymentDate(paymentDate)));
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

  const patch = (patch: Partial<OtherExpenseLineInput>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setError(null);
  };

  const handleDelete = async () => {
    if (!isEdit || !onDelete) return;
    await onDelete();
  };

  const submit = async (closeAfter: boolean) => {
    const parsed = parseForm(form, editLine);
    if (!parsed) {
      setError("결제날짜, 항목명, 금액을 확인해 주세요.");
      return;
    }
    if (isEdit && editLine && onUpdate) {
      onUpdate(editLine.id, parsed);
      await alert("수정되었습니다.");
      onOpenChange(false);
      return;
    }
    onSave(parsed);
    await alert("등록되었습니다.");
    if (closeAfter) {
      onOpenChange(false);
      return;
    }
    formSessionRef.current = `new:${parsed.paymentDate}`;
    resetForm(parsed.paymentDate);
  };

  const displayDate = form.paymentDate || todayIso();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(80vh,480px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b border-[var(--color-border)] px-5 py-4">
          <DialogTitle>{isEdit ? "기타지출 상세" : "기타지출 등록"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "내역을 확인·수정하거나 삭제할 수 있습니다."
              : "월세·세무·통신 등 운영 비용입니다. 재고·원가와 무관하며 순수익 집계에 포함됩니다."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {error ? (
            <p className="mb-4 rounded-lg border border-[var(--color-danger)]/30 bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
              {error}
            </p>
          ) : null}

          <div className="grid gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="oe-date">
                결제날짜 <span className="text-[var(--color-danger)]">*</span>
              </Label>
              <Input
                id="oe-date"
                type="date"
                value={form.paymentDate || todayIso()}
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
              <Label htmlFor="oe-name">
                항목명 <span className="text-[var(--color-danger)]">*</span>
              </Label>
              <Input
                id="oe-name"
                value={form.itemName}
                onChange={(e) => patch({ itemName: e.target.value })}
                placeholder="예: 월세, 세무 기장료"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="oe-amount">
                금액 <span className="text-[var(--color-danger)]">*</span>
              </Label>
              <Input
                id="oe-amount"
                type="number"
                min={0}
                value={form.paymentAmount}
                onChange={(e) => patch({ paymentAmount: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="oe-memo">비고</Label>
              <Textarea
                id="oe-memo"
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
            isEdit && onDelete && "sm:justify-between",
          )}
        >
          {isEdit && onDelete ? (
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            {isEdit ? (
              <Button type="button" onClick={() => void submit(true)}>
                저장
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => void submit(false)}
                >
                  저장 후 계속 추가
                </Button>
                <Button type="button" onClick={() => void submit(true)}>
                  저장하고 닫기
                </Button>
              </>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
