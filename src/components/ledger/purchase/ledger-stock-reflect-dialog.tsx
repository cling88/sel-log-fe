"use client";

import { useEffect, useState } from "react";
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
import { formatAmount } from "@/lib/purchase-product-calc";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

export interface LedgerStockReflectTarget {
  id: string;
  title: string;
  subtitle?: string;
  quantity: number;
}

/** 퍼블용 샘플 상품 (상품관리 연동 전) */
const PUB_SAMPLE_PRODUCTS = [
  { sku: "PKG-0001", name: "골판지 박스 (중)", stock: 120 },
  { sku: "PKG-0002", name: "완충 랩", stock: 45 },
  { sku: "TOY-0001", name: "샘플 피규어 A", stock: 8 },
];

interface LedgerStockReflectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: LedgerStockReflectTarget | null;
  onConfirm: (lineId: string) => void;
}

export function LedgerStockReflectDialog({
  open,
  onOpenChange,
  target,
  onConfirm,
}: LedgerStockReflectDialogProps) {
  const [qty, setQty] = useState(1);
  const [selectedSku, setSelectedSku] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!open || !target) return;
    setQty(target.quantity);
    setSelectedSku(null);
    setSearch("");
  }, [open, target?.id, target?.quantity]);

  if (!target) return null;

  const filtered = PUB_SAMPLE_PRODUCTS.filter(
    (p) =>
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const adjustQty = (delta: number) => {
    setQty((prev) => Math.max(1, prev + delta));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(85vh,640px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-[var(--color-border)] px-5 py-4">
          <DialogTitle>재고 반영</DialogTitle>
          <DialogDescription>
            상품관리에 등록된 SKU를 선택합니다. (퍼블 샘플 목록)
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm">
            <p className="font-medium text-[var(--color-text-primary)]">
              {target.title}
            </p>
            {target.subtitle ? (
              <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                {target.subtitle}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="stock-category">카테고리</Label>
              <Input id="stock-category" disabled placeholder="전체 (추후)" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="stock-search">상품 검색</Label>
              <Input
                id="stock-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="SKU · 상품명"
              />
            </div>
          </div>

          <div className="rounded-lg border border-[var(--color-border)]">
            <div className="border-b border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)]">
              SKU / 상품명 / 현재재고
            </div>
            <ul className="max-h-40 divide-y divide-[var(--color-border)] overflow-y-auto">
              {filtered.map((p) => (
                <li key={p.sku}>
                  <button
                    type="button"
                    onClick={() => setSelectedSku(p.sku)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--primary-50)]/50",
                      selectedSku === p.sku && "bg-[var(--primary-50)]",
                    )}
                  >
                    <span>
                      <span className="font-mono text-xs text-[var(--color-text-muted)]">
                        {p.sku}
                      </span>
                      <span className="ml-2 text-[var(--color-text-primary)]">
                        {p.name}
                      </span>
                    </span>
                    <span className="shrink-0 tabular-nums text-[var(--color-text-secondary)]">
                      {p.stock}개
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <Button type="button" variant="outline" size="sm" disabled>
            + 상품 등록 (추후)
          </Button>

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
                onChange={(e) =>
                  setQty(Math.max(1, Number(e.target.value) || 1))
                }
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

        <DialogFooter className="gap-2 border-t border-[var(--color-border)] px-5 py-[0.6rem] sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            type="button"
            disabled={!selectedSku}
            onClick={() => {
              onConfirm(target.id);
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
