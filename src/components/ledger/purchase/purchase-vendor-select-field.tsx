"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { VendorManageDialog } from "@/components/ledger/purchase/vendor-manage-dialog";
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

  return (
    <>
      <div className={cn("space-y-1.5", className)}>
        <div className="flex items-center justify-between gap-2">
          <Label className={labelClassName}>
            구매처
            {required ? (
              <span className="text-[var(--color-danger)]"> *</span>
            ) : null}
          </Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 whitespace-nowrap"
            disabled={disabled}
            onClick={() => setDialogOpen(true)}
          >
            선택
          </Button>
        </div>
        <div
          className={cn(
            "flex min-h-9 items-center rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm",
            vendorId || legacyVendorName
              ? "text-[var(--color-text-primary)]"
              : "text-[var(--color-text-muted)]",
          )}
        >
          <span className="min-w-0 truncate">{displayLabel}</span>
        </div>
        {vendors.length === 0 && !isLoading ? (
          <p className="text-xs text-[var(--color-text-muted)]">
            구매처가 없습니다. 선택 버튼에서 추가해 주세요.
          </p>
        ) : null}
      </div>

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
