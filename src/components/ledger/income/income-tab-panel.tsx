"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import { BANKS_QUERY_KEY } from "@/hooks/use-banks";
import {
  useCreateIncomeLine,
  useDeleteIncomeLine,
  useIncomeList,
  useUpdateIncomeLine,
} from "@/hooks/use-income";
import { getIncomeErrorMessage } from "@/lib/api/income";
import { useLedgerMonthParam } from "@/hooks/use-ledger-month";
import { useLedgerUrlSearch } from "@/hooks/use-ledger-url-search";
import { LedgerEmptyState } from "@/components/ledger/empty-state";
import {
  LedgerListShell,
  ledgerListBodyClass,
  ledgerListFooterClass,
} from "@/components/ledger/ledger-list-shell";
import { IncomeDepositGroupList } from "@/components/ledger/income/income-deposit-group-list";
import { IncomeDepositRegisterDialog } from "@/components/ledger/income/income-deposit-register-dialog";
import { PurchaseListPagination } from "@/components/ledger/purchase/purchase-list-pagination";
import { PurchaseListToolbar } from "@/components/ledger/purchase/purchase-list-toolbar";
import { Button } from "@/components/ui/button";
import { fetchBanks } from "@/lib/api/banks";
import { formatAmount } from "@/lib/purchase-product-calc";
import type { IncomeDepositLine } from "@/types/income";

export function IncomeTabPanel() {
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

  useQuery({
    queryKey: BANKS_QUERY_KEY,
    queryFn: fetchBanks,
    staleTime: 60_000,
  });

  const {
    data: listData,
    isLoading,
    isError,
    error,
    refetch,
  } = useIncomeList(committedSearch, page);

  const createLine = useCreateIncomeLine();
  const updateLine = useUpdateIncomeLine();
  const deleteLine = useDeleteIncomeLine();

  const groups = listData?.groups ?? [];
  const lines = listData?.lines ?? [];
  const listMeta = listData?.meta;
  const listTotal = listMeta?.total ?? 0;
  const listPage = listMeta?.page ?? page;
  const listLimit = listMeta?.limit ?? 5;
  const totalPages = Math.max(1, Math.ceil(listTotal / listLimit));
  const todayTotal = listMeta?.todayTotal ?? 0;
  const monthTotal = listMeta?.monthTotal ?? 0;

  const editLine = lines.find((l) => l.id === editLineId) ?? null;

  const openRegister = (depositDate?: string) => {
    setEditLineId(null);
    setDialogDate(depositDate);
    setDialogOpen(true);
  };

  const openLineDetail = (lineId: string) => {
    setEditLineId(lineId);
    setDialogOpen(true);
  };

  const handleSave = async (
    input: Omit<IncomeDepositLine, "id">,
    options?: { closeAfter?: boolean },
  ) => {
    await createLine.mutateAsync(input);
    if (options?.closeAfter !== false) {
      setDialogOpen(false);
    }
    await alert("등록되었습니다.");
  };

  const handleUpdate = async (
    lineId: string,
    input: Omit<IncomeDepositLine, "id">,
  ) => {
    await updateLine.mutateAsync({ id: lineId, line: input });
    setEditLineId(null);
    setDialogOpen(false);
    await alert("저장되었습니다.");
  };

  const handleDeleteLine = async (lineId: string) => {
    const ok = await confirm({
      title: "입금 내역 삭제",
      message: "이 입금 내역을 삭제할까요?",
      confirmLabel: "삭제",
      destructive: true,
    });
    if (!ok) return;
    await deleteLine.mutateAsync(lineId);
    setDialogOpen(false);
    setEditLineId(null);
    await alert("삭제되었습니다.");
  };

  const hasCommittedSearch = committedSearch.trim().length > 0;
  const showCatalogEmpty =
    !hasCommittedSearch && !isLoading && !isError && listTotal === 0;
  const listErrorMessage = isError ? getIncomeErrorMessage(error) : "";

  return (
    <>
      <div className="mb-4 grid grid-cols-1 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] sm:grid-cols-2">
        <div className="border-b border-[var(--color-border)] p-4 sm:border-b-0 sm:border-r">
          <p className="text-xs text-[var(--color-text-secondary)]">오늘 입금</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--color-income)]">
            +{formatAmount(todayTotal)}원
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs text-[var(--color-text-secondary)]">이번달 입금</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--color-income)]">
            +{formatAmount(monthTotal)}원
          </p>
        </div>
      </div>

      {showCatalogEmpty ? (
        <LedgerEmptyState
          title="수익"
          description="통장에 입금된 정산·수입을 기록하세요."
          actionLabel="+ 입금 등록하기"
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
            searchPlaceholder="항목명, 비고, 입금일 검색"
            registerLabel="+ 입금 등록"
            onRegister={() => openRegister()}
          />
          {isLoading && groups.length === 0 ? (
            <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">
              수익 목록을 불러오는 중입니다.
            </p>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <p className="text-sm text-[var(--color-danger)]">{listErrorMessage}</p>
              <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
                다시 시도
              </Button>
            </div>
          ) : groups.length === 0 ? (
            <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">
              {hasCommittedSearch
                ? "검색 결과가 없습니다."
                : "이번 달 입금 내역이 없습니다."}
            </p>
          ) : (
            <>
              <div className={ledgerListBodyClass}>
                <IncomeDepositGroupList
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

      <IncomeDepositRegisterDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditLineId(null);
        }}
        defaultDepositDate={dialogDate}
        editLine={editLine}
        onSave={handleSave}
        onUpdate={handleUpdate}
        onDelete={editLine ? () => handleDeleteLine(editLine.id) : undefined}
      />
    </>
  );
}
