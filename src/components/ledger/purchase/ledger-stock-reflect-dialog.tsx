"use client";

import { useEffect, useRef, useState } from "react";
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
import { formatAmount } from "@/lib/purchase-product-calc";
import { cn } from "@/lib/utils";
import type { InventoryProduct } from "@/types/inventory-product";
import { Minus, Plus } from "lucide-react";

export interface LedgerStockReflectTarget {
  id: string;
  title: string;
  subtitle?: string;
  quantity: number;
}

export interface StockReflectInfo {
  sku: string;
  qty: number;
}

const PRODUCTS_STORAGE_KEY = "sellog-products-pub-v1";

function loadStoredProducts(): InventoryProduct[] {
  if (typeof globalThis.localStorage === "undefined") return [];
  try {
    const raw = globalThis.localStorage.getItem(PRODUCTS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as InventoryProduct[]) : [];
  } catch {
    return [];
  }
}

interface LedgerStockReflectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: LedgerStockReflectTarget | null;
  onConfirm: (lineId: string, info: StockReflectInfo) => void;
}

export function LedgerStockReflectDialog({
  open,
  onOpenChange,
  target,
  onConfirm,
}: LedgerStockReflectDialogProps) {
  const skuSelectRef = useRef<HTMLDivElement | null>(null);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [qty, setQty] = useState(1);
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [skuSelectOpen, setSkuSelectOpen] = useState(false);

  useEffect(() => {
    if (!open || !target) return;
    setProducts(loadStoredProducts().filter((p) => !p.deletedAtIso && p.active));
    setQty(target.quantity);
    setSelectedSku(null);
    setSearch("");
    setSkuSelectOpen(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,620px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-[var(--color-border)] px-5 py-4">
          <DialogTitle>{`${target.title} 재고 반영`}</DialogTitle>
          <DialogDescription>
            상품관리에 등록된 상품을 선택하고 반영할 수량을 확인하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="stock-search">상품 선택</Label>
            {products.length === 0 ? (
              <p className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-3 text-sm text-[var(--color-text-muted)]">
                상품관리에 등록된 상품이 없습니다. 먼저 상품을 등록해 주세요.
              </p>
            ) : (
              <div ref={skuSelectRef} className="relative">
                <Input
                  id="stock-search"
                  value={search}
                  onFocus={() => setSkuSelectOpen(true)}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSkuSelectOpen(true);
                    if (selectedSku) setSelectedSku(null);
                  }}
                  placeholder="SKU 또는 상품명으로 검색"
                />

                {skuSelectOpen ? (
                  <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-20 rounded-lg border border-[var(--color-border)] bg-white shadow-[0_10px_30px_rgba(2,6,23,0.16)]">
                    <ul className="max-h-[200px] divide-y divide-[var(--color-border)] overflow-y-auto">
                      {filtered.length === 0 ? (
                        <li className="px-3 py-8 text-center text-sm text-[var(--color-text-muted)]">
                          검색 결과가 없습니다.
                        </li>
                      ) : (
                        filtered.map((p) => (
                          <li key={p.sku}>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedSku(p.sku);
                                setSearch(`${p.sku} | ${p.name}`);
                                setSkuSelectOpen(false);
                              }}
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
            )}
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
  );
}
