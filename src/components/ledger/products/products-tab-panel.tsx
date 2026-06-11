"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { replaceLedgerQuery } from "@/lib/ledger-url";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import { useCategories } from "@/hooks/use-categories";
import { useLedgerUrlSearch } from "@/hooks/use-ledger-url-search";
import { PRODUCTS_LIST_PAGE_SIZE } from "@/lib/api/products";
import {
  getErrorMessage,
  useAdjustProductStock,
  useCreateProduct,
  useDeleteProduct,
  useProductDetail,
  useProductHistory,
  useProductsList,
  useUpdateProduct,
} from "@/hooks/use-products";
import { LedgerEmptyState } from "@/components/ledger/empty-state";
import {
  LedgerListShell,
  ledgerListBodyClass,
  ledgerListFooterClass,
} from "@/components/ledger/ledger-list-shell";
import { PurchaseListPagination } from "@/components/ledger/purchase/purchase-list-pagination";
import { PurchaseListToolbar } from "@/components/ledger/purchase/purchase-list-toolbar";
import { cn } from "@/lib/utils";
import { AmendedAmount } from "@/components/common/amended-amount";
import { formatAmount } from "@/lib/purchase-product-calc";
import { formatProductChangeTag } from "@/lib/product-change-labels";
import { CategoryManageDialog } from "@/components/ledger/products/category-manage-dialog";
import { ProductRegisterDialog } from "@/components/ledger/products/product-register-dialog";
import { ProductHistoryFilterTabs } from "@/components/ledger/products/product-history-filter-tabs";
import {
  ProductHistoryPeriodPicker,
} from "@/components/ledger/products/product-history-period-picker";
import { getTodayYearMonth } from "@/lib/ledger-period";
import {
  resolveStockHistorySource,
  type ProductHistoryFilterId,
} from "@/lib/product-unified-history";
import { MODAL_DIALOG_FOOTER_CLASS } from "@/components/common/modal-footer-classes";
import type {
  InventoryProduct,
  InventoryProductInput,
  InventoryPriceHistoryItem,
  InventoryProductStockAction,
  InventoryStockHistoryItem,
} from "@/types/inventory-product";
import type { InventoryCategory } from "@/types/inventory-category";
import type { ProductStockStatus } from "@/types/dashboard";
import type { InventoryProductKind } from "@/types/inventory-product";

type ProductListFilterId =
  | "all"
  | "out_of_stock"
  | "in_stock"
  | "product"
  | "supply";

const PRODUCT_LIST_FILTER_PARAM = "productFilter";

function resolveProductListFilter(
  param: string | null,
): ProductListFilterId {
  if (param === "out_of_stock") return "out_of_stock";
  if (param === "in_stock") return "in_stock";
  if (param === "product") return "product";
  if (param === "supply") return "supply";
  return "all";
}

function productListFilterEmptyMessage(filter: ProductListFilterId): string {
  if (filter === "out_of_stock") return "품절 상품이 없습니다.";
  if (filter === "in_stock") return "재고 있는 상품이 없습니다.";
  if (filter === "supply") return "부가 상품이 없습니다.";
  if (filter === "product") return "판매 상품이 없습니다.";
  return "표시할 상품이 없습니다.";
}

function productStatusLabel(p: InventoryProduct) {
  if (!p.active) return "비활성";
  if (p.stock <= 0) return "품절";
  if (p.stock <= p.safetyStock) return "품절임박";
  return "활성";
}

function productStatusTone(p: InventoryProduct) {
  if (!p.active) {
    return "bg-[var(--primary-50)] text-[var(--color-text-muted)] border-[var(--color-border)]";
  }
  if (p.stock <= 0) {
    return "bg-red-50 text-[var(--color-danger)] border-red-600/20";
  }
  if (p.stock <= p.safetyStock) {
    return "bg-amber-50 text-amber-800 border-amber-600/20";
  }
  return "bg-emerald-50 text-emerald-700 border-emerald-600/10";
}

