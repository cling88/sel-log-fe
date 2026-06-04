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
import { LedgerStockReflectDialog } from "@/components/ledger/purchase/ledger-stock-reflect-dialog";
import { ProductPurchaseGroupEditDialog } from "@/components/ledger/purchase/product-purchase-group-edit-dialog";
import { ProductPurchaseGroupList } from "@/components/ledger/purchase/product-purchase-group-list";
import { ProductPurchaseRegisterDialog } from "@/components/ledger/purchase/product-purchase-register-dialog";
import { PurchaseListPagination } from "@/components/ledger/purchase/purchase-list-pagination";
import { PurchaseListToolbar } from "@/components/ledger/purchase/purchase-list-toolbar";
import { groupLinesByPaymentDate } from "@/lib/purchase-product-calc";
import {
  filterBySearch,
  paginate,
  PURCHASE_GROUPS_PAGE_SIZE,
} from "@/lib/purchase-list-filters";
import {
  PUB_SEED_PRODUCT_GROUP_META,
  PUB_SEED_PRODUCT_LINES,
} from "@/lib/purchase-pub-seed";
import {
  createDefaultGroupMeta,
  type PurchaseGroupMeta,
} from "@/types/purchase-group";
import type { ProductPurchaseLine } from "@/types/purchase-product";
import type {
  InventoryPriceHistoryItem,
  InventoryProduct,
  InventoryStockHistoryItem,
} from "@/types/inventory-product";
import type { StockReflectInfo } from "@/components/ledger/purchase/ledger-stock-reflect-dialog";

const PRODUCTS_STORAGE_KEY = "sellog-products-pub-v1";

