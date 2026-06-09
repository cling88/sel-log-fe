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
import { Textarea } from "@/components/ui/textarea";
import { formatDisplayDate, todayIso } from "@/lib/date";
import { calcUnitPrice, formatAmount } from "@/lib/purchase-product-calc";
import { cn } from "@/lib/utils";
import {
  createEmptyProductPurchaseInput,
  type ProductPurchaseLine,
  type ProductPurchaseLineInput,
} from "@/types/purchase-product";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import { useUploadImage } from "@/hooks/use-upload-image";
import { REGISTER_MODAL_FOOTER_CLASS } from "@/components/ledger/purchase/ledger-register-dialog-classes";
import { PurchaseBankSelectField } from "@/components/ledger/purchase/purchase-bank-select-field";
import { PurchaseVendorSelectField } from "@/components/ledger/purchase/purchase-vendor-select-field";
import { useVendors } from "@/hooks/use-vendors";
import type { VendorSummary } from "@/types/vendor";
import { Plus, X } from "lucide-react";

interface ProductPurchaseRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 그룹에서 「내역 추가」 시 해당 날짜. 없으면 오늘 */
  defaultPaymentDate?: string;
  editLine?: ProductPurchaseLine | null;
  onSave: (
    line: Omit<ProductPurchaseLine, "id" | "stockReflected">,
    options?: { closeAfter?: boolean },
  ) => void | Promise<void>;
  onUpdate?: (
    lineId: string,
    line: Omit<ProductPurchaseLine, "id" | "stockReflected">,
  ) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
  canDelete?: boolean;
  deleteDisabledReason?: string;
}

function lineToInput(line: ProductPurchaseLine): ProductPurchaseLineInput {
  return {
    paymentDate: line.paymentDate,
    orderNo: line.orderNo,
    imageUrl: line.imageUrl,
    productName: line.productName,
    productLink: line.productLink,
    vendorId: line.vendorId ?? "",
    quantity: String(line.quantity),
    paymentAmount: String(line.paymentAmount),
    memo: line.memo,
    bankId: line.bankId ?? "",
  };
}

