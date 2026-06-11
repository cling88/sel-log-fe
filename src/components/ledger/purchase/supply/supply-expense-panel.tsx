"use client";

import { useEffect, useMemo, useState } from "react";
import { useLedgerMonthScope } from "@/hooks/use-ledger-month";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import { useLedgerUrlSearch } from "@/hooks/use-ledger-url-search";
import {
  getPurchaseErrorMessage,
  useCancelSupplyStockReflect,
  useCreateSupplyExpenseLine,
  useDeleteSupplyExpenseLine,
  usePatchSupplyVendorGroup,
  useReflectSupplyStock,
  useSupplyExpenseList,
  useUpdateSupplyExpenseLine,
} from "@/hooks/use-purchase";
import { LedgerEmptyState } from "@/components/ledger/empty-state";
import {
  LedgerListShell,
  ledgerListBodyClass,
  ledgerListFooterClass,
} from "@/components/ledger/ledger-list-shell";
import {
  LedgerStockReflectDialog,
  type StockReflectInfo,
} from "@/components/ledger/purchase/ledger-stock-reflect-dialog";
import { PurchaseListPagination } from "@/components/ledger/purchase/purchase-list-pagination";
import { PurchaseListToolbar } from "@/components/ledger/purchase/purchase-list-toolbar";
import { SupplyExpenseGroupList } from "@/components/ledger/purchase/supply/supply-expense-group-list";
import { SupplyExpenseRegisterDialog } from "@/components/ledger/purchase/supply/supply-expense-register-dialog";
import { Button } from "@/components/ui/button";
import { toSupplyLinePayload } from "@/lib/api/purchase";
import { sanitizeAdjustments } from "@/types/purchase-group";
import type { PurchaseGroupAdjustment } from "@/types/purchase-group";
import type { SupplyExpenseLine } from "@/types/purchase-supply";
import { supplyVendorGroupKey } from "@/types/purchase-supply";