function newLineId(): string {
  return `pp-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
}

function syncGroupMeta(
  lines: ProductPurchaseLine[],
  meta: Record<string, PurchaseGroupMeta>,
): Record<string, PurchaseGroupMeta> {
  const groups = groupLinesByPaymentDate(lines);
  const next = { ...meta };
  groups.forEach((g, index) => {
    if (!next[g.paymentDate]) {
      next[g.paymentDate] = createDefaultGroupMeta(index);
    }
  });
  return next;
}

export function ProductPurchasePanel() {
  const { alert, confirm } = useAppDialog();
  const [lines, setLines] = useState<ProductPurchaseLine[]>(PUB_SEED_PRODUCT_LINES);
  const [groupMeta, setGroupMeta] = useState<Record<string, PurchaseGroupMeta>>(
    () => ({ ...PUB_SEED_PRODUCT_GROUP_META }),
  );
  const { search, setSearch } = useLedgerUrlSearch();
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDate, setDialogDate] = useState<string | undefined>();
  const [editLineId, setEditLineId] = useState<string | null>(null);
  const [editGroupDate, setEditGroupDate] = useState<string | null>(null);
  const [stockReflectLineId, setStockReflectLineId] = useState<string | null>(
    null,
  );
  const [bulkQueue, setBulkQueue] = useState<string[]>([]);
  const [savingSummaryDate, setSavingSummaryDate] = useState<string | null>(null);

  const editLine = lines.find((l) => l.id === editLineId) ?? null;

  const filteredLines = useMemo(
    () =>
      filterBySearch(
        lines,
        search,
        (line, q) =>
          line.productName.toLowerCase().includes(q) ||
          line.vendor.toLowerCase().includes(q) ||
          line.orderNo.toLowerCase().includes(q),
        groupMeta,
      ),
    [lines, search, groupMeta],
  );

  const allGroups = useMemo(
    () => groupLinesByPaymentDate(filteredLines),
    [filteredLines],
  );

  const { items: pagedGroups, totalPages, page: safePage } = useMemo(
    () => paginate(allGroups, page, PURCHASE_GROUPS_PAGE_SIZE),
    [allGroups, page],
  );

  const stockReflectLine =
    lines.find((l) => l.id === (stockReflectLineId ?? bulkQueue[0])) ?? null;

  const stockReflectTarget = useMemo(() => {
    if (!stockReflectLine) return null;
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
    };
  }, [stockReflectLine]);

  const openRegister = (paymentDate?: string) => {
    setEditLineId(null);
    setDialogDate(paymentDate);
    setDialogOpen(true);
  };

  const openEditLine = (lineId: string) => {
    setEditLineId(lineId);
    setDialogOpen(true);
  };

  const handleSave = (
    input: Omit<ProductPurchaseLine, "id" | "stockReflected">,
  ) => {
    setLines((prev) => {
      const next = [
        ...prev,
        { ...input, id: newLineId(), stockReflected: false },
      ];
      setGroupMeta((m) => syncGroupMeta(next, m));
      return next;
    });
  };

  const handleUpdate = (
    lineId: string,
    input: Omit<ProductPurchaseLine, "id" | "stockReflected">,
  ) => {
    setLines((prev) => {
      const next = prev.map((line) =>
        line.id === lineId ? { ...line, ...input } : line,
      );
      setGroupMeta((m) => syncGroupMeta(next, m));
      return next;
    });
    setEditLineId(null);
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
    setLines((prev) => {
      const next = prev.filter((l) => l.id !== lineId);
      setGroupMeta((m) => syncGroupMeta(next, m));
      return next;
    });
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
    setLines((prev) => prev.filter((l) => l.paymentDate !== paymentDate));
    setGroupMeta((prev) => {
      const next = { ...prev };
      delete next[paymentDate];
      return next;
    });
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
    setLines((prev) =>
      prev.map((line) =>
        line.paymentDate === oldDate
          ? { ...line, paymentDate: newDate }
          : line,
      ),
    );
    setGroupMeta((prev) => {
      const next = { ...prev };
      const existing = next[oldDate] ?? createDefaultGroupMeta(0);
      delete next[oldDate];
      next[newDate] = { ...existing, groupName };
      return next;
    });
    setEditGroupDate(null);
    await alert("그룹 정보가 저장되었습니다.");
  };

  const finishStockReflect = async (lineId: string, info: StockReflectInfo) => {
    const line = lines.find((l) => l.id === lineId);

    // 상품 마스터(localStorage) 재고·가격 반영
    if (line && typeof globalThis.localStorage !== "undefined") {
      try {
        const raw = globalThis.localStorage.getItem(PRODUCTS_STORAGE_KEY);
        const storedProducts: InventoryProduct[] = raw ? JSON.parse(raw) : [];
        const now = new Date().toISOString();
        const unitPrice =
          info.qty > 0 ? Math.round(line.paymentAmount / info.qty) : 0;

        const updated = storedProducts.map((p) => {
          if (p.sku !== info.sku || p.deletedAtIso) return p;

          const stockEntry: InventoryStockHistoryItem = {
            id: `stk-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
            atIso: now,
            delta: info.qty,
            source: "purchase",
            vendor: line.vendor,
            orderNo: line.orderNo,
            unitPrice,
            totalAmount: line.paymentAmount,
            reason: `매입 재고반영 (${line.productName})`,
          };

          const priceChanged = unitPrice > 0 && unitPrice !== p.currentPrice;
          const priceEntry: InventoryPriceHistoryItem | null = priceChanged
            ? {
                id: `prh-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
                atIso: now,
                price: unitPrice,
                source: "purchase",
                reason: `매입 반영 (${line.vendor})`,
              }
            : null;

          return {
            ...p,
            stock: p.stock + info.qty,
            ...(priceChanged ? { currentPrice: unitPrice } : {}),
            stockHistory: [stockEntry, ...p.stockHistory],
            priceHistory: priceEntry
              ? [priceEntry, ...p.priceHistory]
              : p.priceHistory,
            updatedAtIso: now,
          };
        });

        globalThis.localStorage.setItem(
          PRODUCTS_STORAGE_KEY,
          JSON.stringify(updated),
        );
      } catch {
        // 저장 실패 시 라인 상태는 그대로 반영 처리
      }
    }

    setLines((prev) =>
      prev.map((l) =>
        l.id === lineId
          ? { ...l, stockReflected: true, productSku: info.sku }
          : l,
      ),
    );
    setStockReflectLineId(null);
    setBulkQueue((q) => {
      const rest = q.filter((id) => id !== lineId);
      if (rest.length === 0) {
        void alert("재고 반영이 완료되었습니다.");
      }
      if (rest.length > 0) setStockReflectLineId(rest[0]);
      return rest;
    });
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

  const handleToggleOrderCancel = (paymentDate: string) => {
    setGroupMeta((prev) => {
      const current = prev[paymentDate] ?? createDefaultGroupMeta(0);
      return {
        ...prev,
        [paymentDate]: {
          ...current,
          orderCancelled: !current.orderCancelled,
        },
      };
    });
  };

  const handleSaveGroupSummary = async (
    paymentDate: string,
    patch: Pick<PurchaseGroupMeta, "extraFees" | "discounts">,
  ) => {
    setSavingSummaryDate(paymentDate);
    try {
      // TODO: API 연동 시 PATCH /purchase-groups/{id}/adjustments 등 호출
      setGroupMeta((prev) => ({
        ...prev,
        [paymentDate]: {
          ...(prev[paymentDate] ?? createDefaultGroupMeta(0)),
          ...patch,
        },
      }));
      await alert("추가금·할인금이 저장되었습니다.");
    } finally {
      setSavingSummaryDate(null);
    }
  };

  const hasLines = lines.length > 0;
  const editingGroupMeta = editGroupDate
    ? groupMeta[editGroupDate]
    : undefined;

  return (
    <>
      {!hasLines ? (
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
            onSearchChange={(v) => {
              setSearch(v);
              setPage(1);
            }}
            searchPlaceholder="그룹명, 상품명, 구매처, 주문번호 검색"
            showExcelActions
            registerLabel="+ 상품 매입 등록"
            onRegister={() => openRegister()}
          />
          {filteredLines.length === 0 ? (
            <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">
              검색 결과가 없습니다.
            </p>
          ) : (
            <>
              <div className={ledgerListBodyClass}>
                <ProductPurchaseGroupList
                  groups={pagedGroups}
                  groupMeta={groupMeta}
                  onAddToGroup={(date) => openRegister(date)}
                  onReflectStock={setStockReflectLineId}
                  onCancelStockReflect={(id) =>
                    setLines((prev) =>
                      prev.map((line) =>
                        line.id === id ? { ...line, stockReflected: false } : line,
                      ),
                    )
                  }
                  onLineClick={openEditLine}
                  onEditGroup={(date) => setEditGroupDate(date)}
                  onDeleteGroup={(date) => void handleDeleteGroup(date)}
                  onSaveGroupSummary={handleSaveGroupSummary}
                  savingSummaryDate={savingSummaryDate}
                  onBulkStockReflect={(date) => void handleBulkStockReflect(date)}
                  onToggleOrderCancel={handleToggleOrderCancel}
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
          editLine
            ? () => handleDeleteLine(editLine.id)
            : undefined
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
          editingGroupMeta?.groupName ??
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
