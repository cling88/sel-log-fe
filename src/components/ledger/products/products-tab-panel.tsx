"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Plus, X, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import {
  getUploadErrorMessage,
  uploadImageFile,
  validateImageFile,
} from "@/lib/api/upload";
import { formatAmount } from "@/lib/purchase-product-calc";
import { formatProductChangeTag } from "@/lib/product-change-labels";
import {
  ProductHistoryPeriodPicker,
} from "@/components/ledger/products/product-history-period-picker";
import { getTodayYearMonth } from "@/lib/ledger-period";
import { resolveStockHistorySource } from "@/lib/product-unified-history";
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

function stockEventTitle(
  h: InventoryStockHistoryItem,
  source: "purchase" | "sale" | "manual_adjust",
) {
  if (source === "manual_adjust") return h.reason?.trim() || "수동조정";
  return stockHistorySourceLabel(source);
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
  onSave: (input: InventoryProductInput) => Promise<InventoryProduct | void>;
  categories: InventoryCategory[];
  selectedCategoryFromDialog: string;
  onOpenCategoryManage: (currentCategory?: string) => void;
  onDelete?: () => void | Promise<void>;
  canDelete?: boolean;
  deleteDisabledReason?: string;
  saving?: boolean;
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
  saving = false,
}: ProductRegisterDialogProps) {
  const { alert } = useAppDialog();
  const isEdit = !!editProduct;

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [imageError, setImageError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
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
      setImageUploading(false);
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
    setImageUploading(false);
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

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (validation) {
      setImageError(validation);
      return;
    }

    setImageUploading(true);
    setImageError(null);
    try {
      const uploaded = await uploadImageFile(file);
      patch({ imageUrl: uploaded.url });
    } catch (error) {
      setImageError(getUploadErrorMessage(error));
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setImageUploading(false);
    }
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
    if (imageUploading) {
      await alert("이미지 업로드가 끝난 뒤 저장해 주세요.");
      return;
    }
    const input: InventoryProductInput = {
      ...form,
      sku: isEdit && editProduct ? editProduct.sku : sku,
      name,
      category: form.category?.trim() || "",
      memo: form.memo?.trim() || "",
      stock: Number(form.stock) || 0,
      safetyStock: Number(form.safetyStock) || 0,
      currentPrice: Math.max(0, Number(form.currentPrice) || 0),
      imageUrl: form.imageUrl?.trim() || "",
    };
    const saved = await onSave(input);
    onOpenChange(false);
    if (isEdit) {
      const tag = formatProductChangeTag(saved?.changeKind, saved?.changeFrom);
      await alert(
        tag ? `상품이 저장되었습니다.\n(${tag})` : "상품이 저장되었습니다.",
      );
    } else {
      await alert("상품이 등록되었습니다.");
    }
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
            {isEdit
              ? "SKU는 등록 후 변경할 수 없습니다. 나머지 항목을 수정할 수 있습니다."
              : "SKU·상품명·초기재고를 입력하면 서버에 등록됩니다."}
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
                placeholder={
                  isEdit ? undefined : "종류-컬러-번호 (예: 티셔츠-블랙-001)"
                }
                readOnly={isEdit}
                disabled={isEdit}
                aria-readonly={isEdit}
                className={
                  isEdit
                    ? "cursor-not-allowed border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)]"
                    : undefined
                }
              />
              {isEdit ? (
                <p className="text-xs text-[var(--color-text-muted)]">
                  매입·매출·재고 이력과 연결된 식별자라 수정할 수 없습니다.
                </p>
              ) : null}
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

            {isEdit ? (
              <div className="space-y-1.5 sm:col-span-2">
                <Label>현재 재고</Label>
                <div className="flex h-9 items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm tabular-nums text-[var(--color-text-secondary)]">
                  {editProduct?.stock ?? 0}개 · 재고 변경은 상세 패널의「재고 조정」을
                  사용하세요
                </div>
              </div>
            ) : (
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
            )}

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

              {imageUploading ? (
                <div className="flex size-24 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-xs text-[var(--color-text-muted)]">
                  업로드 중...
                </div>
              ) : form.imageUrl ? (
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
                    disabled={saving}
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
                  disabled={saving || imageUploading}
                  className={cn(
                    "flex size-24 shrink-0 items-center justify-center rounded-lg border border-dashed",
                    "border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-muted)]",
                    "transition-colors hover:border-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]",
                    "disabled:cursor-not-allowed disabled:opacity-60",
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
                  JPG, PNG 등 · 업로드 후 공개 URL이 상품에 저장됩니다
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
            (() => {
              const deleteDisabled = saving || !canDelete;
              const showDeleteHint =
                !canDelete && !!deleteDisabledReason && !saving;
              const deleteButton = (
                <Button
                  type="button"
                  variant="outline"
                  className="border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-red-50 disabled:opacity-60"
                  onClick={() => void handleDelete()}
                  disabled={deleteDisabled}
                >
                  삭제
                </Button>
              );

              if (!showDeleteHint) return deleteButton;

              return (
                <Tooltip>
                  <TooltipTrigger delay={200}>
                    <span className="inline-flex cursor-not-allowed rounded-md">
                      <span className="pointer-events-none inline-flex">
                        {deleteButton}
                      </span>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    sideOffset={8}
                    className="max-w-[220px] text-center leading-snug"
                  >
                    {deleteDisabledReason}
                  </TooltipContent>
                </Tooltip>
              );
            })()
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={() => void submit()}
            disabled={saving || imageUploading}
          >
            {saving ? "처리 중..." : isEdit ? "저장" : "등록"}
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
  loading?: boolean;
  loadError?: string | null;
  mutating?: boolean;
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
  loading = false,
  loadError = null,
  mutating = false,
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
            {loadError ? (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {loadError}
              </p>
            ) : null}

            <div className="flex items-center gap-2">
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="예: 포장재"
                disabled={loading || mutating}
              />
              <Button
                type="button"
                size="sm"
                className="h-9"
                disabled={loading || mutating}
                onClick={() => void handleCreate()}
              >
                + 추가
              </Button>
            </div>

            {loading ? (
              <p className="py-6 text-center text-sm text-[var(--color-text-muted)]">
                카테고리 불러오는 중...
              </p>
            ) : categories.length === 0 ? (
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
                                disabled={mutating}
                                onClick={() => void onSelect(cat.name)}
                              >
                                선택
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="h-8 w-8"
                                disabled={mutating}
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
                                disabled={mutating}
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
  const { alert, confirm } = useAppDialog();
  const { search, committedSearch, setSearch, applySearch } = useLedgerUrlSearch({
    commit: "manual",
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  /** 탭 최초 진입 시 목록 첫 상품 1회 자동 선택 */
  const autoSelectedOnEntryRef = useRef(false);

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
  const defaultHistoryYm = getTodayYearMonth();
  const [historyYear, setHistoryYear] = useState(defaultHistoryYm.year);
  const [historyMonth, setHistoryMonth] = useState(defaultHistoryYm.month);
  const [historyPage, setHistoryPage] = useState(1);

  useEffect(() => {
    setListPage(1);
  }, [committedSearch]);

  const hasCommittedSearch = committedSearch.trim().length > 0;

  const submitProductSearch = (query?: string) => {
    applySearch(query);
    setListPage(1);
    setSelectedId(null);
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
  } = useProductsList(committedSearch, listPage);

  const products = productsListData?.items ?? [];
  const productsMeta = productsListData?.meta;
  const listTotal = productsMeta?.total ?? 0;

  /** 등록 상품 0개(검색어 없이 목록 조회) — 등록 유도 화면만 */
  const showCatalogEmpty =
    !hasCommittedSearch &&
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

  /** 매출·매입 재고반영 등 — API 목록을 localStorage에 동기화 (해당 탭 API 연동 전) */
  useEffect(() => {
    if (products.length === 0) return;
    try {
      globalThis.localStorage?.setItem(
        PRODUCTS_STORAGE_KEY,
        JSON.stringify(products),
      );
    } catch {
      // ignore
    }
  }, [products]);

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

  useEffect(() => {
    if (autoSelectedOnEntryRef.current) return;
    if (productsLoading || productsLoadError || showCatalogEmpty) return;

    const first = visibleProducts[0];
    if (!first) return;

    setSelectedId((current) => {
      autoSelectedOnEntryRef.current = true;
      return current ?? first.id;
    });
  }, [
    productsLoading,
    productsLoadError,
    showCatalogEmpty,
    visibleProducts,
  ]);

  useEffect(() => {
    setHistoryPage(1);
  }, [selectedId, historyYear, historyMonth]);

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
    if (filtered.length === 0) {
      return (
        <p className="py-12 text-center text-sm text-[var(--color-text-muted)]">
          {hasCommittedSearch
            ? "검색 결과가 없습니다."
            : "표시할 상품이 없습니다."}
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
    });
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start">
      <div className="w-full md:w-[420px]">
        {showCatalogEmpty ? (
          <LedgerEmptyState
            title="상품관리"
            description="상품을 등록하고, 재고를 조정해 운영하세요."
            actionLabel="+ 상품 등록하기"
            onAction={openRegister}
          />
        ) : (
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
            <div className={ledgerListBodyClass}>{renderListBody()}</div>
            {!productsLoading && !productsLoadError ? (
              <div className={ledgerListFooterClass}>
                <PurchaseListPagination
                  page={listCurrentPage}
                  totalPages={listTotalPages}
                  onPageChange={setListPage}
                />
              </div>
            ) : null}
          </LedgerListShell>
        )}
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
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">히스토리</p>
                  <div className="flex shrink-0 flex-col items-end gap-1">
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
                ) : historyTotal === 0 ? (
                  <p className="mt-3 text-sm text-[var(--color-text-muted)]">
                    {historyMonth}월에 이력이 없습니다.
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

