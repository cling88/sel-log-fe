"use client";

import { useEffect, useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
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
import { MODAL_DIALOG_FOOTER_CLASS } from "@/components/common/modal-footer-classes";
import { formatBankLabel } from "@/lib/bank-label";
import type { BankAccount, BankAccountInput } from "@/types/bank-account";

const EMPTY_INPUT: BankAccountInput = {
  bankName: "",
  accountNumber: "",
  accountHolder: "",
};

function isValidInput(input: BankAccountInput): boolean {
  return (
    input.bankName.trim().length > 0 &&
    input.accountNumber.trim().length > 0 &&
    input.accountHolder.trim().length > 0
  );
}

export interface BankManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banks: BankAccount[];
  selectedBankId?: string | null;
  loading?: boolean;
  loadError?: string | null;
  mutating?: boolean;
  onSelect: (id: string) => void | Promise<void>;
  onClear?: () => void | Promise<void>;
  onCreate: (body: BankAccountInput) => void | Promise<void>;
  onUpdate: (id: string, body: BankAccountInput) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

export function BankManageDialog({
  open,
  onOpenChange,
  banks,
  selectedBankId,
  loading = false,
  loadError = null,
  mutating = false,
  onSelect,
  onClear,
  onCreate,
  onUpdate,
  onDelete,
}: BankManageDialogProps) {
  const [newInput, setNewInput] = useState<BankAccountInput>(EMPTY_INPUT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingInput, setEditingInput] = useState<BankAccountInput>(EMPTY_INPUT);

  useEffect(() => {
    if (!open) return;
    setNewInput(EMPTY_INPUT);
    setEditingId(null);
    setEditingInput(EMPTY_INPUT);
  }, [open]);

  const handleCreate = async () => {
    if (!isValidInput(newInput)) return;
    await onCreate({
      bankName: newInput.bankName.trim(),
      accountNumber: newInput.accountNumber.trim(),
      accountHolder: newInput.accountHolder.trim(),
    });
    setNewInput(EMPTY_INPUT);
  };

  const handleStartEdit = (bank: BankAccount) => {
    setEditingId(bank.id);
    setEditingInput({
      bankName: bank.bankName,
      accountNumber: bank.accountNumber,
      accountHolder: bank.accountHolder,
    });
  };

  const handleConfirmEdit = async () => {
    if (!editingId || !isValidInput(editingInput)) return;
    await onUpdate(editingId, {
      bankName: editingInput.bankName.trim(),
      accountNumber: editingInput.accountNumber.trim(),
      accountHolder: editingInput.accountHolder.trim(),
    });
    setEditingId(null);
    setEditingInput(EMPTY_INPUT);
  };

  const handleDelete = async (id: string) => {
    await onDelete(id);
    if (editingId === id) {
      setEditingId(null);
      setEditingInput(EMPTY_INPUT);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(85vh,560px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        aria-describedby={undefined}
      >
        <DialogHeader className="border-b border-[var(--color-border)] px-5 py-4">
          <DialogTitle>출금계좌 선택</DialogTitle>
          <DialogDescription>
            계좌를 등록·선택합니다. 매입 등록 시 출금 계좌를 지정할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-4">
            {loadError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {loadError}
              </p>
            ) : null}

            <div className="space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/50 p-3">
              <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                계좌 추가
              </p>
              <div className="grid gap-2 sm:grid-cols-3">
                <div className="space-y-1 sm:col-span-3">
                  <Label htmlFor="bank-new-name" className="text-xs">
                    은행명
                  </Label>
                  <Input
                    id="bank-new-name"
                    value={newInput.bankName}
                    onChange={(e) =>
                      setNewInput((prev) => ({ ...prev, bankName: e.target.value }))
                    }
                    placeholder="카카오뱅크"
                    disabled={loading || mutating}
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="bank-new-number" className="text-xs">
                    계좌번호
                  </Label>
                  <Input
                    id="bank-new-number"
                    value={newInput.accountNumber}
                    onChange={(e) =>
                      setNewInput((prev) => ({
                        ...prev,
                        accountNumber: e.target.value,
                      }))
                    }
                    placeholder="3333-01-1234567"
                    disabled={loading || mutating}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="bank-new-holder" className="text-xs">
                    예금주
                  </Label>
                  <Input
                    id="bank-new-holder"
                    value={newInput.accountHolder}
                    onChange={(e) =>
                      setNewInput((prev) => ({
                        ...prev,
                        accountHolder: e.target.value,
                      }))
                    }
                    placeholder="홍길동"
                    disabled={loading || mutating}
                  />
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                className="h-8"
                disabled={loading || mutating || !isValidInput(newInput)}
                onClick={() => void handleCreate()}
              >
                + 계좌 추가
              </Button>
            </div>

            {loading ? (
              <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">
                출금계좌 불러오는 중...
              </p>
            ) : banks.length === 0 ? (
              <p className="py-4 text-sm text-[var(--color-text-muted)]">
                등록된 출금계좌가 없습니다. 위에서 추가해 주세요.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {banks.map((bank) => {
                  const isEditing = editingId === bank.id;
                  const isSelected = selectedBankId === bank.id;
                  return (
                    <li
                      key={bank.id}
                      className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2"
                    >
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={editingInput.bankName}
                            onChange={(e) =>
                              setEditingInput((prev) => ({
                                ...prev,
                                bankName: e.target.value,
                              }))
                            }
                            placeholder="은행명"
                          />
                          <Input
                            value={editingInput.accountNumber}
                            onChange={(e) =>
                              setEditingInput((prev) => ({
                                ...prev,
                                accountNumber: e.target.value,
                              }))
                            }
                            placeholder="계좌번호"
                          />
                          <Input
                            value={editingInput.accountHolder}
                            onChange={(e) =>
                              setEditingInput((prev) => ({
                                ...prev,
                                accountHolder: e.target.value,
                              }))
                            }
                            placeholder="예금주"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8"
                              onClick={() => {
                                setEditingId(null);
                                setEditingInput(EMPTY_INPUT);
                              }}
                            >
                              취소
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="h-8"
                              disabled={!isValidInput(editingInput)}
                              onClick={() => void handleConfirmEdit()}
                            >
                              저장
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">
                              {formatBankLabel(bank)}
                            </p>
                            {isSelected ? (
                              <span className="mt-1 inline-flex rounded-full bg-[var(--primary-50)] px-2 py-0.5 text-[10px] font-medium text-[var(--primary-600)]">
                                선택됨
                              </span>
                            ) : null}
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              className="h-8"
                              disabled={mutating}
                              onClick={() => void onSelect(bank.id)}
                            >
                              선택
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="h-8 w-8"
                              disabled={mutating}
                              onClick={() => handleStartEdit(bank)}
                              aria-label="계좌 수정"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="h-8 w-8"
                              disabled={mutating}
                              onClick={() => void handleDelete(bank.id)}
                              aria-label="계좌 삭제"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter className={MODAL_DIALOG_FOOTER_CLASS}>
          {onClear && selectedBankId ? (
            <Button
              type="button"
              variant="ghost"
              className="mr-auto text-[var(--color-text-secondary)]"
              onClick={() => void onClear()}
            >
              선택 해제
            </Button>
          ) : (
            <span className="mr-auto" />
          )}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
