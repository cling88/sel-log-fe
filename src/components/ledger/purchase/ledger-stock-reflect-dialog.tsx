"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { MODAL_DIALOG_FOOTER_CLASS } from "@/components/common/modal-footer-classes";
import { CategoryManageDialog } from "@/components/ledger/products/category-manage-dialog";
import { ProductRegisterDialog } from "@/components/ledger/products/product-register-dialog";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import { useCategories } from "@/hooks/use-categories";
import {
  PRODUCTS_QUERY_KEY,
  useCreateProduct,
} from "@/hooks/use-products";
import { fetchProducts } from "@/lib/api/products";
import { useMarginRates } from "@/hooks/use-settings";
import {
  buildProductPrefillFromPurchaseLine,
  formatRecommendedPriceLabelFromPurchaseLine,
  type StockReflectLineContext,
} from "@/lib/purchase-to-product-prefill";
import { formatAmount } from "@/lib/purchase-product-calc";
import { cn } from "@/lib/utils";
import type { InventoryProductInput } from "@/types/inventory-product";
import { Minus, Plus } from "lucide-react";

export type { StockReflectLineContext };

export interface LedgerStockReflectTarget {
  id: string;
  title: string;
  subtitle?: string;
  quantity: number;
  /** 매입 라인 → 상품 등록 prefill */
  lineContext?: StockReflectLineContext;
}

export interface StockReflectInfo {
  sku: string;
  qty: number;
}

interface LedgerStockReflectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: LedgerStockReflectTarget | null;
  onConfirm: (lineId: string, info: StockReflectInfo) => void;
}

const STOCK_REFLECT_PICKER_QUERY_KEY = [
  ...PRODUCTS_QUERY_KEY,
  "stock-reflect-picker",
] as const;

