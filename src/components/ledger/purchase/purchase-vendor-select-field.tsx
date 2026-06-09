"use client";

import { useMemo, useState } from "react";
import { VendorManageDialog } from "@/components/ledger/purchase/vendor-manage-dialog";
import { LedgerPickerTrigger } from "@/components/ledger/ledger-picker-trigger";
import { useVendors } from "@/hooks/use-vendors";
import { formatVendorLabel } from "@/lib/vendor-label";
import { cn } from "@/lib/utils";
import type { VendorSummary } from "@/types/vendor";

interface PurchaseVendorSelectFieldProps {
  vendorId: string | null;
  onVendorIdChange: (vendorId: string | null) => void;
  /** API `vendorSnapshot` (목록에 없을 때 표시용) */
  vendorSnapshot?: VendorSummary | null;
  /** 마이그레이션 전 문자열 구매처명 */
  legacyVendorName?: string;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  disabled?: boolean;
}

export function PurchaseVendorSelectField({
  vendorId,
  onVendorIdChange,
  vendorSnapshot,
  legacyVendorName,
  required = false,
  className,
  labelClassName,
  disabled = false,
}: PurchaseVendorSelectFieldProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const {
    vendors,
    isLoading,
    errorMessage,
    createVendor,
    updateVendor,
    deleteVendor,
    isCreating,
    isUpdating,
    isDeleting,
  } = useVendors();

  const selectedFromList = useMemo(
    () => vendors.find((v) => v.id === vendorId) ?? null,
    [vendors, vendorId],
  );

  const displayLabel = useMemo(() => {
    if (selectedFromList) return formatVendorLabel(selectedFromList);
    if (vendorSnapshot && vendorSnapshot.id === vendorId) {
      return formatVendorLabel(vendorSnapshot);
    }
    if (legacyVendorName?.trim()) return legacyVendorName.trim();
    if (vendorId) return "삭제된 구매처 (재선택 권장)";
    return "선택";
  }, [vendorId, vendorSnapshot, legacyVendorName, selectedFromList]);

  const mutating = isCreating || isUpdating || isDeleting;
  const hasSelection = Boolean(vendorId || legacyVendorName);

  return (
    <>
      <LedgerPickerTrigger
        className={cn(className)}
        labelClassName={labelClassName}
        label={
          <>
            구매처
            {required ? (
              <span className="text-[var(--color-danger)]"> *</span>
            ) : null}
          </>
        }
        displayValue={displayLabel}
        isEmpty={!hasSelection}
        disabled={disabled}
        onOpen={() => setDialogOpen(true)}
        emptyHint={
          vendors.length === 0 && !isLoading
            ? "구매처가 없습니다. 클릭하여 추가해 주세요."
            : undefined
        }
      />

      <VendorManageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        vendors={vendors}
        selectedVendorId={vendorId}
        loading={isLoading}
        loadError={errorMessage}
        mutating={mutating}
        required={required}
        onSelect={async (id) => {
          onVendorIdChange(id);
          setDialogOpen(false);
        }}
        onClear={
          required
            ? undefined
            : async () => {
                onVendorIdChange(null);
                setDialogOpen(false);
              }
        }
        onCreate={async (body) => {
          const created = await createVendor(body);
          onVendorIdChange(created.id);
          setDialogOpen(false);
        }}
        onUpdate={async (id, body) => {
          await updateVendor(id, body);
        }}
        onDelete={async (id) => {
          await deleteVendor(id);
          if (vendorId === id) onVendorIdChange(null);
        }}
      />
    </>
  );
}
