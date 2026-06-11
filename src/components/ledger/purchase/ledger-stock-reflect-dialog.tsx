"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
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
  /** 재고반영 모달에서 방금 등록한 SKU — BE가 currentPrice 덮어쓰지 않도록 */
  preserveProductPrice?: boolean;
}

interface LedgerStockReflectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: LedgerStockReflectTarget | null;
  onConfirm: (lineId: string, info: StockReflectInfo) => void | Promise<void>;
}

const STOCK_REFLECT_PICKER_QUERY_KEY = [
  ...PRODUCTS_QUERY_KEY,
  "stock-reflect-picker",
] as const;

/** 모달(z-50) 위에 뜨는 SKU 피커 — Portal 고정 위치 */
const SKU_PICKER_DROPDOWN_Z = 110;

type AnchoredDropdownRect = {
  top: number;
  left: number;
  width: number;
};

function useAnchoredDropdownRect(
  anchorRef: RefObject<HTMLElement | null>,
  open: boolean,
) {
  const [rect, setRect] = useState<AnchoredDropdownRect | null>(null);

  const update = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const box = el.getBoundingClientRect();
    setRect({
      top: box.bottom + 6,
      left: box.left,
      width: box.width,
    });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!open) {
      setRect(null);
      return;
    }
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, update]);

  return rect;
}

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
  const skuDropdownRef = useRef<HTMLDivElement | null>(null);
  const skuListItemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [qty, setQty] = useState(1);
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [skuSelectOpen, setSkuSelectOpen] = useState(false);
  const [skuHighlightIndex, setSkuHighlightIndex] = useState(-1);
  const skuDropdownRect = useAnchoredDropdownRect(skuSelectRef, skuSelectOpen);
  const [productRegisterOpen, setProductRegisterOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryForRegister, setCategoryForRegister] = useState("");
  const [quickRegisteredSku, setQuickRegisteredSku] = useState<string | null>(
    null,
  );
  const [confirming, setConfirming] = useState(false);

  const reflectProductKind =
    target?.lineContext?.productKind === "supply" ? "supply" : "product";

  const { data: productPickerData, isLoading: productsLoading } = useQuery({
    queryKey: [...STOCK_REFLECT_PICKER_QUERY_KEY, reflectProductKind],
    queryFn: () =>
      fetchProducts({
        page: 1,
        limit: 100,
        active: true,
        productKind: reflectProductKind,
      }),
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
    return buildProductPrefillFromPurchaseLine(target.lineContext, marginRates);
  }, [target?.lineContext, marginRates]);

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
    setSkuHighlightIndex(-1);
    setProductRegisterOpen(false);
    setCategoryDialogOpen(false);
    setCategoryForRegister("");
    setQuickRegisteredSku(null);
    setConfirming(false);
  }, [open, target?.id, target?.quantity]);

  useEffect(() => {
    if (!skuSelectOpen) {
      setSkuHighlightIndex(-1);
    }
  }, [skuSelectOpen]);

  useEffect(() => {
    if (skuHighlightIndex < 0) return;
    skuListItemRefs.current[skuHighlightIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [skuHighlightIndex]);

  useEffect(() => {
    if (!skuSelectOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (skuSelectRef.current?.contains(target)) return;
      if (skuDropdownRef.current?.contains(target)) return;
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

  const skuNavigableCount = 1 + filtered.length;

  const selectProductSku = (sku: string, name: string, fromQuickRegister = false) => {
    setSelectedSku(sku);
    setSearch(`${sku} | ${name}`);
    setSkuSelectOpen(false);
    setSkuHighlightIndex(-1);
    if (!fromQuickRegister) {
      setQuickRegisteredSku(null);
    }
  };

  const openQuickProductRegister = () => {
    setSkuSelectOpen(false);
    setSkuHighlightIndex(-1);
    setCategoryForRegister("");
    setProductRegisterOpen(true);
  };

  const activateSkuHighlight = (index: number) => {
    if (index === 0) {
      openQuickProductRegister();
      return;
    }
    const product = filtered[index - 1];
    if (product) {
      selectProductSku(product.sku, product.name);
    }
  };

  const handleSkuSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      setSkuSelectOpen(true);
      setSkuHighlightIndex((prev) => {
        if (event.key === "ArrowDown") {
          return prev < 0 ? 0 : Math.min(prev + 1, skuNavigableCount - 1);
        }
        return prev < 0 ? 0 : Math.max(prev - 1, 0);
      });
      return;
    }

    if (event.key === "Enter") {
      if (skuHighlightIndex >= 0) {
        event.preventDefault();
        activateSkuHighlight(skuHighlightIndex);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setSkuSelectOpen(false);
      setSkuHighlightIndex(-1);
    }
  };

  const adjustQty = (delta: number) => {
    setQty((prev) => Math.max(1, prev + delta));
  };

  const selectedProduct = products.find((p) => p.sku === selectedSku);

  const handleQuickProductSave = async (input: InventoryProductInput) => {
    const created = await createProduct.mutateAsync(input);
    await queryClient.invalidateQueries({ queryKey: STOCK_REFLECT_PICKER_QUERY_KEY });
    selectProductSku(created.sku, created.name, true);
    setQuickRegisteredSku(created.sku);
    setProductRegisterOpen(false);
    await alert("상품이 등록되었습니다. 반영할 SKU가 선택되었습니다.");
    return created;
  };

  const categoryMutating =
    categoryCreating || categoryUpdating || categoryDeleting;

  const skuPickerDropdown =
    skuSelectOpen && !productsLoading && skuDropdownRect
      ? createPortal(
          <div
            ref={skuDropdownRef}
            className="rounded-lg border border-[var(--color-border)] bg-white shadow-[0_10px_30px_rgba(2,6,23,0.16)]"
            style={{
              position: "fixed",
              top: skuDropdownRect.top,
              left: skuDropdownRect.left,
              width: skuDropdownRect.width,
              zIndex: SKU_PICKER_DROPDOWN_Z,
            }}
          >
            <ul className="max-h-[min(50vh,420px)] divide-y divide-[var(--color-border)] overflow-y-auto overscroll-contain">
              <li className="sticky top-0 z-10 border-b border-[var(--color-border)] bg-[var(--primary-50)]/80 backdrop-blur-sm">
                <button
                  ref={(el) => {
                    skuListItemRefs.current[0] = el;
                  }}
                  type="button"
                  onClick={openQuickProductRegister}
                  className={cn(
                    "flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-[var(--primary-700)] hover:bg-[var(--primary-50)]",
                    skuHighlightIndex === 0 && "bg-[var(--primary-100)]",
                  )}
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
                filtered.map((p, index) => (
                  <li key={p.sku}>
                    <button
                      ref={(el) => {
                        skuListItemRefs.current[index + 1] = el;
                      }}
                      type="button"
                      onClick={() => selectProductSku(p.sku, p.name)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--primary-50)]/50",
                        selectedSku === p.sku && "bg-[var(--primary-50)]",
                        skuHighlightIndex === index + 1 && "bg-[var(--primary-100)]",
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
          </div>,
          document.body,
        )
      : null;

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
                  onKeyDown={handleSkuSearchKeyDown}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSkuSelectOpen(true);
                    setSkuHighlightIndex(-1);
                    if (selectedSku) {
                      setSelectedSku(null);
                      setQuickRegisteredSku(null);
                    }
                  }}
                  placeholder={
                    productsLoading
                      ? "상품 목록 불러오는 중..."
                      : "SKU 또는 상품명으로 검색"
                  }
                />
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
            <Button
              type="button"
              variant="outline"
              disabled={confirming}
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button
              type="button"
              disabled={!selectedSku || confirming}
              onClick={() => {
                if (!selectedSku || confirming) return;
                void (async () => {
                  setConfirming(true);
                  try {
                    await Promise.resolve(
                      onConfirm(target.id, {
                        sku: selectedSku,
                        qty,
                        preserveProductPrice: quickRegisteredSku === selectedSku,
                      }),
                    );
                  } finally {
                    setConfirming(false);
                  }
                })();
              }}
            >
              {confirming
                ? "반영 중…"
                : `확정 (${formatAmount(qty)}개 반영)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProductRegisterDialog
        open={productRegisterOpen}
        onOpenChange={setProductRegisterOpen}
        initialForm={productPrefill}
        lockedProductKind={reflectProductKind}
        stockReflectRegistration
        stockReflectQty={qty}
        recommendedPriceLabel={
          reflectProductKind === "product" ? recommendedPriceLabel : null
        }
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

      {skuPickerDropdown}
    </>
  );
}
