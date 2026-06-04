"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Plus, X, Pencil, Trash2 } from "lucide-react";
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
import { useLedgerUrlSearch } from "@/hooks/use-ledger-url-search";
import { LedgerEmptyState } from "@/components/ledger/empty-state";
import {
  LedgerListShell,
  ledgerListBodyClass,
} from "@/components/ledger/ledger-list-shell";
import { PurchaseListToolbar } from "@/components/ledger/purchase/purchase-list-toolbar";
import { cn } from "@/lib/utils";
import { formatAmount } from "@/lib/purchase-product-calc";
import { MODAL_DIALOG_FOOTER_CLASS } from "@/components/common/modal-footer-classes";
import type {
  InventoryProduct,
  InventoryProductInput,
  InventoryPriceHistoryItem,
  InventoryProductStockAction,
  InventoryStockHistoryItem,
} from "@/types/inventory-product";
import type { InventoryCategory } from "@/types/inventory-category";

const PRODUCTS_STORAGE_KEY = "sellog-products-pub-v1";
const PRODUCT_SEED_ISO = "2026-01-01T00:00:00.000Z";
const SAMPLE_STOCK_HISTORY: InventoryStockHistoryItem = {
  id: "stk-seed-1",
  atIso: "2026-01-03T09:30:00.000Z",
  delta: 12,
  source: "purchase",
  vendor: "도매몰A",
  orderNo: "NV-240501-01",
  unitPrice: 12500,
  totalAmount: 150000,
  reason: "초기 샘플 입고",
};
const SAMPLE_PRICE_HISTORY: InventoryPriceHistoryItem[] = [
  {
    id: "prh-seed-2",
    atIso: "2026-01-05T11:00:00.000Z",
    price: 27000,
    source: "manual_edit",
    reason: "시세 반영",
  },
  {
    id: "prh-seed-1",
    atIso: PRODUCT_SEED_ISO,
    price: 25000,
    source: "product_register",
    reason: "상품 등록 기본가",
  },
];