export function SupplyExpensePanel() {
  const { alert, confirm } = useAppDialog();
  const { search, committedSearch, setSearch, applySearch } = useLedgerUrlSearch({
    commit: "manual",
  });
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState<string | undefined>();
  const [editLineId, setEditLineId] = useState<string | null>(null);
  const [stockReflectLineId, setStockReflectLineId] = useState<string | null>(
    null,
  );
  const [savingSummaryKey, setSavingSummaryKey] = useState<string | null>(null);
  const { scopeKey: monthScope, month: scopedMonth } = useLedgerMonthScope();

  useEffect(() => {
    setPage(1);
  }, [monthScope, committedSearch]);

  const {
    data: listData,
    isLoading,
    isError,
    error,
    refetch,
  } = useSupplyExpenseList(committedSearch, page);

  const createLine = useCreateSupplyExpenseLine();
  const updateLine = useUpdateSupplyExpenseLine();
  const deleteLineMut = useDeleteSupplyExpenseLine();
  const reflectStock = useReflectSupplyStock();
  const cancelReflect = useCancelSupplyStockReflect();
  const patchVendorGroup = usePatchSupplyVendorGroup();

  const stockActionsDisabled =
    reflectStock.isPending || cancelReflect.isPending;

  const groups = listData?.groups ?? [];
  const lines = listData?.lines ?? [];
  const listMeta = listData?.meta;
  const listTotal = listMeta?.total ?? 0;
  const listPage = listMeta?.page ?? page;
  const listLimit = listMeta?.limit ?? 5;
  const totalPages = Math.max(1, Math.ceil(listTotal / listLimit));

  const editLine = lines.find((l) => l.id === editLineId) ?? null;

  const stockReflectLine = lines.find((l) => l.id === stockReflectLineId) ?? null;

  const stockReflectTarget = useMemo(() => {
    if (!stockReflectLine) return null;
    return {
      id: stockReflectLine.id,
      title: stockReflectLine.itemName,
      subtitle: stockReflectLine.vendor || undefined,
      quantity: stockReflectLine.quantity,
      lineContext: {
        itemName: stockReflectLine.itemName,
        paymentAmount: stockReflectLine.paymentAmount,
        quantity: stockReflectLine.quantity,
        vendor: stockReflectLine.vendor,
        memo: stockReflectLine.memo,
      },
    };
  }, [stockReflectLine]);

  const openRegister = (paymentDate?: string) => {
    setEditLineId(null);
    setDialogDate(paymentDate);
    setDialogOpen(true);
  };

  const openLineDetail = (lineId: string) => {
    setEditLineId(lineId);
    setDialogOpen(true);
  };

  const handleDeleteLine = async (lineId: string) => {
    const line = lines.find((l) => l.id === lineId);
    if (line?.stockReflected) {
      await alert(
        "재고 반영된 내역입니다. 삭제하려면 먼저 반영을 취소해 주세요.",
      );
      return;
    }
    const ok = await confirm({
      title: "내역 삭제",
      message: "이 내역을 삭제할까요?",
      confirmLabel: "삭제",
      destructive: true,
    });
    if (!ok) return;
    await deleteLineMut.mutateAsync(lineId);
    setDialogOpen(false);
    setEditLineId(null);
    await alert("삭제되었습니다.");
  };

  const handleCancelStockReflect = async (lineId: string) => {
    const ok = await confirm({
      title: "재고 반영 취소",
      message: "이 내역의 재고 반영을 취소할까요?",
      confirmLabel: "반영 취소",
    });
    if (!ok) return;
    try {
      await cancelReflect.mutateAsync(lineId);
      await alert("재고 반영이 취소되었습니다.");
    } catch {
      // useCancelSupplyStockReflect onError에서 메시지 표시
    }
  };

  const finishStockReflect = async (lineId: string, info: StockReflectInfo) => {
    await reflectStock.mutateAsync({
      id: lineId,
      body: { productSku: info.sku, qty: info.qty },
    });
    setStockReflectLineId(null);
    await alert("재고 반영이 완료되었습니다.");
  };

  const handleSave = async (
    input: Omit<SupplyExpenseLine, "id" | "stockReflected">,
    options?: { closeAfter?: boolean },
  ) => {
    await createLine.mutateAsync(toSupplyLinePayload(input));
    await alert("등록되었습니다.");
    if (options?.closeAfter !== false) {
      setDialogOpen(false);
    }
  };

  const handleSaveVendorSummary = async (
    paymentDate: string,
    vendorId: string | null,
    patch: Pick<
      { extraFees: PurchaseGroupAdjustment[]; discounts: PurchaseGroupAdjustment[] },
      "extraFees" | "discounts"
    >,
  ) => {
    const key = `${paymentDate}:${supplyVendorGroupKey(vendorId)}`;
    setSavingSummaryKey(key);
    try {
      await patchVendorGroup.mutateAsync({
        paymentDate,
        vendorId: vendorId?.trim() || null,
        extraFees: sanitizeAdjustments(patch.extraFees).map(
          ({ id, label, amount }) => ({ id, label, amount }),
        ),
        discounts: sanitizeAdjustments(patch.discounts).map(
          ({ id, label, amount }) => ({ id, label, amount }),
        ),
      });
      await alert("추가금·할인금이 저장되었습니다.");
    } finally {
      setSavingSummaryKey(null);
    }
  };

  const emptyPeriodLabel = scopedMonth == null ? "해당 연도" : "이번 달";

  const hasCommittedSearch = committedSearch.trim().length > 0;
  const showCatalogEmpty =
    !hasCommittedSearch && !isLoading && !isError && listTotal === 0;

  return (
    <>
      {showCatalogEmpty ? (
        <LedgerEmptyState
          title="부가"
          description="포장재·소모품 등을 등록하세요. 재고 반영은 선택 사항입니다."
          actionLabel="+ 부가 항목 등록하기"
          onAction={() => openRegister()}
        />
      ) : (
        <LedgerListShell>
        <PurchaseListToolbar
          embedded
          search={search}
          onSearchChange={setSearch}
          searchSubmitMode
          onSearchSubmit={() => {
            applySearch();
            setPage(1);
          }}
          onSearchClear={() => {
            applySearch("");
            setPage(1);
          }}
          searchPlaceholder="항목명, 구매처, 비고 검색"
          registerLabel="+ 부가 항목 등록"
          onRegister={() => openRegister()}
        />
        {isLoading && groups.length === 0 ? (
          <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">
            부가 비용 목록을 불러오는 중입니다.
          </p>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-12">
            <p className="text-sm text-[var(--color-danger)]">
              {getPurchaseErrorMessage(error)}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
              다시 시도
            </Button>
          </div>
        ) : groups.length === 0 ? (
          <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">
            {hasCommittedSearch
              ? "검색 결과가 없습니다."
              : `${emptyPeriodLabel} 부가 비용 내역이 없습니다.`}
          </p>
        ) : (
          <>
            <div className={ledgerListBodyClass}>
              <SupplyExpenseGroupList
                storageScopeKey={monthScope}
                groups={groups}
                stockActionsDisabled={stockActionsDisabled}
                onAddToGroup={(date) => openRegister(date)}
                onReflectStock={setStockReflectLineId}
                onCancelStockReflect={(id) => void handleCancelStockReflect(id)}
                onLineClick={openLineDetail}
                onSaveVendorSummary={handleSaveVendorSummary}
                savingSummaryKey={savingSummaryKey}
              />
            </div>
            <div className={ledgerListFooterClass}>
              <PurchaseListPagination
                page={listPage}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </>
        )}
      </LedgerListShell>
      )}

      <SupplyExpenseRegisterDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditLineId(null);
        }}
        defaultPaymentDate={dialogDate}
        editLine={editLine}
        onSave={handleSave}
        onUpdate={async (lineId, input) => {
          await updateLine.mutateAsync({ id: lineId, line: input });
          setEditLineId(null);
          setDialogOpen(false);
          await alert("저장되었습니다.");
        }}
        onDelete={
          editLine ? () => handleDeleteLine(editLine.id) : undefined
        }
        canDelete={!editLine?.stockReflected}
        deleteDisabledReason="재고 반영 후 삭제하려면 반영취소하세요."
      />

      <LedgerStockReflectDialog
        open={stockReflectLineId != null}
        onOpenChange={(open) => {
          if (!open) setStockReflectLineId(null);
        }}
        target={stockReflectTarget}
        onConfirm={(lineId, info) => finishStockReflect(lineId, info)}
      />
    </>
  );
}