export function LedgerStockReflectDialog({
  open,
  onOpenChange,
  target,
  onConfirm,
}: LedgerStockReflectDialogProps) {
  const { alert } = useAppDialog();
  const queryClient = useQueryClient();
  const createProduct = useCreateProduct();
  const {
    categories,
    isLoading: categoriesLoading,
    errorMessage: categoriesError,
    createCategory,
    updateCategory,
    deleteCategory,
    isCreating: categoryCreating,
    isUpdating: categoryUpdating,
    isDeleting: categoryDeleting,
  } = useCategories();
  const { marginMinRate, marginMaxRate } = useMarginRates();
  const marginRates = useMemo(
    () => ({ min: marginMinRate, max: marginMaxRate }),
    [marginMinRate, marginMaxRate],
  );
  const skuSelectRef = useRef<HTMLDivElement | null>(null);
  const [qty, setQty] = useState(1);
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [skuSelectOpen, setSkuSelectOpen] = useState(false);
  const [productRegisterOpen, setProductRegisterOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryForRegister, setCategoryForRegister] = useState("");

  const { data: productPickerData, isLoading: productsLoading } = useQuery({
    queryKey: STOCK_REFLECT_PICKER_QUERY_KEY,
    queryFn: () => fetchProducts({ page: 1, limit: 100, active: true }),
    enabled: open,
    staleTime: 60_000,
  });

  const products = useMemo(
    () =>
      (productPickerData?.items ?? []).filter(
        (p) => !p.deletedAtIso && p.active,
      ),
    [productPickerData?.items],
  );

  const productPrefill = useMemo(() => {
    if (!target?.lineContext) return null;
    return buildProductPrefillFromPurchaseLine(target.lineContext);
  }, [target?.lineContext]);

  const recommendedPriceLabel = useMemo(() => {
    if (!target?.lineContext) return null;
    return formatRecommendedPriceLabelFromPurchaseLine(
      target.lineContext,
      marginRates,
    );
  }, [target?.lineContext, marginRates]);

  useEffect(() => {
    if (!open || !target) return;
    setQty(target.quantity);
    setSelectedSku(null);
    setSearch("");
    setSkuSelectOpen(false);
    setProductRegisterOpen(false);
    setCategoryDialogOpen(false);
    setCategoryForRegister("");
  }, [open, target?.id, target?.quantity]);

  useEffect(() => {
    if (!skuSelectOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (!skuSelectRef.current) return;
      if (skuSelectRef.current.contains(event.target as Node)) return;
      setSkuSelectOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [skuSelectOpen]);

  if (!target) return null;

  const filtered = products.filter(
    (p) =>
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const adjustQty = (delta: number) => {
    setQty((prev) => Math.max(1, prev + delta));
  };

  const selectedProduct = products.find((p) => p.sku === selectedSku);

  const selectProductSku = (sku: string, name: string) => {
    setSelectedSku(sku);
    setSearch(`${sku} | ${name}`);
    setSkuSelectOpen(false);
  };

  const openQuickProductRegister = () => {
    setSkuSelectOpen(false);
    setCategoryForRegister("");
    setProductRegisterOpen(true);
  };

  const handleQuickProductSave = async (input: InventoryProductInput) => {
    const created = await createProduct.mutateAsync(input);
    await queryClient.invalidateQueries({ queryKey: STOCK_REFLECT_PICKER_QUERY_KEY });
    selectProductSku(created.sku, created.name);
    setProductRegisterOpen(false);
    await alert("상품이 등록되었습니다. 반영할 SKU가 선택되었습니다.");
    return created;
  };

  const categoryMutating =
    categoryCreating || categoryUpdating || categoryDeleting;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[min(90vh,620px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <DialogHeader className="border-b border-[var(--color-border)] px-5 py-4">
            <DialogTitle>{`${target.title} 재고 반영`}</DialogTitle>
            <DialogDescription>
              상품관리 SKU를 선택하거나, 목록 상단에서 바로 신규 등록할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="stock-search">상품 선택</Label>
              <div ref={skuSelectRef} className="relative">
                <Input
                  id="stock-search"
                  value={search}
                  disabled={productsLoading}
                  onFocus={() => setSkuSelectOpen(true)}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSkuSelectOpen(true);
                    if (selectedSku) setSelectedSku(null);
                  }}
                  placeholder={
                    productsLoading
                      ? "상품 목록 불러오는 중..."
                      : "SKU 또는 상품명으로 검색"
                  }
                />

                {skuSelectOpen && !productsLoading ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 rounded-lg border border-[var(--color-border)] bg-white shadow-[0_10px_30px_rgba(2,6,23,0.16)]">
                    <ul className="max-h-[220px] divide-y divide-[var(--color-border)] overflow-y-auto">
                      <li className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--primary-50)]/80 backdrop-blur-sm">
                        <button
                          type="button"
                          onClick={openQuickProductRegister}
                          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-[var(--primary-700)] hover:bg-[var(--primary-50)]"
                        >
                          <Plus className="size-4 shrink-0" aria-hidden />
                          + 상품 추가
                        </button>
                      </li>
                      {filtered.length === 0 ? (
                        <li className="px-3 py-8 text-center text-sm text-[var(--color-text-muted)]">
                          {products.length === 0
                            ? "등록된 상품이 없습니다. 위에서 추가해 주세요."
                            : "검색 결과가 없습니다."}
                        </li>
                      ) : (
                        filtered.map((p) => (
                          <li key={p.sku}>
                            <button
                              type="button"
                              onClick={() => selectProductSku(p.sku, p.name)}
                              className={cn(
                                "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--primary-50)]/50",
                                selectedSku === p.sku && "bg-[var(--primary-50)]",
                              )}
                            >
                              <span className="min-w-0">
                                <span className="font-mono text-xs text-[var(--color-text-muted)]">
                                  {p.sku}
                                </span>
                                <span className="ml-2 text-[var(--color-text-primary)]">
                                  {p.name}
                                </span>
                                {p.category ? (
                                  <span className="ml-2 text-xs text-[var(--color-text-secondary)]">
                                    [{p.category}]
                                  </span>
                                ) : null}
                              </span>
                              <span className="shrink-0 tabular-nums text-[var(--color-text-secondary)]">
                                {p.stock}개
                              </span>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>

            {selectedProduct ? (
              <div className="rounded-lg border border-[var(--primary-200)] bg-[var(--primary-50)]/40 px-3 py-3 text-sm">
                <p className="text-xs text-[var(--color-text-muted)]">선택된 상품</p>
                <p className="mt-0.5 font-medium text-[var(--color-text-primary)]">
                  {selectedProduct.name}
                </p>
                <p className="tabular-nums text-[var(--color-text-secondary)]">
                  현재 재고: {selectedProduct.stock}개 → 반영 후:{" "}
                  <span className="font-medium text-[var(--primary-600)]">
                    {selectedProduct.stock + qty}개
                  </span>
                </p>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label>반영 수량</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => adjustQty(-1)}
                  aria-label="수량 감소"
                >
                  <Minus className="size-4" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                  className="w-24 text-center tabular-nums"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  onClick={() => adjustQty(1)}
                  aria-label="수량 증가"
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className={MODAL_DIALOG_FOOTER_CLASS}>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button
              type="button"
              disabled={!selectedSku}
              onClick={() => {
                if (!selectedSku) return;
                onConfirm(target.id, { sku: selectedSku, qty });
                onOpenChange(false);
              }}
            >
              확정 ({formatAmount(qty)}개 반영)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProductRegisterDialog
        open={productRegisterOpen}
        onOpenChange={setProductRegisterOpen}
        initialForm={productPrefill}
        stockReflectRegistration
        stockReflectQty={qty}
        recommendedPriceLabel={recommendedPriceLabel}
        suppressSuccessAlert
        onSave={handleQuickProductSave}
        saving={createProduct.isPending}
        categories={categories}
        selectedCategoryFromDialog={categoryForRegister}
        onOpenCategoryManage={(currentCategory) => {
          setCategoryForRegister(currentCategory ?? "");
          setCategoryDialogOpen(true);
        }}
      />

      <CategoryManageDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        categories={categories}
        selectedCategoryName={categoryForRegister}
        loading={categoriesLoading}
        loadError={categoriesError}
        mutating={categoryMutating}
        onSelect={async (name) => {
          setCategoryForRegister(name);
          setCategoryDialogOpen(false);
        }}
        onCreate={async (name) => {
          await createCategory(name);
        }}
        onUpdate={async (id, name) => {
          await updateCategory(id, name);
        }}
        onDelete={deleteCategory}
      />
    </>
  );
}