function formatHistoryDateTime(iso: string) {
  const [datePart, timePart = ""] = iso.split("T");
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d) return iso;
  const hhmm = timePart.slice(0, 5);
  return hhmm ? `${y}년 ${m}월 ${d}일 ${hhmm}` : `${y}년 ${m}월 ${d}일`;
}

function stockHistorySourceLabel(
  source?: "purchase" | "sale" | "manual_adjust",
  purchaseType?: InventoryProduct["stockHistory"][number]["purchaseType"],
  productKind?: InventoryProductKind,
) {
  if (source === "purchase") {
    if (purchaseType === "supply" || productKind === "supply") return "부가 반영";
    return "매입";
  }
  if (source === "sale") return "매출";
  return "수동조정";
}

function priceHistorySourceLabel(source: InventoryPriceHistoryItem["source"]) {
  if (source === "product_register") return "상품 등록";
  if (source === "manual_edit") return "가격 수정";
  return "매입 반영";
}

function stockEventTitle(
  h: InventoryStockHistoryItem,
  source: "purchase" | "sale" | "manual_adjust",
  productKind?: InventoryProductKind,
) {
  if (source === "manual_adjust") return h.reason?.trim() || "수동조정";
  return stockHistorySourceLabel(source, h.purchaseType, productKind);
}

interface StockAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: InventoryProduct | null;
  onConfirm: (args: {
    delta: number;
    reason?: string;
  }) => Promise<InventoryProduct | void>;
  adjusting?: boolean;
}

