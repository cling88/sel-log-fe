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
import { OtherExpenseGroupList } from "@/components/ledger/purchase/other/other-expense-group-list";
import { OtherExpenseRegisterDialog } from "@/components/ledger/purchase/other/other-expense-register-dialog";
import { PurchaseListPagination } from "@/components/ledger/purchase/purchase-list-pagination";
import { PurchaseListToolbar } from "@/components/ledger/purchase/purchase-list-toolbar";
import { groupLinesByPaymentDate } from "@/lib/purchase-product-calc";
import {
  filterBySearch,
  paginate,
  PURCHASE_GROUPS_PAGE_SIZE,
} from "@/lib/purchase-list-filters";
import { PUB_SEED_OTHER_LINES } from "@/lib/purchase-pub-seed";
import type { OtherExpenseLine } from "@/types/purchase-other";

function newLineId(): string {
  return `oe-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
}

export function OtherExpensePanel() {
  const { alert, confirm } = useAppDialog();
  const [lines, setLines] = useState<OtherExpenseLine[]>(PUB_SEED_OTHER_LINES);
  const { search, setSearch } = useLedgerUrlSearch();
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState<string | undefined>();
  const [editLineId, setEditLineId] = useState<string | null>(null);

  const editLine = lines.find((l) => l.id === editLineId) ?? null;

  const filteredLines = useMemo(
    () =>
      filterBySearch(lines, search, (line, q) =>
        [line.itemName, line.memo].some((v) => v.toLowerCase().includes(q)),
      ),
    [lines, search],
  );

  const allGroups = useMemo(
    () => groupLinesByPaymentDate(filteredLines),
    [filteredLines],
  );

  const { items: pagedGroups, totalPages, page: safePage } = useMemo(
    () => paginate(allGroups, page, PURCHASE_GROUPS_PAGE_SIZE),
    [allGroups, page],
  );

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
    setLines((prev) => prev.filter((l) => l.id !== lineId));
    setDialogOpen(false);
    setEditLineId(null);
    await alert("삭제되었습니다.");
  };

  const hasLines = lines.length > 0;

  return (
    <>
      {!hasLines ? (
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
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            searchPlaceholder="항목명, 비고 검색"
            registerLabel="+ 기타지출 등록"
            onRegister={() => openRegister()}
          />
          {filteredLines.length === 0 ? (
            <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">
              검색 결과가 없습니다.
            </p>
          ) : (
            <>
              <div className={ledgerListBodyClass}>
                <OtherExpenseGroupList
                  groups={pagedGroups}
                  onAddToGroup={(date) => openRegister(date)}
                  onLineClick={openLineDetail}
                />
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

      <OtherExpenseRegisterDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditLineId(null);
        }}
        defaultPaymentDate={dialogDate}
        editLine={editLine}
        onSave={(input) =>
          setLines((prev) => [...prev, { ...input, id: newLineId() }])
        }
        onUpdate={(lineId, input) =>
          setLines((prev) =>
            prev.map((line) =>
              line.id === lineId ? { ...line, ...input } : line,
            ),
          )
        }
        onDelete={
          editLine ? () => handleDeleteLine(editLine.id) : undefined
        }
      />
    </>
  );
}
