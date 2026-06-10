"use client";

import { useEffect, useState } from "react";
import { useLedgerMonthParam } from "@/hooks/use-ledger-month";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import { useLedgerUrlSearch } from "@/hooks/use-ledger-url-search";
import {
  getPurchaseErrorMessage,
  useCreateOtherExpenseLine,
  useDeleteOtherExpenseLine,
  useOtherExpenseList,
  useUpdateOtherExpenseLine,
} from "@/hooks/use-purchase";
import { LedgerEmptyState } from "@/components/ledger/empty-state";
import {
  LedgerListShell,
  ledgerListBodyClass,
  ledgerListFooterClass,
} from "@/components/ledger/ledger-list-shell";
import { OtherExpenseGroupList } from "@/components/ledger/purchase/other/other-expense-group-list";
import { OtherExpenseRegisterDialog } from "@/components/ledger/purchase/other/other-expense-register-dialog";
import { PurchaseListPagination } from "@/components/ledger/purchase/purchase-list-pagination";
import { PurchaseListToolbar } from "@/components/ledger/purchase/purchase-list-toolbar";
import { Button } from "@/components/ui/button";
import type { OtherExpenseLine } from "@/types/purchase-other";

export function OtherExpensePanel() {
  const { alert, confirm } = useAppDialog();
  const { search, committedSearch, setSearch, applySearch } = useLedgerUrlSearch({
    commit: "manual",
  });
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState<string | undefined>();
  const [editLineId, setEditLineId] = useState<string | null>(null);
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
  } = useOtherExpenseList(committedSearch, page);

  const createLine = useCreateOtherExpenseLine();
  const updateLine = useUpdateOtherExpenseLine();
  const deleteLineMut = useDeleteOtherExpenseLine();

  const groups = listData?.groups ?? [];
  const lines = listData?.lines ?? [];
  const listMeta = listData?.meta;
  const listTotal = listMeta?.total ?? 0;
  const listPage = listMeta?.page ?? page;
  const listLimit = listMeta?.limit ?? 5;
  const totalPages = Math.max(1, Math.ceil(listTotal / listLimit));

  const editLine = lines.find((l) => l.id === editLineId) ?? null;

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

  const hasCommittedSearch = committedSearch.trim().length > 0;
  const showCatalogEmpty =
    !hasCommittedSearch && !isLoading && !isError && listTotal === 0;

  return (
    <>
      {showCatalogEmpty ? (
        <LedgerEmptyState
          title="기타지출"
          description="운영 비용을 간단히 기록하세요. 재고 반영은 없습니다."
          actionLabel="+ 기타지출 등록하기"
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
          searchPlaceholder="항목명, 비고 검색"
          registerLabel="+ 기타지출 등록"
          onRegister={() => openRegister()}
        />
        {isLoading && groups.length === 0 ? (
          <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">
            기타지출 목록을 불러오는 중입니다.
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
              : "이번 달 기타지출 내역이 없습니다."}
          </p>
        ) : (
          <>
            <div className={ledgerListBodyClass}>
              <OtherExpenseGroupList
                storageScopeKey={month}
                groups={groups}
                onAddToGroup={(date) => openRegister(date)}
                onLineClick={openLineDetail}
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

      <OtherExpenseRegisterDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditLineId(null);
        }}
        defaultPaymentDate={dialogDate}
        editLine={editLine}
        onSave={async (input: Omit<OtherExpenseLine, "id">) => {
          await createLine.mutateAsync(input);
          setDialogOpen(false);
          await alert("등록되었습니다.");
        }}
        onUpdate={async (lineId, input: Omit<OtherExpenseLine, "id">) => {
          await updateLine.mutateAsync({ id: lineId, line: input });
          setEditLineId(null);
          setDialogOpen(false);
          await alert("저장되었습니다.");
        }}
        onDelete={
          editLine ? () => handleDeleteLine(editLine.id) : undefined
        }
      />
    </>
  );
}
