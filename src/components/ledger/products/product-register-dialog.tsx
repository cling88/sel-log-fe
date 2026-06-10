"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { Plus, X } from "lucide-react";
import { LedgerPickerTrigger } from "@/components/ledger/ledger-picker-trigger";
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
import { MODAL_DIALOG_FOOTER_CLASS } from "@/components/common/modal-footer-classes";
import {
  getUploadErrorMessage,
  uploadImageFile,
  validateImageFile,
} from "@/lib/api/upload";
import { isDuplicateSkuError } from "@/lib/api/products";
import { formatProductChangeTag } from "@/lib/product-change-labels";
import { formatAmount } from "@/lib/purchase-product-calc";
import { cn } from "@/lib/utils";
import type { InventoryCategory } from "@/types/inventory-category";
import type { InventoryProduct, InventoryProductInput } from "@/types/inventory-product";

const EMPTY_FORM: InventoryProductInput = {
  sku: "",
  name: "",
  category: "",
  imageUrl: "",
  memo: "",
  active: true,
  stock: 0,
  safetyStock: 0,
  currentPrice: 0,
};

export interface ProductRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editProduct?: InventoryProduct | null;
  /** 신규 등록 시 폼 prefill (재고반영 경로 등) */
  initialForm?: Partial<InventoryProductInput> | null;
  /** true: 초기재고 0 고정, 재고반영 API로만 증가 */
  stockReflectRegistration?: boolean;
  /** 재고반영 경로 — 확정 시 반영될 수량 (안내 문구용) */
  stockReflectQty?: number;
  /** 재고반영(상품매입) — 목록과 동일한 추천 판매가 범위 */
  recommendedPriceLabel?: string | null;
  /** true: 등록/저장 성공 alert 생략 (호출측 처리) */
  suppressSuccessAlert?: boolean;
  onSave: (input: InventoryProductInput) => Promise<InventoryProduct | void>;
  categories: InventoryCategory[];
  selectedCategoryFromDialog: string;
  onOpenCategoryManage: (currentCategory?: string) => void;
  onDelete?: () => void | Promise<void>;
  canDelete?: boolean;
  deleteDisabledReason?: string;
  saving?: boolean;
}

export function ProductRegisterDialog({
  open,
  onOpenChange,
  editProduct,
  initialForm,
  stockReflectRegistration = false,
  stockReflectQty,
  recommendedPriceLabel,
  suppressSuccessAlert = false,
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
  const [skuError, setSkuError] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [form, setForm] = useState<InventoryProductInput>(() => ({ ...EMPTY_FORM }));

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
      setSkuError(null);
      setImageUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setSkuError(null);
    setForm({
      ...EMPTY_FORM,
      ...(initialForm ?? {}),
      stock: stockReflectRegistration ? 0 : Number(initialForm?.stock) || 0,
    });
    setImageError(null);
    setImageUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [open, editProduct, initialForm, stockReflectRegistration]);

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
      await alert("판매가를 입력해 주세요.");
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
      stock: stockReflectRegistration ? 0 : Number(form.stock) || 0,
      safetyStock: Number(form.safetyStock) || 0,
      currentPrice: Math.max(0, Number(form.currentPrice) || 0),
      imageUrl: form.imageUrl?.trim() || "",
    };
    try {
      const saved = await onSave(input);
      onOpenChange(false);
      if (suppressSuccessAlert) return;
      if (isEdit) {
        const tag = formatProductChangeTag(saved?.changeKind, saved?.changeFrom);
        await alert(
          tag ? `상품이 저장되었습니다.\n(${tag})` : "상품이 저장되었습니다.",
        );
      } else {
        await alert("상품이 등록되었습니다.");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "상품 저장에 실패했습니다.";
      if (!isEdit && isDuplicateSkuError(error)) {
        setSkuError(message);
        if (stockReflectRegistration) {
          await alert(message);
        }
        return;
      }
      await alert(message);
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
              : stockReflectRegistration
                ? "매입 정보가 미리 채워집니다. SKU·가격을 확인한 뒤 등록하세요. 재고는 반영 확정 시 증가합니다."
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
                onChange={(e) => {
                  setSkuError(null);
                  patch({ sku: e.target.value });
                }}
                placeholder={
                  isEdit ? undefined : "종류-컬러-번호 (예: 티셔츠-블랙-001)"
                }
                readOnly={isEdit}
                disabled={isEdit}
                aria-readonly={isEdit}
                aria-invalid={!!skuError}
                className={
                  isEdit
                    ? "cursor-not-allowed border-[var(--color-border)] bg-[var(--color-bg)] text-[var(--color-text-secondary)]"
                    : undefined
                }
              />
              {skuError ? (
                <p className="text-xs text-[var(--color-danger)]">{skuError}</p>
              ) : null}
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

            <LedgerPickerTrigger
              className="sm:col-span-2"
              label="카테고리"
              displayValue={form.category?.trim() ? form.category : "선택"}
              isEmpty={!form.category?.trim()}
              onOpen={() => onOpenCategoryManage(form.category ?? "")}
              emptyHint={
                categories.length === 0
                  ? "카테고리가 없습니다. 클릭하여 추가해 주세요."
                  : undefined
              }
            />

            {isEdit ? (
              <div className="space-y-1.5 sm:col-span-2">
                <Label>현재 재고</Label>
                <div className="flex h-9 items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm tabular-nums text-[var(--color-text-secondary)]">
                  {editProduct?.stock ?? 0}개 · 재고 변경은 상세 패널의「재고 조정」을
                  사용하세요
                </div>
              </div>
            ) : stockReflectRegistration ? (
              <div className="space-y-1.5 sm:col-span-2">
                <Label>초기재고</Label>
                <div className="flex h-9 items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 text-sm text-[var(--color-text-secondary)]">
                  0개 · 재고반영 확정 시{" "}
                  {formatAmount(Math.max(1, stockReflectQty ?? 1))}개 증가합니다
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
              <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
                <Label htmlFor="p-price">
                  판매가 <span className="text-[var(--color-danger)]">*</span>
                </Label>
                {recommendedPriceLabel ? (
                  <span className="text-xs tabular-nums text-[var(--color-text-muted)]">
                    추천 {recommendedPriceLabel}
                  </span>
                ) : null}
              </div>
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
                  <TooltipTrigger
                    delay={200}
                    render={
                      <span className="inline-flex cursor-not-allowed rounded-md" />
                    }
                  >
                    {deleteButton}
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
