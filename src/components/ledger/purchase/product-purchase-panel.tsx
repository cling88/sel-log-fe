"use client";

import { useEffect, useMemo, useState } from "react";
import { useLedgerMonthParam } from "@/hooks/use-ledger-month";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import { useLedgerUrlSearch } from "@/hooks/use-ledger-url-search";
import {
  getPurchaseErrorMessage,
  linePayloadFromProductPurchase,
  useCancelProductPurchaseStockReflect,
  useCreateProductPurchaseLine,
  useDeleteProductPurchaseLine,
  usePatchPurchaseGroup,
  usePatchPurchaseGroupCancel,
  usePatchPurchaseVendorGroup,
  usePatchPurchaseVendorGroupCancel,
  useProductPurchaseList,
  useReflectProductPurchaseStock,
  useUpdateProductPurchaseLine,
} from "@/hooks/use-purchase";
import { LedgerEmptyState } from "@/components/ledger/empty-state";
import {
  LedgerListShell,
  ledgerListBodyClass,
  ledgerListFooterClass,
} from "@/components/ledger/ledger-list-shell";
import { LedgerStockReflectDialog } from "@/components/ledger/purchase/ledger-stock-reflect-dialog";
import { ProductPurchaseGroupEditDialog } from "@/components/ledger/purchase/product-purchase-group-edit-dialog";
import { ProductPurchaseGroupList } from "@/components/ledger/purchase/product-purchase-group-list";
import { ProductPurchaseRegisterDialog } from "@/components/ledger/purchase/product-purchase-register-dialog";
import { PurchaseListPagination } from "@/components/ledger/purchase/purchase-list-pagination";
import { PurchaseListToolbar } from "@/components/ledger/purchase/purchase-list-toolbar";
import { Button } from "@/components/ui/button";
import {
  sanitizeAdjustments,
  vendorGroupLinesTotal,
  type PurchaseGroupAdjustment,
} from "@/types/purchase-group";
import type { ProductPurchaseLine } from "@/types/purchase-product";
import type { StockReflectInfo } from "@/components/ledger/purchase/ledger-stock-reflect-dialog";