function resolvePaymentDate(defaultPaymentDate?: string): string {
  if (typeof defaultPaymentDate === "string") {
    const trimmed = defaultPaymentDate.trim();
    if (trimmed) return trimmed;
  }
  return todayIso();
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function resolveBankId(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed || null;
}

function resolveVendorId(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed || null;
}

function parseForm(
  form: ProductPurchaseLineInput,
  selectedVendor: VendorSummary | null,
  editLine?: ProductPurchaseLine | null,
): Omit<ProductPurchaseLine, "id" | "stockReflected"> | null {
  const productName = form.productName.trim();
  const paymentDate = form.paymentDate.trim();
  const productLink = form.productLink.trim();
  const quantity = Math.trunc(Number(form.quantity));
  const paymentAmount = Math.trunc(Number(form.paymentAmount));
  const vendorId = resolveVendorId(form.vendorId);

  if (
    !paymentDate ||
    !productName ||
    !vendorId ||
    !selectedVendor ||
    selectedVendor.id !== vendorId ||
    quantity <= 0 ||
    paymentAmount < 0
  ) {
    return null;
  }
  if (productLink && !isHttpUrl(productLink)) {
    return null;
  }

  const bankId = resolveBankId(form.bankId);

  return {
    paymentDate,
    orderNo: form.orderNo.trim(),
    imageUrl: form.imageUrl.trim(),
    productName,
    productLink,
    vendor: selectedVendor.name,
    vendorId,
    vendorSnapshot: selectedVendor,
    quantity,
    paymentAmount,
    memo: form.memo.trim(),
    bankId,
    bank:
      editLine && editLine.bankId === bankId && editLine.bank
        ? editLine.bank
        : null,
  };
}

export function ProductPurchaseRegisterDialog({
  open,
  onOpenChange,
  defaultPaymentDate,
  editLine,
  onSave,
  onUpdate,
  onDelete,
  canDelete = true,
  deleteDisabledReason,
}: ProductPurchaseRegisterDialogProps) {
  const { alert } = useAppDialog();
  const { vendors } = useVendors();
  const uploadImage = useUploadImage();
  const isEdit = editLine != null;
  const readOnly = Boolean(editLine?.stockReflected);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ProductPurchaseLineInput>(() =>
    createEmptyProductPurchaseInput(resolvePaymentDate(defaultPaymentDate)),
  );
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formSessionRef = useRef<string | null>(null);

  const revokePreviewUrl = (url: string) => {
    if (url.startsWith("blob:")) URL.revokeObjectURL(url);
  };

  const resetForm = (paymentDate?: string) => {
    setPreviewUrl((prev) => {
      revokePreviewUrl(prev);
      return "";
    });
    setPendingImageFile(null);
    setForm(createEmptyProductPurchaseInput(resolvePaymentDate(paymentDate)));
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    if (!open) {
      formSessionRef.current = null;
      return;
    }

    const sessionKey = editLine
      ? `edit:${editLine.id}`
      : `new:${defaultPaymentDate ?? ""}`;
    if (formSessionRef.current === sessionKey) return;
    formSessionRef.current = sessionKey;

    if (editLine) {
      setForm(lineToInput(editLine));
      setError(null);
      return;
    }
    resetForm(defaultPaymentDate);
  }, [open, defaultPaymentDate, editLine]);

  const patch = (patch: Partial<ProductPurchaseLineInput>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setError(null);
  };

  const clearImage = () => {
    setPreviewUrl((prev) => {
      revokePreviewUrl(prev);
      return "";
    });
    setPendingImageFile(null);
    patch({ imageUrl: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openImagePicker = () => fileInputRef.current?.click();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    setPreviewUrl((prev) => {
      revokePreviewUrl(prev);
      return URL.createObjectURL(file);
    });
    setPendingImageFile(file);
    patch({ imageUrl: "" });
    setError(null);
  };

  const handleDelete = async () => {
    if (!isEdit || !onDelete) return;
    if (!canDelete) {
      await alert(
        deleteDisabledReason ?? "삭제할 수 없는 상태입니다.",
      );
      return;
    }
    await onDelete();
  };

  const submit = async (closeAfter: boolean) => {
    if (readOnly) return;

    const productLink = form.productLink.trim();
    if (productLink && !isHttpUrl(productLink)) {
      setError("상품 상세 링크는 http:// 또는 https:// 로 시작해야 합니다.");
      return;
    }

    const vendorId = resolveVendorId(form.vendorId);
    const selectedVendor =
      vendorId != null
        ? vendors.find((v) => v.id === vendorId) ?? null
        : null;
    const parsed = parseForm(form, selectedVendor, editLine);
    if (!parsed) {
      setError("결제날짜, 상품명, 구매처, 수량, 결제금액을 확인해 주세요.");
      return;
    }

    setSubmitting(true);
    try {
      let imageUrl = parsed.imageUrl;
      if (pendingImageFile) {
        const uploaded = await uploadImage.mutateAsync(pendingImageFile);
        imageUrl = uploaded.url;
      }

      const payload = { ...parsed, imageUrl };
      if (isEdit && editLine && onUpdate) {
        await Promise.resolve(onUpdate(editLine.id, payload));
        return;
      }
      await Promise.resolve(onSave(payload, { closeAfter }));
      if (!closeAfter) {
        formSessionRef.current = `new:${payload.paymentDate}`;
        resetForm(payload.paymentDate);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const displayImageUrl = previewUrl || form.imageUrl;

  const qty = Number(form.quantity);
  const amount = Number(form.paymentAmount);
  const previewUnit =
    qty > 0 && amount >= 0 ? calcUnitPrice(qty, amount) : null;

  const displayDate = form.paymentDate || todayIso();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-[var(--color-border)] px-5 py-4">
          <DialogTitle>{isEdit ? "상품 매입 상세" : "상품 매입 등록"}</DialogTitle>
          <DialogDescription>
            {readOnly
              ? "재고 반영된 내역은 조회만 가능합니다. 수정하려면 목록에서 반영을 취소해 주세요."
              : isEdit
                ? "내역을 확인·수정하거나 삭제할 수 있습니다."
                : "한 건씩 저장하면 같은 결제날짜끼리 목록에서 자동으로 묶여 보입니다."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {readOnly ? (
            <p className="mb-4 rounded-lg border border-[var(--color-warning)]/40 bg-amber-50 px-3 py-2 text-sm text-[var(--color-text-secondary)]">
              재고 반영 완료된 내역은 수정·삭제할 수 없습니다.
            </p>
          ) : null}
          {error ? (
            <p className="mb-4 rounded-lg border border-[var(--color-danger)]/30 bg-red-50 px-3 py-2 text-sm text-[var(--color-danger)]">
              {error}
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pp-date">
                결제날짜 <span className="text-[var(--color-danger)]">*</span>
              </Label>
              <Input
                id="pp-date"
                type="date"
                value={form.paymentDate || todayIso()}
                disabled={readOnly}
                onChange={(e) => patch({ paymentDate: e.target.value })}
              />
              <p className="text-xs text-[var(--color-text-muted)]">
                기본값: 오늘 ({formatDisplayDate(displayDate)})
              </p>
            </div>

            <PurchaseBankSelectField
              className="sm:col-span-2"
              bankId={resolveBankId(form.bankId)}
              bankSnapshot={editLine?.bank}
              disabled={readOnly}
              onBankIdChange={(id) =>
                patch({ bankId: id ?? "" })
              }
            />

            <PurchaseVendorSelectField
              vendorId={resolveVendorId(form.vendorId)}
              vendorSnapshot={editLine?.vendorSnapshot}
              legacyVendorName={
                !editLine?.vendorId && editLine?.vendor
                  ? editLine.vendor
                  : undefined
              }
              required
              disabled={readOnly}
              onVendorIdChange={(id) => patch({ vendorId: id ?? "" })}
            />

            <div className="space-y-1.5">
              <Label htmlFor="pp-order-no">주문번호</Label>
              <Input
                id="pp-order-no"
                value={form.orderNo}
                disabled={readOnly}
                onChange={(e) => patch({ orderNo: e.target.value })}
                placeholder="선택"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pp-name">
                상품명 <span className="text-[var(--color-danger)]">*</span>
              </Label>
              <Input
                id="pp-name"
                value={form.productName}
                disabled={readOnly}
                onChange={(e) => patch({ productName: e.target.value })}
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pp-link">상품 상세 링크</Label>
              <Input
                id="pp-link"
                value={form.productLink}
                disabled={readOnly}
                onChange={(e) => patch({ productLink: e.target.value })}
                placeholder="https://"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pp-qty">
                개수 <span className="text-[var(--color-danger)]">*</span>
              </Label>
              <Input
                id="pp-qty"
                type="number"
                min={1}
                value={form.quantity}
                disabled={readOnly}
                onChange={(e) => patch({ quantity: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="pp-amount">
                결제금액 <span className="text-[var(--color-danger)]">*</span>
              </Label>
              <Input
                id="pp-amount"
                type="number"
                min={0}
                value={form.paymentAmount}
                disabled={readOnly}
                onChange={(e) => patch({ paymentAmount: e.target.value })}
              />
            </div>

            {previewUnit != null ? (
              <p className="text-sm text-[var(--color-text-secondary)] sm:col-span-2">
                개당금액(미리보기):{" "}
                <span className="font-medium tabular-nums text-[var(--color-text-primary)]">
                  {formatAmount(previewUnit)}원
                </span>
              </p>
            ) : null}

            <div className="space-y-2 sm:col-span-2">
              <Label>상품 이미지 (선택)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleImageChange}
              />
              {displayImageUrl ? (
                <div
                  className={cn(
                    "relative size-24 shrink-0 overflow-hidden rounded-lg",
                    "border border-[var(--color-border)] bg-[var(--color-bg)]",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayImageUrl}
                    alt="상품 미리보기"
                    className="size-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    disabled={readOnly}
                    className={cn(
                      "absolute top-1 right-1 flex size-6 items-center justify-center",
                      "rounded-full border border-[var(--color-border)] bg-white/95 shadow-sm",
                      "text-[var(--color-text-secondary)] transition-colors",
                      "hover:bg-white hover:text-[var(--color-text-primary)]",
                      readOnly && "hidden",
                    )}
                    aria-label="이미지 삭제"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ) : readOnly ? (
                <div
                  className={cn(
                    "flex size-24 shrink-0 items-center justify-center rounded-lg",
                    "border border-dashed border-[var(--color-border)]",
                    "bg-[var(--color-bg)] text-xs text-[var(--color-text-muted)]",
                  )}
                >
                  없음
                </div>
              ) : (
                <button
                  type="button"
                  onClick={openImagePicker}
                  className={cn(
                    "flex size-24 shrink-0 items-center justify-center rounded-lg",
                    "border border-dashed border-[var(--color-border)]",
                    "bg-[var(--color-bg)] text-[var(--color-text-muted)]",
                    "transition-colors hover:border-[var(--color-text-muted)]",
                    "hover:text-[var(--color-text-secondary)]",
                  )}
                  aria-label="이미지 업로드"
                >
                  <Plus className="size-7 stroke-[1.5]" />
                </button>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="pp-memo">비고</Label>
              <Textarea
                id="pp-memo"
                rows={4}
                value={form.memo}
                disabled={readOnly}
                onChange={(e) => patch({ memo: e.target.value })}
                placeholder="메모, 특이사항 등"
                className="min-h-[6.5rem] resize-y"
              />
            </div>
          </div>
        </div>

        <DialogFooter
          className={cn(
            REGISTER_MODAL_FOOTER_CLASS,
            isEdit && onDelete && "sm:justify-between",
          )}
        >
          {isEdit && onDelete && !readOnly ? (
            <Button
              type="button"
              variant="outline"
              className="border-[var(--color-danger)]/40 text-[var(--color-danger)] hover:bg-red-50"
              onClick={() => void handleDelete()}
            >
              삭제
            </Button>
          ) : (
            <span />
          )}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="outline" disabled={submitting} onClick={() => onOpenChange(false)}>
              {readOnly ? "닫기" : "취소"}
            </Button>
            {!readOnly && isEdit ? (
              <Button type="button" disabled={submitting} onClick={() => void submit(true)}>
                {submitting ? "저장 중…" : "저장"}
              </Button>
            ) : !readOnly ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={submitting}
                  onClick={() => void submit(false)}
                >
                  {submitting ? "저장 중…" : "저장 후 계속 추가"}
                </Button>
                <Button type="button" disabled={submitting} onClick={() => void submit(true)}>
                  {submitting ? "저장 중…" : "저장하고 닫기"}
                </Button>
              </>
            ) : null}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