function newId(prefix: string) {
  return `${prefix}-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
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

function stockHistorySourceLabel(source?: "purchase" | "sale" | "manual_adjust") {
  if (source === "purchase") return "매입";
  if (source === "sale") return "매출";
  return "수동조정";
}

function priceHistorySourceLabel(source: InventoryPriceHistoryItem["source"]) {
  if (source === "product_register") return "상품 등록";
  if (source === "manual_edit") return "가격 수정";
  return "매입 반영";
}

type UnifiedHistoryEntry =
  | {
      kind: "stock";
      id: string;
      atIso: string;
      stockAfter: number;
      data: InventoryStockHistoryItem;
    }
  | {
      kind: "price";
      id: string;
      atIso: string;
      stockAfter: number;
      data: InventoryPriceHistoryItem;
    };

function stockEventTitle(
  h: InventoryStockHistoryItem,
  source: "purchase" | "sale" | "manual_adjust",
) {
  if (source === "manual_adjust") return h.reason?.trim() || "수동조정";
  return stockHistorySourceLabel(source);
}

function buildUnifiedHistory(product: InventoryProduct): UnifiedHistoryEntry[] {
  const stockEntries: Extract<UnifiedHistoryEntry, { kind: "stock" }>[] =
    product.stockHistory.map((h) => ({
      kind: "stock" as const,
      id: `stk-${h.id}`,
      atIso: h.atIso,
      stockAfter: 0,
      data: h,
    }));
  const priceEntries: Extract<UnifiedHistoryEntry, { kind: "price" }>[] =
    product.priceHistory.map((h) => ({
      kind: "price" as const,
      id: `prh-${h.id}`,
      atIso: h.atIso,
      stockAfter: 0,
      data: h,
    }));

  const entries = [...stockEntries, ...priceEntries].sort(
    (a, b) => b.atIso.localeCompare(a.atIso) || a.id.localeCompare(b.id),
  );

  let runningStock = product.stock;
  const withStock: UnifiedHistoryEntry[] = [];

  for (const entry of entries) {
    if (entry.kind === "stock") {
      withStock.push({
        ...entry,
        stockAfter: runningStock,
      });
      runningStock -= entry.data.delta;
      continue;
    }
    withStock.push({
      ...entry,
      stockAfter: runningStock,
    });
  }

  return withStock;
}

function resolveStockHistorySource(h: InventoryStockHistoryItem) {
  if (h.source) return h.source;
  if (h.vendor || h.orderNo || h.unitPrice || h.totalAmount) return "purchase";
  return "manual_adjust";
}

function normalizeStockHistory(
  productId: string | undefined,
  stockHistory: InventoryStockHistoryItem[] | undefined,
): InventoryStockHistoryItem[] {
  const histories = stockHistory ?? [];
  if (productId !== "prd-sample-1") return histories;
  if (histories.length === 0) return [SAMPLE_STOCK_HISTORY];

  return histories.map((h) => {
    const isLegacySample =
      h.id === "stk-seed-1" &&
      (!h.vendor || !h.unitPrice || !h.totalAmount || h.source !== "purchase");
    if (isLegacySample) return SAMPLE_STOCK_HISTORY;
    return h;
  });
}

function normalizePriceHistory(
  productId: string | undefined,
  priceHistory: InventoryPriceHistoryItem[] | undefined,
): InventoryPriceHistoryItem[] {
  const histories = priceHistory ?? [];
  if (productId !== "prd-sample-1") return histories;
  if (histories.length === 0) return SAMPLE_PRICE_HISTORY;
  return histories;
}

interface ProductRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editProduct?: InventoryProduct | null;
  onSave: (input: InventoryProductInput) => void | Promise<void>;
  categories: InventoryCategory[];
  selectedCategoryFromDialog: string;
  onOpenCategoryManage: (currentCategory?: string) => void;
  onDelete?: () => void | Promise<void>;
  canDelete?: boolean;
  deleteDisabledReason?: string;
}

function ProductRegisterDialog({
  open,
  onOpenChange,
  editProduct,
  onSave,
  categories,
  selectedCategoryFromDialog,
  onOpenCategoryManage,
  onDelete,
  canDelete = true,
  deleteDisabledReason,
}: ProductRegisterDialogProps) {
  const { alert } = useAppDialog();
  const isEdit = !!editProduct;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [imageError, setImageError] = useState<string | null>(null);
  const [form, setForm] = useState<InventoryProductInput>(() => ({
    sku: "",
    name: "",
    category: "",
    imageUrl: "",
    memo: "",
    active: true,
    stock: 0,
    safetyStock: 0,
    currentPrice: 0,
  }));

  // open/close 시 폼 리셋
  useEffect(() => {
    if (!open) return;
    if (editProduct) {
      setForm({
        sku: editProduct.sku,
        name: editProduct.name,
        category: editProduct.category ?? "",
        imageUrl: editProduct.imageUrl ?? "",
        memo: editProduct.memo ?? "",
        active: editProduct.active,
        stock: editProduct.stock,
        safetyStock: editProduct.safetyStock,
        currentPrice: editProduct.currentPrice ?? 0,
      });
      setImageError(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setForm({
      sku: "",
      name: "",
      category: "",
      imageUrl: "",
      memo: "",
      active: true,
      stock: 0,
      safetyStock: 0,
      currentPrice: 0,
    });
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    return;
  }, [open, editProduct]);

  useEffect(() => {
    if (!open) return;
    patch({ category: selectedCategoryFromDialog ?? "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryFromDialog, open]);

  const patch = (p: Partial<InventoryProductInput>) => {
    setForm((prev) => ({ ...prev, ...p }));
    setImageError(null);
  };

  const clearImage = () => {
    patch({ imageUrl: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openPicker = () => fileInputRef.current?.click();

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      patch({ imageUrl: result });
    };
    reader.onerror = () => setImageError("이미지를 불러오지 못했습니다.");
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    const sku = form.sku.trim();
    const name = form.name.trim();
    if (!sku || !name) {
      await alert("SKU와 상품명을 확인해 주세요.");
      return;
    }
    if (Number(form.currentPrice) <= 0) {
      await alert("기본 가격을 입력해 주세요.");
      return;
    }
    const input: InventoryProductInput = {
      ...form,
      sku,
      name,
      category: form.category?.trim() || "",
      memo: form.memo?.trim() || "",
      stock: Number(form.stock) || 0,
      safetyStock: Number(form.safetyStock) || 0,
      currentPrice: Math.max(0, Number(form.currentPrice) || 0),
      imageUrl: form.imageUrl?.trim() || "",
    };
    await onSave(input);
    onOpenChange(false);
    await alert(isEdit ? "상품이 저장되었습니다." : "상품이 등록되었습니다.");
  };

  const handleDelete = async () => {
    if (!isEdit || !onDelete) return;
    if (!canDelete) {
      await alert(deleteDisabledReason ?? "삭제할 수 없는 상태입니다.");
      return;
    }
    await onDelete();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(85vh,640px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg"
        aria-describedby={undefined}
      >
        <DialogHeader className="border-b border-[var(--color-border)] px-5 py-4">
          <DialogTitle>{isEdit ? "상품 편집" : "상품 등록"}</DialogTitle>
          <DialogDescription>
            SKU·상품명·초기재고를 입력하면 좌측 목록에 반영됩니다. (퍼블)
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="p-sku">
                SKU <span className="text-[var(--color-danger)]">*</span>
              </Label>
              <Input
                id="p-sku"
                value={form.sku}
                onChange={(e) => patch({ sku: e.target.value })}
                placeholder="예: SKU-0001"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="p-name">
                상품명 <span className="text-[var(--color-danger)]">*</span>
              </Label>
              <Input
                id="p-name"
                value={form.name}
                onChange={(e) => patch({ name: e.target.value })}
                placeholder="예: 골판지 박스"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <Label>카테고리</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 shrink-0 whitespace-nowrap"
                  onClick={() => onOpenCategoryManage(form.category ?? "")}
                >
                  선택
                </Button>
              </div>
              <div className="flex h-9 items-center rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text-primary)]">
                {form.category?.trim() ? form.category : "선택"}
              </div>
              {categories.length === 0 ? (
                <p className="text-xs text-[var(--color-text-muted)]">
                  카테고리가 없습니다. 선택 버튼에서 추가해 주세요.
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-stock">초기재고</Label>
              <Input
                id="p-stock"
                type="number"
                min={0}
                value={form.stock}
                onChange={(e) => patch({ stock: Number(e.target.value) })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-safety">안전재고</Label>
              <Input
                id="p-safety"
                type="number"
                min={0}
                value={form.safetyStock}
                onChange={(e) => patch({ safetyStock: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="p-price">
                기본 가격 <span className="text-[var(--color-danger)]">*</span>
              </Label>
              <Input
                id="p-price"
                type="number"
                min={0}
                value={form.currentPrice}
                onChange={(e) =>
                  patch({ currentPrice: Math.max(0, Number(e.target.value) || 0) })
                }
                placeholder="예: 25000"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label>사용여부</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={form.active ? "default" : "outline"}
                  size="sm"
                  className="h-8"
                  onClick={() => patch({ active: true })}
                >
                  활성
                </Button>
                <Button
                  type="button"
                  variant={!form.active ? "destructive" : "outline"}
                  size="sm"
                  className="h-8"
                  onClick={() => patch({ active: false })}
                >
                  비활성
                </Button>
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label>상품 이미지 (선택)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleImageChange}
              />

              {form.imageUrl ? (
                <div className="relative size-24 shrink-0 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={form.imageUrl}
                    alt="상품 미리보기"
                    className="size-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className={cn(
                      "absolute top-1 right-1 flex size-6 items-center justify-center rounded-full border border-[var(--color-border)] bg-white/95 shadow-sm",
                      "transition-colors hover:bg-white hover:text-[var(--color-text-primary)]",
                    )}
                    aria-label="이미지 삭제"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openPicker}
                  className={cn(
                    "flex size-24 shrink-0 items-center justify-center rounded-lg border border-dashed",
                    "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)]",
                    "transition-colors hover:border-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]",
                  )}
                  aria-label="이미지 업로드"
                >
                  <Plus className="size-7 stroke-[1.5]" />
                </button>
              )}

              {imageError ? (
                <p className="text-xs text-[var(--color-danger)]">{imageError}</p>
              ) : (
                <p className="text-xs text-[var(--color-text-secondary)]">
                  JPG, PNG 등 이미지 파일 (퍼블: 브라우저에만 저장)
                </p>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="p-memo">비고</Label>
              <Textarea
                id="p-memo"
                rows={4}
                value={form.memo ?? ""}
                onChange={(e) => patch({ memo: e.target.value })}
                placeholder="메모, 특이사항 등"
                className="resize-y"
              />
            </div>
          </div>
        </div>

        <DialogFooter className={MODAL_DIALOG_FOOTER_CLASS}>
          {isEdit && onDelete ? (
            <Button
              type="button"
              variant="outline"
              className="border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-red-50"
              onClick={() => void handleDelete()}
            >
              삭제
            </Button>
          ) : null}
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button type="button" onClick={() => void submit()}>
            {isEdit ? "저장" : "등록"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CategoryManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: InventoryCategory[];
  selectedCategoryName?: string;
  onSelect: (name: string) => void | Promise<void>;
  onCreate: (name: string) => void | Promise<void>;
  onUpdate: (id: string, name: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

function CategoryManageDialog({
  open,
  onOpenChange,
  categories,
  selectedCategoryName,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
}: CategoryManageDialogProps) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    if (!open) return;
    setNewName("");
    setEditingId(null);
    setEditingName("");
  }, [open]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    await onCreate(name);
    setNewName("");
  };

  const handleStartEdit = (cat: InventoryCategory) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
  };

  const handleConfirmEdit = async () => {
    if (!editingId) return;
    const name = editingName.trim();
    if (!name) return;
    await onUpdate(editingId, name);
    setEditingId(null);
    setEditingName("");
  };

  const handleDelete = async (id: string) => {
    await onDelete(id);
    if (editingId === id) {
      setEditingId(null);
      setEditingName("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(85vh,520px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        aria-describedby={undefined}
      >
        <DialogHeader className="border-b border-[var(--color-border)] px-5 py-4">
          <DialogTitle>카테고리 선택</DialogTitle>
          <DialogDescription>
            선택/추가/수정/삭제를 할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="예: 포장재"
              />
              <Button type="button" size="sm" className="h-9" onClick={() => void handleCreate()}>
                + 추가
              </Button>
            </div>

            {categories.length === 0 ? (
              <p className="py-6 text-sm text-[var(--color-text-muted)]">
                아직 카테고리가 없습니다.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {categories.map((cat) => {
                  const isEditing = editingId === cat.id;
                  const isSelected = selectedCategoryName === cat.name;
                  return (
                    <li
                      key={cat.id}
                      className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        {isEditing ? (
                          <div className="flex flex-1 items-center gap-2">
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              placeholder="카테고리명"
                            />
                            <Button
                              type="button"
                              size="sm"
                              className="h-8 shrink-0"
                              onClick={() => void handleConfirmEdit()}
                            >
                              저장
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-8 shrink-0"
                              onClick={() => {
                                setEditingId(null);
                                setEditingName("");
                              }}
                            >
                              취소
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="min-w-0 flex flex-1 items-center gap-2">
                              <span className="truncate text-sm font-medium">
                                {cat.name}
                              </span>
                              {isSelected ? (
                                <span className="rounded-full bg-[var(--primary-50)] px-2 py-0.5 text-[10px] font-medium text-[var(--primary-600)]">
                                  선택됨
                                </span>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Button
                                type="button"
                                size="sm"
                                className="h-8"
                                onClick={() => void onSelect(cat.name)}
                              >
                                선택
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="h-8 w-8"
                                onClick={() => handleStartEdit(cat)}
                                aria-label="카테고리 수정"
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="h-8 w-8"
                                onClick={() => void handleDelete(cat.id)}
                                aria-label="카테고리 삭제"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter className={MODAL_DIALOG_FOOTER_CLASS}>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface StockAdjustDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: InventoryProduct | null;
  onConfirm: (args: { delta: number; reason?: string }) => void | Promise<void>;
}

function StockAdjustDialog({
  open,
  onOpenChange,
  product,
  onConfirm,
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

    await onConfirm({ delta, reason: reason.trim() || undefined });
    onOpenChange(false);
    await alert("재고가 조정되었습니다.");
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
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button type="button" onClick={() => void submit()}>
            적용
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ProductsTabPanel() {
  const { alert, confirm } = useAppDialog();
  const createSeedProducts = (): InventoryProduct[] => {
    const now = PRODUCT_SEED_ISO;
    return [
      {
        id: "prd-sample-1",
        sku: "SKU-001",
        name: "샘플 상품 1",
        category: "퍼블",
        imageUrl: "",
        memo: "임시데이터(퍼블)입니다.",
        active: true,
        stock: 0,
        safetyStock: 0,
        currentPrice: 25000,
        createdAtIso: now,
        updatedAtIso: now,
        deletedAtIso: undefined,
        stockHistory: [SAMPLE_STOCK_HISTORY],
        priceHistory: SAMPLE_PRICE_HISTORY,
      },
    ];
  };
  const normalizeProducts = (parsed: Partial<InventoryProduct>[]): InventoryProduct[] =>
    parsed.map((item) => ({
      id: item.id ?? newId("prd"),
      sku: item.sku ?? "",
      name: item.name ?? "",
      category: item.category,
      imageUrl: item.imageUrl,
      memo: item.memo,
      active: item.active ?? true,
      stock: item.stock ?? 0,
      safetyStock: item.safetyStock ?? 0,
      currentPrice: item.currentPrice ?? 0,
      createdAtIso: item.createdAtIso ?? new Date().toISOString(),
      updatedAtIso: item.updatedAtIso ?? new Date().toISOString(),
      deletedAtIso: item.deletedAtIso,
      stockHistory: normalizeStockHistory(item.id, item.stockHistory),
      priceHistory: normalizePriceHistory(item.id, item.priceHistory),
    }));

  const [products, setProducts] = useState<InventoryProduct[]>(createSeedProducts);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>("prd-sample-1");
  const { search, setSearch } = useLedgerUrlSearch();

  const [registerOpen, setRegisterOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<InventoryProduct | null>(null);

  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [categoryForRegister, setCategoryForRegister] = useState("");

  const visibleCategories = useMemo(
    () => categories.filter((c) => !c.deletedAtIso),
    [categories],
  );

  const [stockDialogOpen, setStockDialogOpen] = useState(false);

  useEffect(() => {
    try {
      const stored = globalThis.localStorage?.getItem(PRODUCTS_STORAGE_KEY);
      if (!stored) {
        setStorageLoaded(true);
        return;
      }
      const parsed = JSON.parse(stored) as Partial<InventoryProduct>[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setProducts(normalizeProducts(parsed));
      }
    } catch {
      // ignore storage parse error
    } finally {
      setStorageLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!storageLoaded) return;
    globalThis.localStorage?.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
  }, [products, storageLoaded]);

  const selectedProduct = useMemo(() => {
    if (!selectedId) return null;
    return products.find((p) => p.id === selectedId && !p.deletedAtIso) ?? null;
  }, [products, selectedId]);

  const visibleProducts = useMemo(
    () => products.filter((p) => !p.deletedAtIso),
    [products],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return visibleProducts;
    return visibleProducts.filter((p) => {
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.memo ?? "").toLowerCase().includes(q)
      );
    });
  }, [visibleProducts, search]);

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
    let createdId: string | null = null;
    setProducts((prev) => {
      const now = new Date().toISOString();
      if (editProduct) {
        return prev.map((p) =>
          p.id === editProduct.id
            ? (() => {
                const normalizedPrice = Math.max(0, Number(input.currentPrice) || 0);
                const priceChanged = normalizedPrice !== (p.currentPrice ?? 0);
                const nextPriceHistory: InventoryPriceHistoryItem[] = priceChanged
                  ? [
                      {
                        id: newId("prh"),
                        atIso: now,
                        price: normalizedPrice,
                        source: "manual_edit",
                        reason: "상품관리에서 기본가 수정",
                      },
                      ...p.priceHistory,
                    ]
                  : p.priceHistory;
                return {
                  ...p,
                  sku: input.sku,
                  name: input.name,
                  category: input.category?.trim() || undefined,
                  imageUrl: input.imageUrl?.trim() || undefined,
                  memo: input.memo?.trim() || undefined,
                  active: input.active,
                  stock: input.stock,
                  safetyStock: input.safetyStock,
                  currentPrice: normalizedPrice,
                  updatedAtIso: now,
                  priceHistory: nextPriceHistory,
                };
              })()
            : p,
        );
      }

      createdId = newId("prd");
      const next: InventoryProduct = {
        id: createdId,
        sku: input.sku,
        name: input.name,
        category: input.category?.trim() || undefined,
        imageUrl: input.imageUrl?.trim() || undefined,
        memo: input.memo?.trim() || undefined,
        active: input.active,
        stock: input.stock,
        safetyStock: input.safetyStock,
        currentPrice: Math.max(0, Number(input.currentPrice) || 0),
        createdAtIso: now,
        updatedAtIso: now,
        stockHistory: [],
        priceHistory: [
          {
            id: newId("prh"),
            atIso: now,
            price: Math.max(0, Number(input.currentPrice) || 0),
            source: "product_register",
            reason: "상품 등록 기본가",
          },
        ],
      };
      return [...prev, next];
    });

    if (createdId) setSelectedId(createdId);
    setEditProduct(null);
  };

  const handleDeleteProduct = async (product: InventoryProduct) => {
    if (product.stock !== 0) {
      await alert("현재 재고가 0개일 때만 삭제할 수 있습니다.");
      return;
    }

    const ok = await confirm({
      title: "상품 삭제",
      message:
        "데이터 꼬임 방지를 위해 실제 삭제하지 않고 삭제 플래그 처리합니다. 이 상품을 목록에서 숨길까요?",
      confirmLabel: "삭제",
      destructive: true,
    });
    if (!ok) return;

    setProducts((prev) =>
      prev.map((p) =>
        p.id === product.id
          ? {
              ...p,
              deletedAtIso: new Date().toISOString(),
              updatedAtIso: new Date().toISOString(),
            }
          : p,
      ),
    );
    setRegisterOpen(false);
    setEditProduct(null);
    if (selectedId === product.id) {
      setSelectedId(null);
    }
    await alert("삭제 처리되었습니다. (목록에서 숨김)");
  };

  const unifiedHistory = useMemo(() => {
    if (!selectedProduct) return [];
    return buildUnifiedHistory(selectedProduct);
  }, [selectedProduct]);

  const handleConfirmStockAdjust = async (args: {
    delta: number;
    reason?: string;
  }) => {
    const target = selectedProduct;
    if (!target) return;

    const nextItem: InventoryStockHistoryItem = {
      id: newId("stk"),
      atIso: new Date().toISOString(),
      delta: args.delta,
      source: "manual_adjust",
      reason: args.reason,
    };

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== target.id) return p;
        return {
          ...p,
          stock: Math.max(0, p.stock + args.delta),
          updatedAtIso: new Date().toISOString(),
          stockHistory: [nextItem, ...p.stockHistory],
        };
      }),
    );
  };

  const showListEmpty = visibleProducts.length === 0;

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start">
      <div className="w-full md:w-[420px]">
        {showListEmpty ? (
          <LedgerEmptyState
            title="상품관리"
            description="상품을 등록하고, 재고를 조정해 운영하세요. (퍼블)"
            actionLabel="+ 상품 등록하기"
            onAction={openRegister}
          />
        ) : (
          <LedgerListShell>
            <PurchaseListToolbar
              embedded
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="상품명, SKU 검색"
              registerLabel="+ 상품 등록"
              onRegister={openRegister}
            />
            <div className={ledgerListBodyClass}>
              {filtered.length === 0 ? (
                <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">
                  검색 결과가 없습니다.
                </p>
              ) : (
                filtered.map((p) => {
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
                            <span
                              className={cn(
                                "rounded-full border px-2 py-0.5 text-[11px] text-nowrap",
                                productStatusTone(p),
                              )}
                            >
                              {productStatusLabel(p)}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                            SKU {p.sku} · 안전 {p.safetyStock} · 재고{" "}
                            <span className="tabular-nums font-medium text-[var(--color-text-primary)]">
                              {p.stock}
                            </span>
                            {" · 기본가 "}
                            <span className="tabular-nums font-medium text-[var(--color-text-primary)]">
                              {formatAmount(p.currentPrice ?? 0)}원
                            </span>
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </LedgerListShell>
        )}
      </div>

      <div className="w-full flex-1">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-sm)]">
          {selectedProduct ? (
            <div className="p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                  {selectedProduct.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={selectedProduct.imageUrl}
                      alt=""
                      className="size-14 rounded-md border border-[var(--color-border)] object-cover bg-[var(--color-bg)]"
                    />
                  ) : (
                    <div className="size-14 rounded-md border border-[var(--color-border)] bg-[var(--color-bg)]" />
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold">
                      {selectedProduct.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      SKU {selectedProduct.sku}
                      {selectedProduct.category ? ` · ${selectedProduct.category}` : ""}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2">
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
                  >
                    재고 조정
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
                  <p className="text-xs text-[var(--color-text-secondary)]">기본 가격</p>
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
                {unifiedHistory.length === 0 ? (
                  <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                    아직 이력이 없습니다.
                  </p>
                ) : (
                  <ul className="mt-3 flex flex-col gap-2">
                    {unifiedHistory.map((entry) => (
                      <li
                        key={entry.id}
                        className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2.5"
                      >
                        <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                          {formatHistoryDateTime(entry.atIso)}
                        </p>
                        <div className="mt-1 flex items-center justify-between gap-3">
                          {entry.kind === "stock" ? (
                            <p className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-[var(--color-text-primary)]">
                              <span className="font-medium">
                                {stockEventTitle(
                                  entry.data,
                                  resolveStockHistorySource(entry.data),
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
                              <span className="tabular-nums font-semibold">
                                {formatAmount(entry.data.price)}원
                              </span>
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
                    ))}
                  </ul>
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
        onSelect={(name) => {
          setCategoryForRegister(name);
          setCategoryDialogOpen(false);
        }}
        onCreate={(name) => {
          const now = new Date().toISOString();
          const id = newId("cat");
          setCategories((prev) => [
            ...prev,
            { id, name, createdAtIso: now, updatedAtIso: now },
          ]);
        }}
        onUpdate={(id, name) => {
          const now = new Date().toISOString();
          setCategories((prev) =>
            prev.map((c) =>
              c.id === id ? { ...c, name, updatedAtIso: now } : c,
            ),
          );
        }}
        onDelete={(id) => {
          const now = new Date().toISOString();
          const target = visibleCategories.find((c) => c.id === id);
          setCategories((prev) =>
            prev.map((c) =>
              c.id === id ? { ...c, deletedAtIso: now, updatedAtIso: now } : c,
            ),
          );
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
        categories={visibleCategories}
        selectedCategoryFromDialog={categoryForRegister}
        onOpenCategoryManage={(currentCategory) => {
          setCategoryForRegister(currentCategory ?? "");
          setCategoryDialogOpen(true);
        }}
        onDelete={
          editProduct ? () => handleDeleteProduct(editProduct) : undefined
        }
        canDelete={editProduct ? editProduct.stock === 0 : true}
        deleteDisabledReason="현재 재고가 0개일 때만 삭제할 수 있습니다."
      />

      <StockAdjustDialog
        open={stockDialogOpen}
        onOpenChange={setStockDialogOpen}
        product={selectedProduct}
        onConfirm={handleConfirmStockAdjust}
      />
    </div>
  );
}

