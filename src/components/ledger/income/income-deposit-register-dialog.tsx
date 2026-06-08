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
import { REGISTER_MODAL_FOOTER_CLASS } from "@/components/ledger/purchase/ledger-register-dialog-classes";
import { PurchaseBankSelectField } from "@/components/ledger/purchase/purchase-bank-select-field";
import { useBanks } from "@/hooks/use-banks";
import { formatDisplayDate, todayIso } from "@/lib/date";
import type { BankSummary } from "@/types/bank-account";
import {
  createEmptyIncomeDepositInput,
  type IncomeDepositLine,
  type IncomeDepositLineInput,
} from "@/types/income";
import { cn } from "@/lib/utils";

interface IncomeDepositRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDepositDate?: string;
  editLine?: IncomeDepositLine | null;
  onSave: (
    line: Omit<IncomeDepositLine, "id">,
    options?: { closeAfter?: boolean },
  ) => void | Promise<void>;
  onUpdate?: (
    lineId: string,
    line: Omit<IncomeDepositLine, "id">,
  ) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
}

function lineToInput(line: IncomeDepositLine): IncomeDepositLineInput {
  return {
    depositDate: line.depositDate,
    itemName: line.itemName,
    amount: String(line.amount),
    vatAmount: line.vatAmount != null ? String(line.vatAmount) : "",
    commissionAmount:
      line.commissionAmount != null ? String(line.commissionAmount) : "",
    memo: line.memo,
    bankId: line.bankId ?? "",
  };
}

function resolveBankId(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed || null;
}

function resolveDepositDate(defaultDepositDate?: string): string {
  if (typeof defaultDepositDate === "string") {
    const trimmed = defaultDepositDate.trim();
    if (trimmed) return trimmed;
  }
  return todayIso();
}

function parseForm(
  form: IncomeDepositLineInput,
  editLine?: IncomeDepositLine | null,
  selectedBank?: BankSummary | null,
): Omit<IncomeDepositLine, "id"> | null {
  const itemName = form.itemName.trim();
  const depositDate = form.depositDate.trim();
  const amount = Number(form.amount);

  if (!depositDate || !itemName || amount < 0) {
    return null;
  }

  const vatAmount =
    form.vatAmount.trim() !== "" ? Math.max(0, Number(form.vatAmount) || 0) : undefined;
  const commissionAmount =
    form.commissionAmount.trim() !== ""
      ? Math.max(0, Number(form.commissionAmount) || 0)
      : undefined;

  const bankId = resolveBankId(form.bankId);

  return {
    depositDate,
    itemName,
    amount,
    ...(vatAmount != null ? { vatAmount } : {}),
    ...(commissionAmount != null ? { commissionAmount } : {}),
    memo: form.memo.trim(),
    bankId,
    bank:
      selectedBank ??
      (editLine && editLine.bankId === bankId && editLine.bank
        ? editLine.bank
        : null),
  };
}

export function IncomeDepositRegisterDialog({
  open,
  onOpenChange,
  defaultDepositDate,
  editLine,
  onSave,
  onUpdate,
  onDelete,
}: IncomeDepositRegisterDialogProps) {
  const { banks } = useBanks();
  const isEdit = editLine != null;
  const [form, setForm] = useState<IncomeDepositLineInput>(() =>
    createEmptyIncomeDepositInput(resolveDepositDate(defaultDepositDate)),
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const formSessionRef = useRef<string | null>(null);

  const resetForm = (depositDate?: string) => {
    setForm(createEmptyIncomeDepositInput(resolveDepositDate(depositDate)));
    setError(null);
  };

  useEffect(() => {
    if (!open) {
      formSessionRef.current = null;
      return;
    }

    const sessionKey = editLine
      ? `edit:${editLine.id}`
      : `new:${defaultDepositDate ?? ""}`;
    if (formSessionRef.current === sessionKey) return;
    formSessionRef.current = sessionKey;

    if (editLine) {
      setForm(lineToInput(editLine));
      setError(null);
      return;
    }
    resetForm(defaultDepositDate);
  }, [open, defaultDepositDate, editLine]);

  const patch = (patch: Partial<IncomeDepositLineInput>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setError(null);
  };

  const handleDelete = async () => {
    if (!isEdit || !onDelete) return;
    await onDelete();
  };

  const submit = async (closeAfter: boolean) => {
    const bankId = resolveBankId(form.bankId);
    const selectedBank = bankId
      ? (banks.find((bank) => bank.id === bankId) ?? null)
      : null;
    const parsed = parseForm(form, editLine, selectedBank);
    if (!parsed) {
      setError("입금일, 항목명, 금액을 확인해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      if (isEdit && editLine && onUpdate) {
        await Promise.resolve(onUpdate(editLine.id, parsed));
        return;
      }
      await Promise.resolve(onSave(parsed, { closeAfter }));
      if (!closeAfter) {
        formSessionRef.current = `new:${parsed.depositDate}`;
        resetForm(parsed.depositDate);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const displayDate = form.depositDate || todayIso();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,580px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b border-[var(--color-border)] px-5 py-4">
          <DialogTitle>{isEdit ? "입금 상세" : "입금 등록"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "입금 내역을 확인·수정하거나 삭제할 수 있습니다."
              : "통장에 실제 입금된 정산·수입을 기록합니다."}
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
              <Label htmlFor="inc-date">
                입금일 <span className="text-[var(--color-danger)]">*</span>
              </Label>
              <Input
                id="inc-date"
                type="date"
                value={form.depositDate || todayIso()}
                onChange={(e) => patch({ depositDate: e.target.value })}
              />
              <p className="text-xs text-[var(--color-text-muted)]">
                기본값: 오늘 ({formatDisplayDate(displayDate)})
              </p>
            </div>

            <PurchaseBankSelectField
              bankId={resolveBankId(form.bankId)}
              bankSnapshot={editLine?.bank}
              fieldLabel="입금계좌"
              onBankIdChange={(id) => patch({ bankId: id ?? "" })}
            />

            <div className="space-y-1.5">
              <Label htmlFor="inc-name">
                항목명 <span className="text-[var(--color-danger)]">*</span>
              </Label>
              <Input
                id="inc-name"
                value={form.itemName}
                onChange={(e) => patch({ itemName: e.target.value })}
                placeholder="예: 네이버 정산, 쿠팡 정산"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inc-amount">
                금액 <span className="text-[var(--color-danger)]">*</span>
              </Label>
              <Input
                id="inc-amount"
                type="number"
                min={0}
                value={form.amount}
                onChange={(e) => patch({ amount: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="inc-vat">부가세</Label>
                <Input
                  id="inc-vat"
                  type="number"
                  min={0}
                  value={form.vatAmount}
                  onChange={(e) => patch({ vatAmount: e.target.value })}
                  placeholder="없으면 비워두세요"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="inc-commission">플랫폼 수수료</Label>
                <Input
                  id="inc-commission"
                  type="number"
                  min={0}
                  value={form.commissionAmount}
                  onChange={(e) => patch({ commissionAmount: e.target.value })}
                  placeholder="없으면 비워두세요"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="inc-memo">비고</Label>
              <Textarea
                id="inc-memo"
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
