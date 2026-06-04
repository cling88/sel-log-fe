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
import {
  LedgerStockReflectDialog,
  type StockReflectInfo,
} from "@/components/ledger/purchase/ledger-stock-reflect-dialog";
import type { InventoryProduct, InventoryStockHistoryItem } from "@/types/inventory-product";

const PRODUCTS_STORAGE_KEY = "sellog-products-pub-v1";
import { PurchaseListPagination } from "@/components/ledger/purchase/purchase-list-pagination";
import { PurchaseListToolbar } from "@/components/ledger/purchase/purchase-list-toolbar";
import { SupplyExpenseGroupList } from "@/components/ledger/purchase/supply/supply-expense-group-list";
import { SupplyExpenseRegisterDialog } from "@/components/ledger/purchase/supply/supply-expense-register-dialog";
import { groupLinesByPaymentDate } from "@/lib/purchase-product-calc";
import {
  filterBySearch,
  paginate,
  PURCHASE_GROUPS_PAGE_SIZE,
} from "@/lib/purchase-list-filters";
import { PUB_SEED_SUPPLY_LINES } from "@/lib/purchase-pub-seed";
import type { SupplyExpenseLine } from "@/types/purchase-supply";

function newLineId(): string {
  return `se-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
}

export function SupplyExpensePanel() {
  const { alert, confirm } = useAppDialog();
  const [lines, setLines] = useState<SupplyExpenseLine[]>(PUB_SEED_SUPPLY_LINES);
  const { search, setSearch } = useLedgerUrlSearch();
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState<string | undefined>();
  const [editLineId, setEditLineId] = useState<string | null>(null);
  const [stockReflectLineId, setStockReflectLineId] = useState<string | null>(
    null,
  );

  const editLine = lines.find((l) => l.id === editLineId) ?? null;

  const filteredLines = useMemo(
    () =>
      filterBySearch(lines, search, (line, q) =>
        [line.itemName, line.vendor, line.memo].some((v) =>
          v.toLowerCase().includes(q),
        ),
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

  const stockReflectLine = lines.find((l) => l.id === stockReflectLineId) ?? null;

  const stockReflectTarget = useMemo(() => {
    if (!stockReflectLine) return null;
    return {
      id: stockReflectLine.id,
      title: stockReflectLine.itemName,
      subtitle: stockReflectLine.vendor || undefined,
      quantity: stockReflectLine.quantity,
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
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            searchPlaceholder="항목명, 구매처 검색"
            registerLabel="+ 부가 항목 등록"
            onRegister={() => openRegister()}
          />
          {filteredLines.length === 0 ? (
            <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">
              검색 결과가 없습니다.
            </p>
          ) : (
            <>
              <div className={ledgerListBodyClass}>
                <SupplyExpenseGroupList
                  groups={pagedGroups}
                  onAddToGroup={(date) => openRegister(date)}
                  onReflectStock={setStockReflectLineId}
                  onCancelStockReflect={(id) =>
                    setLines((prev) =>
                      prev.map((line) =>
                        line.id === id ? { ...line, stockReflected: false } : line,
                      ),
                    )
                  }
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

      <SupplyExpenseRegisterDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditLineId(null);
        }}
        defaultPaymentDate={dialogDate}
        editLine={editLine}
        onSave={(input) =>
          setLines((prev) => [
            ...prev,
            { ...input, id: newLineId(), stockReflected: false },
          ])
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
        canDelete={!editLine?.stockReflected}
        deleteDisabledReason="재고 반영 후 삭제하려면 반영취소하세요."
      />

      <LedgerStockReflectDialog
        open={stockReflectLineId != null}
        onOpenChange={(open) => {
          if (!open) setStockReflectLineId(null);
        }}
        target={stockReflectTarget}
        onConfirm={(lineId, info: StockReflectInfo) => {
          // 상품 마스터(localStorage) 재고 반영 (공급비용은 가격 업데이트 미적용)
          if (typeof globalThis.localStorage !== "undefined") {
            try {
              const raw = globalThis.localStorage.getItem(PRODUCTS_STORAGE_KEY);
              const storedProducts: InventoryProduct[] = raw
                ? JSON.parse(raw)
                : [];
              const now = new Date().toISOString();
              const updated = storedProducts.map((p) => {
                if (p.sku !== info.sku || p.deletedAtIso) return p;
                const stockEntry: InventoryStockHistoryItem = {
                  id: `stk-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
                  atIso: now,
                  delta: info.qty,
                  source: "purchase",
                  reason: "공급비용 재고반영",
                };
                return {
                  ...p,
                  stock: p.stock + info.qty,
                  stockHistory: [stockEntry, ...p.stockHistory],
                  updatedAtIso: now,
                };
              });
              globalThis.localStorage.setItem(
                PRODUCTS_STORAGE_KEY,
                JSON.stringify(updated),
              );
            } catch {
              // 저장 실패 무시
            }
          }
          setLines((prev) =>
            prev.map((line) =>
              line.id === lineId ? { ...line, stockReflected: true } : line,
            ),
          );
          setStockReflectLineId(null);
          void alert("재고 반영이 완료되었습니다.");
        }}
      />
    </>
  );
}