function StockAdjustDialog({
  open,
  onOpenChange,
  product,
  onConfirm,
  adjusting = false,
}: StockAdjustDialogProps) {
  const { confirm, alert } = useAppDialog();
  const [action, setAction] = useState<InventoryProductStockAction>("increase");
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("");

  if (!product) return null;

  const delta = action === "increase" ? qty : -qty;
  const targetStock = product.stock + delta;

  const submit = async () => {
    if (qty <= 0) {
      await alert("수량을 확인해 주세요.");
      return;
    }
    if (action === "decrease" && targetStock < 0) {
      await alert("재고가 음수로 내려갈 수 없습니다.");
      return;
    }
    const ok = await confirm({
      title: "재고 조정",
      message: `현재 ${product.stock}개에서 ${delta >= 0 ? "+" : ""}${delta}개 적용할까요?`,
      confirmLabel: "적용",
      destructive: delta < 0,
    });
    if (!ok) return;

    const updated = await onConfirm({
      delta,
      reason: reason.trim() || undefined,
    });
    onOpenChange(false);
    if (updated) {
      const tag = formatProductChangeTag(updated.changeKind, updated.changeFrom);
      await alert(
        tag
          ? `재고가 조정되었습니다.\n(${tag}, 현재 ${updated.stock}개)`
          : `재고가 조정되었습니다. (현재 ${updated.stock}개)`,
      );
    } else {
      await alert("재고가 조정되었습니다.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(85vh,520px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        aria-describedby={undefined}
      >
        <DialogHeader className="border-b border-[var(--color-border)] px-5 py-4">
          <DialogTitle>재고 조정</DialogTitle>
          <DialogDescription>
            {product.name} · 현재 {product.stock}개
          </DialogDescription>
          <p className="text-xs text-[var(--color-text-secondary)]">
            매입재고는 자동으로 추가됩니다. 이외 추가 재고만 적용해주세요.
          </p>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={action === "increase" ? "default" : "outline"}
                size="sm"
                className="h-8"
                onClick={() => setAction("increase")}
              >
                + 증가
              </Button>
              <Button
                type="button"
                variant={action === "decrease" ? "destructive" : "outline"}
                size="sm"
                className="h-8"
                onClick={() => setAction("decrease")}
              >
                - 감소
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="stock-adjust-qty">수량</Label>
              <Input
                id="stock-adjust-qty"
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
              />
              <p className="text-xs text-[var(--color-text-secondary)]">
                적용 후 예상 재고:{" "}
                <span className="font-medium tabular-nums text-[var(--color-text-primary)]">
                  {targetStock}개
                </span>
              </p>
            </div>

            <div className="mt-4 space-y-2">
              <Label htmlFor="stock-adjust-reason">사유 (선택)</Label>
              <Textarea
                id="stock-adjust-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="예: 파손/추가 입고 등"
                className="resize-y"
              />
            </div>
          </div>
        </div>

        <DialogFooter className={MODAL_DIALOG_FOOTER_CLASS}>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={adjusting}
          >
            취소
          </Button>
          <Button type="button" onClick={() => void submit()} disabled={adjusting}>
            {adjusting ? "처리 중..." : "적용"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProductsTabPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const legacyStockStatus = searchParams.get("stockStatus");
  const productFilterParam = searchParams.get(PRODUCT_LIST_FILTER_PARAM);
  const productListFilter = useMemo((): ProductListFilterId => {
    if (productFilterParam) return resolveProductListFilter(productFilterParam);
    if (
      legacyStockStatus === "out_of_stock" ||
      legacyStockStatus === "in_stock"
    ) {
      return legacyStockStatus;
    }
    return "all";
  }, [productFilterParam, legacyStockStatus]);

  const stockStatusForApi = useMemo((): ProductStockStatus | null => {
    if (productListFilter === "out_of_stock") return "out_of_stock";
    if (productListFilter === "in_stock") return "in_stock";
    return null;
  }, [productListFilter]);

  const productKindForApi = useMemo((): InventoryProductKind | null => {
    if (productListFilter === "product") return "product";
    if (productListFilter === "supply") return "supply";
    return null;
  }, [productListFilter]);

  const { alert, confirm } = useAppDialog();
  const { search, committedSearch, setSearch, applySearch } = useLedgerUrlSearch({
    commit: "manual",
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [registerOpen, setRegisterOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<InventoryProduct | null>(null);

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryForRegister, setCategoryForRegister] = useState("");

  const {
    categories,
    isLoading: categoriesLoading,
    errorMessage: categoriesLoadError,
    createCategory: apiCreateCategory,
    updateCategory: apiUpdateCategory,
    deleteCategory: apiDeleteCategory,
    isCreating: categoryCreating,
    isUpdating: categoryUpdating,
    isDeleting: categoryDeleting,
  } = useCategories();

  const visibleCategories = useMemo(
    () => categories.filter((c) => !c.deletedAtIso),
    [categories],
  );

  const categoryMutating =
    categoryCreating || categoryUpdating || categoryDeleting;

  const [stockDialogOpen, setStockDialogOpen] = useState(false);
  const [listPage, setListPage] = useState(1);

  const setProductListFilter = (next: ProductListFilterId) => {
    replaceLedgerQuery(router, pathname, searchParams, (params) => {
      if (next === "all") params.delete(PRODUCT_LIST_FILTER_PARAM);
      else params.set(PRODUCT_LIST_FILTER_PARAM, next);
      params.delete("stockStatus");
    });
    setListPage(1);
  };

  const defaultHistoryYm = getTodayYearMonth();
  const [historyYear, setHistoryYear] = useState(defaultHistoryYm.year);
  const [historyMonth, setHistoryMonth] = useState(defaultHistoryYm.month);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyFilter, setHistoryFilter] = useState<ProductHistoryFilterId>("all");

  useEffect(() => {
    setListPage(1);
  }, [committedSearch, productListFilter]);

  const hasCommittedSearch = committedSearch.trim().length > 0;

  const submitProductSearch = (query?: string) => {
    applySearch(query);
    setListPage(1);
  };

  const clearProductSearch = () => {
    submitProductSearch("");
  };

  const {
    data: productsListData,
    isLoading: productsLoading,
    isError: productsLoadError,
    error: productsError,
    refetch: refetchProducts,
  } = useProductsList(committedSearch, listPage, {
    stockStatus: stockStatusForApi,
    productKind: productKindForApi,
  });

  const products = productsListData?.items ?? [];
  const productsMeta = productsListData?.meta;
  const listTotal = productsMeta?.total ?? 0;

  /** 등록 상품 0개(검색·재고 필터 없이 목록 조회) — 등록 유도 화면만 */
  const showCatalogEmpty =
    !hasCommittedSearch &&
    productListFilter === "all" &&
    !productsLoading &&
    !productsLoadError &&
    listTotal === 0;
  const listLimit = productsMeta?.limit ?? PRODUCTS_LIST_PAGE_SIZE;
  const listCurrentPage = productsMeta?.page ?? listPage;
  const listTotalPages = Math.max(1, Math.ceil(listTotal / listLimit));

  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();
  const adjustStockMutation = useAdjustProductStock();

  const productSaving =
    createProductMutation.isPending || updateProductMutation.isPending;
  const productDeleting = deleteProductMutation.isPending;
  const stockAdjusting = adjustStockMutation.isPending;

  const {
    data: selectedProductDetail,
    isLoading: productDetailLoading,
    isError: productDetailError,
    error: productDetailErr,
    refetch: refetchProductDetail,
  } = useProductDetail(selectedId);

  const productsLoadErrorMessage = productsLoadError
    ? getErrorMessage(productsError)
    : null;

  const productDetailErrorMessage = productDetailError
    ? getErrorMessage(productDetailErr)
    : null;

  /** 상세 API 응답 우선 (재고·가격 이력). 로딩 중에는 목록 요약만 표시 */
  const listProduct = useMemo(() => {
    if (!selectedId) return null;
    return products.find((p) => p.id === selectedId && !p.deletedAtIso) ?? null;
  }, [selectedId, products]);

  const selectedProduct = useMemo(() => {
    if (!selectedId) return null;
    if (productDetailError) return listProduct;
    if (selectedProductDetail?.id === selectedId) return selectedProductDetail;
    return listProduct;
  }, [selectedId, selectedProductDetail, listProduct, productDetailError]);

  const visibleProducts = useMemo(
    () => products.filter((p) => !p.deletedAtIso),
    [products],
  );

  const filtered = visibleProducts;

  /** 탭·검색·페이지 변경 후 목록 첫 상품 자동 선택 */
  useEffect(() => {
    if (productsLoading || productsLoadError || showCatalogEmpty) return;
    const first = visibleProducts[0];
    setSelectedId(first?.id ?? null);
  }, [
    productListFilter,
    committedSearch,
    listPage,
    productsLoading,
    productsLoadError,
    showCatalogEmpty,
    visibleProducts,
  ]);

  useEffect(() => {
    setHistoryPage(1);
  }, [selectedId, historyYear, historyMonth, historyFilter]);

  const historyStock =
    selectedProductDetail?.id === selectedId
      ? selectedProductDetail.stock
      : (selectedProduct?.stock ?? 0);

  const {
    data: historyData,
    isLoading: historyLoading,
    isError: historyLoadError,
    error: historyError,
    refetch: refetchHistory,
  } = useProductHistory(
    selectedId,
    historyYear,
    historyMonth,
    historyPage,
    historyStock,
    historyFilter,
    { enabled: !!selectedId },
  );

  const historyEntries = historyData?.entries ?? [];
  const historyTotal = historyData?.meta.total ?? 0;
  const historyLimit = historyData?.meta.limit ?? 20;
  const historyTotalPages = Math.max(1, Math.ceil(historyTotal / historyLimit));
  const historyErrorMessage = historyLoadError
    ? getErrorMessage(historyError)
    : null;

  const openRegister = () => {
    setEditProduct(null);
    setCategoryForRegister("");
    setRegisterOpen(true);
  };

  const openEdit = (p: InventoryProduct) => {
    setEditProduct(p);
    setCategoryForRegister(p.category ?? "");
    setRegisterOpen(true);
  };

  const openStockAdjust = () => {
    if (!selectedProduct) return;
    setStockDialogOpen(true);
  };

  const handleSaveProduct = async (input: InventoryProductInput) => {
    if (editProduct) {
      const updated = await updateProductMutation.mutateAsync({
        id: editProduct.id,
        input,
      });
      setSelectedId(updated.id);
      setEditProduct(null);
      return updated;
    }

    const created = await createProductMutation.mutateAsync(input);
    setSelectedId(created.id);
    setEditProduct(null);
    return created;
  };

  const handleDeleteProduct = async (product: InventoryProduct) => {
    const liveStock =
      selectedProductDetail?.id === product.id
        ? selectedProductDetail.stock
        : product.stock;
    if (liveStock !== 0) {
      await alert("재고가 0개일 때만 삭제 가능합니다.");
      return;
    }

    const ok = await confirm({
      title: "상품 삭제",
      message:
        "삭제하면 목록에서 숨겨집니다(복구는 관리자 정책에 따름). 이 상품을 삭제할까요?",
      confirmLabel: "삭제",
      destructive: true,
    });
    if (!ok) return;

    await deleteProductMutation.mutateAsync(product.id);
    setRegisterOpen(false);
    setEditProduct(null);
    if (selectedId === product.id) {
      setSelectedId(null);
    }
    await alert("삭제 처리되었습니다.");
  };

  const handleConfirmStockAdjust = async (args: {
    delta: number;
    reason?: string;
  }) => {
    const target = selectedProduct;
    if (!target) return;

    const quantity = Math.abs(args.delta);
    const action = args.delta >= 0 ? "increase" : "decrease";

    return adjustStockMutation.mutateAsync({
      id: target.id,
      body: { action, quantity, reason: args.reason },
    });
  };

  const renderListBody = () => {
    if (productsLoading) {
      return (
        <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">
          {hasCommittedSearch ? "검색 중..." : "상품 목록 불러오는 중..."}
        </p>
      );
    }
    if (productsLoadErrorMessage) {
      return (
        <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
          <p className="text-sm text-red-700">{productsLoadErrorMessage}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void refetchProducts()}
          >
            다시 불러오기
          </Button>
        </div>
      );
    }
    if (showCatalogEmpty) {
      return (
        <LedgerEmptyState
          title="상품관리"
          description="상품을 등록하고, 재고를 조정해 운영하세요."
          actionLabel="+ 상품 등록하기"
          onAction={openRegister}
        />
      );
    }
    if (filtered.length === 0) {
      return (
        <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">
          {hasCommittedSearch
            ? "검색 결과가 없습니다."
            : productListFilterEmptyMessage(productListFilter)}
        </p>
      );
    }
    return filtered.map((p) => {
                    const selected = p.id === selectedId;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedId(p.id)}
                        className={cn(
                          "w-full rounded-xl border bg-white px-3 py-3 text-left shadow-[var(--shadow-sm)] transition-colors",
                          selected
                            ? "border-[var(--primary-500)]"
                            : "border-[var(--color-border)] hover:border-[var(--primary-500)]",
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {p.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.imageUrl}
                              alt=""
                              className="size-12 shrink-0 rounded-md border border-[var(--color-border)] object-cover bg-[var(--color-bg)]"
                            />
                          ) : (
                            <div className="size-12 shrink-0 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)]" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p
                                className="truncate text-sm font-semibold"
                                title={p.name}
                              >
                                {p.name}
                              </p>
                              <div className="flex shrink-0 items-center gap-1">
                                {p.productKind === "supply" ? (
                                  <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                                    부가·소모품
                                  </span>
                                ) : null}
                                <span
                                  className={cn(
                                    "rounded-full border px-2 py-0.5 text-[11px] text-nowrap",
                                    productStatusTone(p),
                                  )}
                                >
                                  {productStatusLabel(p)}
                                </span>
                              </div>
                            </div>
                            <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                              SKU {p.sku} · 안전 {p.safetyStock} · 재고{" "}
                              <span className="tabular-nums font-medium text-[var(--color-text-primary)]">
                                {p.stock}
                              </span>
                              {p.productKind === "supply" ? " · 단가 " : " · 판매가 "}
                              <span className="tabular-nums font-medium text-[var(--color-text-primary)]">
                                {formatAmount(p.currentPrice ?? 0)}원
                              </span>
                            </p>
                          </div>
                        </div>
                      </button>
                    );
    });
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start">
      <div className="w-full md:w-[420px]">
        <LedgerListShell>
          <PurchaseListToolbar
            embedded
            search={search}
            onSearchChange={setSearch}
            searchSubmitMode
            onSearchSubmit={() => submitProductSearch()}
            onSearchClear={clearProductSearch}
            searchPlaceholder="상품명, SKU 검색"
            registerLabel="+ 상품 등록"
            onRegister={openRegister}
          />
          <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)]/80 px-3 py-2">
            {(
              [
                { id: "all" as const, label: "전체" },
                { id: "out_of_stock" as const, label: "품절" },
                { id: "in_stock" as const, label: "재고있음" },
                { id: "product" as const, label: "판매상품" },
                { id: "supply" as const, label: "부가상품" },
              ] as const
            ).map((chip) => (
              <Button
                key={chip.id}
                type="button"
                size="sm"
                variant={
                  productListFilter === chip.id ? "default" : "outline"
                }
                className="h-7 text-xs"
                onClick={() => setProductListFilter(chip.id)}
              >
                {chip.label}
                {chip.id === "out_of_stock" &&
                productsMeta?.outOfStockCount != null
                  ? ` ${productsMeta.outOfStockCount}`
                  : ""}
                {chip.id === "product" && productsMeta?.productCount != null
                  ? ` ${productsMeta.productCount}`
                  : ""}
                {chip.id === "supply" && productsMeta?.supplyCount != null
                  ? ` ${productsMeta.supplyCount}`
                  : ""}
              </Button>
            ))}
          </div>
          <div className={ledgerListBodyClass}>{renderListBody()}</div>
          {!productsLoading && !productsLoadError && !showCatalogEmpty ? (
            <div className={ledgerListFooterClass}>
              <PurchaseListPagination
                page={listCurrentPage}
                totalPages={listTotalPages}
                onPageChange={setListPage}
              />
            </div>
          ) : null}
        </LedgerListShell>
      </div>

      <div className="w-full flex-1">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-sm)]">
          {productDetailErrorMessage && selectedId ? (
            <div className="flex h-[280px] flex-col items-center justify-center gap-3 p-6">
              <p className="text-center text-sm text-red-700">
                {productDetailErrorMessage}
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void refetchProductDetail()}
              >
                다시 불러오기
              </Button>
            </div>
          ) : selectedProduct ? (
            <div className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  {selectedProduct.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedProduct.imageUrl}
                      alt=""
                      className="size-14 shrink-0 rounded-md border border-[var(--color-border)] object-cover bg-[var(--color-bg)]"
                    />
                  ) : (
                    <div className="size-14 shrink-0 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-base font-semibold leading-snug">
                      {selectedProduct.name}
                    </p>
                    <p className="mt-0.5 break-words text-xs text-[var(--color-text-secondary)]">
                      SKU {selectedProduct.sku}
                      {selectedProduct.category
                        ? ` · ${selectedProduct.category}`
                        : ""}
                      {" · "}
                      {selectedProduct.productKind === "supply"
                        ? "부가·소모품"
                        : "판매상품"}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => openEdit(selectedProduct)}
                  >
                    편집
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => openStockAdjust()}
                    disabled={stockAdjusting}
                  >
                    {stockAdjusting ? "조정 중..." : "재고 조정"}
                  </Button>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-[var(--color-border)] bg-white p-3">
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    현재 재고
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {selectedProduct.stock}개
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-white p-3">
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    안전 재고
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {selectedProduct.safetyStock}개
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-white p-3">
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    사용 여부
                  </p>
                  <p className="mt-1 text-lg font-semibold">
                    {selectedProduct.active ? "활성" : "비활성"}
                  </p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-white p-3">
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {selectedProduct.productKind === "supply" ? "단가(참고)" : "판매가"}
                  </p>
                  <p className="mt-1 text-lg font-semibold tabular-nums">
                    {formatAmount(selectedProduct.currentPrice ?? 0)}원
                  </p>
                </div>
              </div>

              {selectedProduct.memo ? (
                <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-white p-3">
                  <p className="text-xs text-[var(--color-text-secondary)]">비고</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--color-text-primary)]">
                    {selectedProduct.memo}
                  </p>
                </div>
              ) : null}

              <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-white p-3">
                <p className="text-sm font-semibold">히스토리</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                  <ProductHistoryFilterTabs
                    value={historyFilter}
                    onChange={(next) => {
                      setHistoryFilter(next);
                      setHistoryPage(1);
                    }}
                  />
                  <div className="flex shrink-0 items-center gap-2">
                    {historyLoading ? (
                      <span className="text-xs text-[var(--color-text-muted)]">
                        불러오는 중...
                      </span>
                    ) : null}
                    <ProductHistoryPeriodPicker
                      year={historyYear}
                      month={historyMonth}
                      onYearMonthChange={(y, m) => {
                        setHistoryYear(y);
                        setHistoryMonth(m);
                        setHistoryPage(1);
                      }}
                    />
                  </div>
                </div>
                {historyLoadError ? (
                  <div className="mt-3 flex flex-col gap-2">
                    <p className="text-sm text-[var(--color-danger)]">
                      {historyErrorMessage}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="self-start"
                      onClick={() => void refetchHistory()}
                    >
                      다시 시도
                    </Button>
                  </div>
                ) : historyLoading && historyEntries.length === 0 ? (
                  <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                    재고·가격 이력을 불러오는 중입니다.
                  </p>
                ) : historyTotal === 0 || historyEntries.length === 0 ? (
                  <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                    {historyFilter === "all"
                      ? `${historyMonth}월에 이력이 없습니다.`
                      : "선택한 유형의 이력이 없습니다."}
                  </p>
                ) : (
                  <>
                  <ul className="mt-3 flex flex-col gap-2">
                    {historyEntries.map((entry) => {
                      const changeTag = formatProductChangeTag(
                        entry.data.changeKind,
                        entry.data.changeFrom,
                      );
                      return (
                      <li
                        key={entry.id}
                        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                            {formatHistoryDateTime(entry.atIso)}
                          </p>
                          {changeTag ? (
                            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-secondary)]">
                              {changeTag}
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-3">
                          {entry.kind === "stock" ? (
                            <p className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-[var(--color-text-primary)]">
                              <span className="font-medium">
                                {stockEventTitle(
                                  entry.data,
                                  resolveStockHistorySource(entry.data),
                                  selectedProduct.productKind,
                                )}
                              </span>
                              <span
                                className={cn(
                                  "tabular-nums font-semibold",
                                  entry.data.delta >= 0
                                    ? "text-emerald-700"
                                    : "text-[var(--color-danger)]",
                                )}
                              >
                                {entry.data.delta >= 0 ? "+" : ""}
                                {entry.data.delta}개
                              </span>
                              {entry.data.unitPrice != null ? (
                                <span className="tabular-nums text-[var(--color-text-secondary)]">
                                  개당 {formatAmount(entry.data.unitPrice)}원
                                </span>
                              ) : null}
                              {entry.data.totalAmount != null ? (
                                <span className="tabular-nums text-[var(--color-text-secondary)]">
                                  총 {formatAmount(entry.data.totalAmount)}원
                                </span>
                              ) : null}
                              {entry.data.vendor ? (
                                <span className="truncate text-[var(--color-text-secondary)]">
                                  {entry.data.vendor}
                                </span>
                              ) : null}
                            </p>
                          ) : (
                            <p className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-[var(--color-text-primary)]">
                              <span className="font-medium">
                                {priceHistorySourceLabel(entry.data.source)}
                              </span>
                              <AmendedAmount
                                current={entry.data.price}
                                previous={entry.data.previousPrice}
                                className="inline-flex justify-start"
                                currentClassName="font-semibold"
                              />
                              {entry.data.reason ? (
                                <span className="truncate text-[var(--color-text-secondary)]">
                                  {entry.data.reason}
                                </span>
                              ) : null}
                            </p>
                          )}
                          <p className="shrink-0 tabular-nums text-sm font-medium text-[var(--color-text-secondary)]">
                            {entry.stockAfter}개
                          </p>
                        </div>
                      </li>
                      );
                    })}
                  </ul>
                  <PurchaseListPagination
                    page={historyPage}
                    totalPages={historyTotalPages}
                    onPageChange={setHistoryPage}
                  />
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex h-[280px] items-center justify-center p-6">
              <p className="text-sm text-[var(--color-text-muted)]">
                상품을 선택해 주세요.
              </p>
            </div>
          )}
        </div>
      </div>

      <CategoryManageDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        categories={visibleCategories}
        selectedCategoryName={categoryForRegister}
        loading={categoriesLoading}
        loadError={categoriesLoadError}
        mutating={categoryMutating}
        onSelect={(name) => {
          setCategoryForRegister(name);
          setCategoryDialogOpen(false);
        }}
        onCreate={async (name) => {
          await apiCreateCategory(name);
        }}
        onUpdate={async (id, name) => {
          const prev = visibleCategories.find((c) => c.id === id);
          await apiUpdateCategory(id, name);
          if (prev?.name && categoryForRegister === prev.name) {
            setCategoryForRegister(name);
          }
        }}
        onDelete={async (id) => {
          const target = visibleCategories.find((c) => c.id === id);
          await apiDeleteCategory(id);
          if (target?.name && categoryForRegister === target.name) {
            setCategoryForRegister("");
          }
        }}
      />

      <ProductRegisterDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        editProduct={editProduct}
        onSave={handleSaveProduct}
        saving={productSaving}
        categories={visibleCategories}
        selectedCategoryFromDialog={categoryForRegister}
        onOpenCategoryManage={(currentCategory) => {
          setCategoryForRegister(currentCategory ?? "");
          setCategoryDialogOpen(true);
        }}
        onDelete={
          editProduct ? () => handleDeleteProduct(editProduct) : undefined
        }
        canDelete={
          editProduct
            ? (() => {
                const stock =
                  selectedProductDetail?.id === editProduct.id
                    ? selectedProductDetail.stock
                    : editProduct.stock;
                return stock === 0 && !productDeleting;
              })()
            : true
        }
        deleteDisabledReason={
          editProduct
            ? productDeleting
              ? "삭제 처리 중입니다."
              : (() => {
                  const stock =
                    selectedProductDetail?.id === editProduct.id
                      ? selectedProductDetail.stock
                      : editProduct.stock;
                  return stock > 0 ? "재고가 0개일 때만 삭제 가능" : undefined;
                })()
            : undefined
        }
      />

      <StockAdjustDialog
        open={stockDialogOpen}
        onOpenChange={setStockDialogOpen}
        product={selectedProduct}
        onConfirm={handleConfirmStockAdjust}
        adjusting={stockAdjusting}
      />
    </div>
  );
}

