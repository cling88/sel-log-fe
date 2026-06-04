"use client";

import { useMemo, useState } from "react";
import { useAppDialog } from "@/components/common/app-dialog-provider";
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
import { todayIso } from "@/lib/date";
import { createPubSeedIncomeLines } from "@/lib/income-pub-seed";
import {
  paginate,
  PURCHASE_GROUPS_PAGE_SIZE,
} from "@/lib/purchase-list-filters";
import { formatAmount } from "@/lib/purchase-product-calc";
import type { IncomeDepositLine } from "@/types/income";

function newLineId(): string {
  return `inc-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
}

function groupLinesByDepositDate(lines: IncomeDepositLine[]) {
  const map = new Map<string, IncomeDepositLine[]>();
  for (const line of lines) {
    const bucket = map.get(line.depositDate) ?? [];
    bucket.push(line);
    map.set(line.depositDate, bucket);
  }
  return [...map.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([depositDate, groupLines]) => ({ depositDate, lines: groupLines }));
}

export function IncomeTabPanel() {
  const { alert, confirm } = useAppDialog();
  const [lines, setLines] = useState<IncomeDepositLine[]>(() =>
    createPubSeedIncomeLines(todayIso()),
  );
  const { search, setSearch } = useLedgerUrlSearch();
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState<string | undefined>();
  const [editLineId, setEditLineId] = useState<string | null>(null);

  const editLine = lines.find((l) => l.id === editLineId) ?? null;

  const today = todayIso();
  const monthPrefix = today.slice(0, 7);

  const todayDeposits = useMemo(
    () =>
      lines
        .filter((line) => line.depositDate === today)
        .reduce((sum, line) => sum + line.amount, 0),
    [lines, today],
  );
  const monthDeposits = useMemo(
    () =>
      lines
        .filter((line) => line.depositDate.startsWith(monthPrefix))
        .reduce((sum, line) => sum + line.amount, 0),
    [lines, monthPrefix],
  );

  const filteredLines = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return lines;
    return lines.filter(
      (line) =>
        line.depositDate.includes(q) ||
        [line.itemName, line.memo].some((v) => v.toLowerCase().includes(q)),
    );
  }, [lines, search]);

  const allGroups = useMemo(
    () => groupLinesByDepositDate(filteredLines),
    [filteredLines],
  );

  const { items: pagedGroups, totalPages, page: safePage } = useMemo(
    () => paginate(allGroups, page, PURCHASE_GROUPS_PAGE_SIZE),
    [allGroups, page],
  );

  const openRegister = (depositDate?: string) => {
    setEditLineId(null);
    setDialogDate(depositDate);
    setDialogOpen(true);
  };

  const openLineDetail = (lineId: string) => {
    setEditLineId(lineId);
    setDialogOpen(true);
  };

  const handleDeleteLine = async (lineId: string) => {
    const ok = await confirm({
      title: "입금 내역 삭제",
      message: "이 입금 내역을 삭제할까요?",
      confirmLabel: "삭제",
      destructive: true,
    });
    if (!ok) return;
    setLines((prev) => prev.filter((l) => l.id !== lineId));
    setDialogOpen(false);
    setEditLineId(null);
    await alert("삭제되었습니다.");
  };

  const hasLines = lines.length > 0;

  return (
    <>
      <div className="mb-4 grid grid-cols-1 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] sm:grid-cols-2">
        <div className="border-b border-[var(--color-border)] p-4 sm:border-b-0 sm:border-r">
          <p className="text-xs text-[var(--color-text-secondary)]">오늘 입금</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--color-income)]">
            +{formatAmount(todayDeposits)}원
          </p>
        </div>
        <div className="p-4">
          <p className="text-xs text-[var(--color-text-secondary)]">이번달 입금</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--color-income)]">
            +{formatAmount(monthDeposits)}원
          </p>
        </div>
      </div>

      {!hasLines ? (
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
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            searchPlaceholder="항목명, 비고 검색"
            registerLabel="+ 입금 등록"
            onRegister={() => openRegister()}
          />
          {filteredLines.length === 0 ? (
            <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">
              검색 결과가 없습니다.
            </p>
          ) : (
            <>
              <div className={ledgerListBodyClass}>
                <IncomeDepositGroupList groups={pagedGroups} onLineClick={openLineDetail} />
              </div>
              <div className={ledgerListFooterClass}>
                <PurchaseListPagination
                  page={safePage}
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
        onSave={(input) =>
          setLines((prev) => [...prev, { ...input, id: newLineId() }])
        }
        onUpdate={(lineId, input) =>
          setLines((prev) =>
            prev.map((line) => (line.id === lineId ? { ...line, ...input } : line)),
          )
        }
        onDelete={editLine ? () => handleDeleteLine(editLine.id) : undefined}
      />
    </>
  );
}
