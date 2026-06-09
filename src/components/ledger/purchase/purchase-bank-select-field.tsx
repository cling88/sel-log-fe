"use client";

import { useEffect, useMemo, useState } from "react";
import { BankManageDialog } from "@/components/ledger/purchase/bank-manage-dialog";
import { LedgerPickerTrigger } from "@/components/ledger/ledger-picker-trigger";
import { useBanks } from "@/hooks/use-banks";
import { formatBankLabel } from "@/lib/bank-label";
import {
  getLastWithdrawalBankId,
  setLastWithdrawalBankId,
} from "@/lib/last-bank-id-storage";
import { cn } from "@/lib/utils";
import type { BankSummary } from "@/types/bank-account";

function isWithdrawalField(fieldLabel: string): boolean {
  return fieldLabel === "출금계좌";
}

interface PurchaseBankSelectFieldProps {
  bankId: string | null;
  onBankIdChange: (bankId: string | null) => void;
  /** API `bank` 스냅샷 (목록에 없을 때 표시용) */
  bankSnapshot?: BankSummary | null;
  /** 기본값: 출금계좌 (수익 탭 등에서는 입금계좌) */
  fieldLabel?: string;
  className?: string;
  labelClassName?: string;
  disabled?: boolean;
}

export function PurchaseBankSelectField({
  bankId,
  onBankIdChange,
  bankSnapshot,
  fieldLabel = "출금계좌",
  className,
  labelClassName,
  disabled = false,
}: PurchaseBankSelectFieldProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const {
    banks,
    isLoading,
    errorMessage,
    createBank,
    updateBank,
    deleteBank,
    isCreating,
    isUpdating,
    isDeleting,
  } = useBanks();

  const selectedFromList = useMemo(
    () => banks.find((b) => b.id === bankId) ?? null,
    [banks, bankId],
  );

  const displayLabel = useMemo(() => {
    if (selectedFromList) {
      return formatBankLabel(selectedFromList, { maskAccount: true });
    }
    if (bankSnapshot && bankSnapshot.id === bankId) {
      return formatBankLabel(bankSnapshot, { maskAccount: true });
    }
    if (bankId) return `삭제된 ${fieldLabel} (재선택 권장)`;
    return "선택";
  }, [bankId, bankSnapshot, fieldLabel, selectedFromList]);

  const rememberWithdrawalBank = (id: string | null) => {
    if (id && isWithdrawalField(fieldLabel)) {
      setLastWithdrawalBankId(id);
    }
    onBankIdChange(id);
  };

  useEffect(() => {
    if (disabled || bankId || !isWithdrawalField(fieldLabel)) return;
    const lastId = getLastWithdrawalBankId();
    if (!lastId || !banks.some((b) => b.id === lastId)) return;
    onBankIdChange(lastId);
  }, [bankId, banks, disabled, fieldLabel, onBankIdChange]);

  const mutating = isCreating || isUpdating || isDeleting;

  return (
    <>
      <LedgerPickerTrigger
        className={cn(className)}
        labelClassName={labelClassName}
        label={fieldLabel}
        displayValue={displayLabel}
        isEmpty={!bankId}
        disabled={disabled}
        onOpen={() => setDialogOpen(true)}
        emptyHint={
          banks.length === 0 && !isLoading
            ? `${fieldLabel}가 없습니다. 클릭하여 추가해 주세요.`
            : undefined
        }
      />

      <BankManageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        banks={banks}
        selectedBankId={bankId}
        loading={isLoading}
        loadError={errorMessage}
        mutating={mutating}
        onSelect={async (id) => {
          rememberWithdrawalBank(id);
          setDialogOpen(false);
        }}
        onClear={async () => {
          rememberWithdrawalBank(null);
          setDialogOpen(false);
        }}
        onCreate={async (body) => {
          const created = await createBank(body);
          rememberWithdrawalBank(created.id);
          setDialogOpen(false);
        }}
        onUpdate={async (id, body) => {
          await updateBank(id, body);
        }}
        onDelete={async (id) => {
          await deleteBank(id);
          if (bankId === id) rememberWithdrawalBank(null);
        }}
      />
    </>
  );
}