export function ProductPurchasePanel() {
  const { alert, confirm } = useAppDialog();
  const { search, committedSearch, setSearch, applySearch } = useLedgerUrlSearch({
    commit: "manual",
  });
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState<string | undefined>();
  const [editLineId, setEditLineId] = useState<string | null>(null);
  const [editGroupDate, setEditGroupDate] = useState<string | null>(null);
  const [stockReflectLineId, setStockReflectLineId] = useState<string | null>(
    null,
  );
  const [bulkQueue, setBulkQueue] = useState<string[]>([]);
  const [savingSummaryKey, setSavingSummaryKey] = useState<string | null>(null);
  const month = useLedgerMonthParam();

  useEffect(() => {
    setPage(1);
  }, [month, committedSearch]);

  const {
    data: listData,
    isLoading,
    isError,
    error,
    refetch,
  } = useProductPurchaseList(committedSearch, page);

  const createLine = useCreateProductPurchaseLine();
  const updateLine = useUpdateProductPurchaseLine();
  const deleteLine = useDeleteProductPurchaseLine();
  const reflectStock = useReflectProductPurchaseStock();
  const cancelReflect = useCancelProductPurchaseStockReflect();
  const patchGroup = usePatchPurchaseGroup();
  const patchGroupCancel = usePatchPurchaseGroupCancel();
  const patchVendorGroup = usePatchPurchaseVendorGroup();
  const patchVendorGroupCancel = usePatchPurchaseVendorGroupCancel();

  const groups = listData?.groups ?? [];
  const lines = listData?.lines ?? [];
  const listMeta = listData?.meta;
  const listTotal = listMeta?.total ?? 0;
  const listPage = listMeta?.page ?? page;
  const listLimit = listMeta?.limit ?? 5;
  const totalPages = Math.max(1, Math.ceil(listTotal / listLimit));

  const editLine = lines.find((l) => l.id === editLineId) ?? null;

  const stockReflectLine =
    lines.find((l) => l.id === (stockReflectLineId ?? bulkQueue[0])) ?? null;

  const stockReflectTarget = useMemo(() => {
    if (!stockReflectLine) return null;

    let pricing: { totalOrder: number; totalExpense: number } | undefined;
    for (const group of groups) {
      for (const vendorGroup of group.vendorGroups) {
        if (vendorGroup.lines.some((l) => l.id === stockReflectLine.id)) {
          pricing = {
            totalOrder: vendorGroupLinesTotal(vendorGroup.lines),
            totalExpense: vendorGroup.subtotal,
          };
          break;
        }
      }
      if (pricing) break;
    }

    return {
      id: stockReflectLine.id,
      title: stockReflectLine.productName,
      subtitle: [
        stockReflectLine.vendor,
        stockReflectLine.orderNo ? `주문 ${stockReflectLine.orderNo}` : "",
      ]
        .filter(Boolean)
        .join(" · "),
      quantity: stockReflectLine.quantity,
      lineContext: {
        productName: stockReflectLine.productName,
        imageUrl: stockReflectLine.imageUrl,
        paymentAmount: stockReflectLine.paymentAmount,
        quantity: stockReflectLine.quantity,
        vendor: stockReflectLine.vendor,
        orderNo: stockReflectLine.orderNo,
        productLink: stockReflectLine.productLink,
        memo: stockReflectLine.memo,
        pricing,
      },
    };
  }, [stockReflectLine, groups]);

  const openRegister = (paymentDate?: string) => {
    setEditLineId(null);
    setDialogDate(paymentDate);
    setDialogOpen(true);
  };

  const openEditLine = (lineId: string) => {
    setEditLineId(lineId);
    setDialogOpen(true);
  };

  const handleSave = async (
    input: Omit<ProductPurchaseLine, "id" | "stockReflected">,
    options?: { closeAfter?: boolean },
  ) => {
    await createLine.mutateAsync(linePayloadFromProductPurchase(input));
    await alert("등록되었습니다.");
    if (options?.closeAfter !== false) {
      setDialogOpen(false);
    }
  };

  const handleUpdate = async (
    lineId: string,
    input: Omit<ProductPurchaseLine, "id" | "stockReflected">,
  ) => {
    const line = lines.find((l) => l.id === lineId);
    if (line?.stockReflected) {
      await alert(
        "재고 반영된 내역은 수정할 수 없습니다. 수정하려면 반영을 취소해 주세요.",
      );
      return;
    }
    await updateLine.mutateAsync({
      id: lineId,
      body: linePayloadFromProductPurchase(input),
    });
    setEditLineId(null);
    setDialogOpen(false);
    await alert("저장되었습니다.");
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
    await deleteLine.mutateAsync(lineId);
    setDialogOpen(false);
    setEditLineId(null);
    await alert("삭제되었습니다.");
  };

  const handleDeleteGroup = async (paymentDate: string) => {
    const groupLines = lines.filter((l) => l.paymentDate === paymentDate);
    if (groupLines.some((l) => l.stockReflected)) {
      await alert(
        "재고 반영된 내역이 있습니다. 반영 취소 후 삭제해 주세요.",
      );
      return;
    }
    const ok = await confirm({
      title: "그룹 삭제",
      message: "이 그룹의 모든 내역을 삭제할까요?",
      confirmLabel: "삭제",
      destructive: true,
    });
    if (!ok) return;
    for (const line of groupLines) {
      await deleteLine.mutateAsync(line.id);
    }
    await alert("그룹이 삭제되었습니다.");
  };

  const handleGroupSave = async ({
    paymentDate: newDate,
    groupName,
  }: {
    paymentDate: string;
    groupName: string;
  }) => {
    if (!editGroupDate) return;
    const oldDate = editGroupDate;
    const groupLines = lines.filter((l) => l.paymentDate === oldDate);

    if (newDate !== oldDate) {
      if (groupLines.some((l) => l.stockReflected)) {
        await alert(
          "재고 반영된 내역이 있어 결제날짜를 변경할 수 없습니다. 반영 취소 후 다시 시도해 주세요.",
        );
        return;
      }
      for (const line of groupLines) {
        await updateLine.mutateAsync({
          id: line.id,
          body: linePayloadFromProductPurchase({
            ...line,
            paymentDate: newDate,
          }),
        });
      }
    }

    await patchGroup.mutateAsync({
      paymentDate: newDate,
      groupName,
    });

    setEditGroupDate(null);
    await alert("그룹 정보가 저장되었습니다.");
  };

  const finishStockReflect = async (lineId: string, info: StockReflectInfo) => {
    await reflectStock.mutateAsync({
      id: lineId,
      body: { productSku: info.sku, qty: info.qty },
    });

    let remaining: string[] = [];
    setBulkQueue((q) => {
      remaining = q.filter((id) => id !== lineId);
      return remaining;
    });

    if (remaining.length === 0) {
      setStockReflectLineId(null);
      await alert("재고 반영이 완료되었습니다.");
      return;
    }

    setStockReflectLineId(remaining[0]);
  };

  const handleBulkStockReflect = async (paymentDate: string) => {
    const pending = lines
      .filter((l) => l.paymentDate === paymentDate && !l.stockReflected)
      .map((l) => l.id);
    if (pending.length === 0) return;
    const ok = await confirm({
      title: "일괄 재고 반영",
      message: `미반영 ${pending.length}건을 순서대로 재고 반영합니다.`,
      confirmLabel: "시작",
    });
    if (!ok) return;
    setBulkQueue(pending);
    setStockReflectLineId(pending[0]);
  };

  const handleBulkVendorStockReflect = async (
    paymentDate: string,
    vendorId: string,
  ) => {
    const pending = lines
      .filter(
        (l) =>
          l.paymentDate === paymentDate &&
          l.vendorId === vendorId &&
          !l.stockReflected,
      )
      .map((l) => l.id);
    if (pending.length === 0) return;
    const ok = await confirm({
      title: "구매처 재고 반영",
      message: `이 구매처 미반영 ${pending.length}건을 순서대로 재고 반영합니다.`,
      confirmLabel: "시작",
    });
    if (!ok) return;
    setBulkQueue(pending);
    setStockReflectLineId(pending[0]);
  };

  const handleToggleDateOrderCancel = async (paymentDate: string) => {
    const group = groups.find((g) => g.paymentDate === paymentDate);
    await patchGroupCancel.mutateAsync({
      paymentDate,
      orderCancelled: !(group?.orderCancelled ?? false),
    });
  };

  const handleToggleVendorOrderCancel = async (
    paymentDate: string,
    vendorId: string,
  ) => {
    const group = groups.find((g) => g.paymentDate === paymentDate);
    const vendorGroup = group?.vendorGroups.find((vg) => vg.vendorId === vendorId);
    await patchVendorGroupCancel.mutateAsync({
      paymentDate,
      vendorId,
      orderCancelled: !(vendorGroup?.orderCancelled ?? false),
    });
  };

  const handleSaveVendorSummary = async (
    paymentDate: string,
    vendorId: string,
    patch: Pick<
      { extraFees: PurchaseGroupAdjustment[]; discounts: PurchaseGroupAdjustment[] },
      "extraFees" | "discounts"
    >,
  ) => {
    const key = `${paymentDate}:${vendorId}`;
    setSavingSummaryKey(key);
    try {
      await patchVendorGroup.mutateAsync({
        paymentDate,
        vendorId,
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
      // useCancelProductPurchaseStockReflect onError에서 메시지 표시
    }
  };

  const hasCommittedSearch = committedSearch.trim().length > 0;
  const showCatalogEmpty =
    !hasCommittedSearch && !isLoading && !isError && listTotal === 0;
  const listErrorMessage = isError ? getPurchaseErrorMessage(error) : null;

  const editingGroup = editGroupDate
    ? groups.find((g) => g.paymentDate === editGroupDate)
    : undefined;

  return (
    <>
      {showCatalogEmpty ? (
        <LedgerEmptyState
          title="상품매입"
          actionLabel="+ 상품 매입 등록하기"
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
            searchPlaceholder="그룹명, 상품명, 구매처, 주문번호 검색"
            registerLabel="+ 상품 매입 등록"
            onRegister={() => openRegister()}
          />
          {isLoading && groups.length === 0 ? (
            <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">
              상품매입 목록을 불러오는 중입니다.
            </p>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <p className="text-sm text-[var(--color-danger)]">
                {listErrorMessage}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
                다시 시도
              </Button>
            </div>
          ) : groups.length === 0 ? (
            <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">
              {hasCommittedSearch
                ? "검색 결과가 없습니다."
                : "이번 달 상품매입 내역이 없습니다."}
            </p>
          ) : (
            <>
              <div className={ledgerListBodyClass}>
                <ProductPurchaseGroupList
                  groups={groups}
                  onAddToGroup={(date) => openRegister(date)}
                  onReflectStock={setStockReflectLineId}
                  onCancelStockReflect={(id) => void handleCancelStockReflect(id)}
                  onLineClick={openEditLine}
                  onEditGroup={(date) => setEditGroupDate(date)}
                  onDeleteGroup={(date) => void handleDeleteGroup(date)}
                  onSaveVendorSummary={handleSaveVendorSummary}
                  savingSummaryKey={savingSummaryKey}
                  onBulkStockReflect={(date) => void handleBulkStockReflect(date)}
                  onBulkVendorStockReflect={(date, vendorId) =>
                    void handleBulkVendorStockReflect(date, vendorId)
                  }
                  onToggleDateOrderCancel={(date) =>
                    void handleToggleDateOrderCancel(date)
                  }
                  onToggleVendorOrderCancel={(date, vendorId) =>
                    void handleToggleVendorOrderCancel(date, vendorId)
                  }
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

      <ProductPurchaseRegisterDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditLineId(null);
        }}
        defaultPaymentDate={dialogDate}
        editLine={editLine}
        onSave={handleSave}
        onUpdate={handleUpdate}
        onDelete={
          editLine ? () => handleDeleteLine(editLine.id) : undefined
        }
        canDelete={!editLine?.stockReflected}
        deleteDisabledReason="재고 반영 후 삭제하려면 반영취소하세요."
      />

      <ProductPurchaseGroupEditDialog
        open={editGroupDate != null}
        onOpenChange={(open) => {
          if (!open) setEditGroupDate(null);
        }}
        paymentDate={editGroupDate ?? ""}
        groupName={
          editingGroup?.groupName?.trim() ||
          (editGroupDate ? `매입1` : "")
        }
        onSave={handleGroupSave}
      />

      <LedgerStockReflectDialog
        open={stockReflectLineId != null}
        onOpenChange={(open) => {
          if (!open) {
            setStockReflectLineId(null);
            setBulkQueue([]);
          }
        }}
        target={stockReflectTarget}
        onConfirm={(id, info) => void finishStockReflect(id, info)}
      />
    </>
  );
}
