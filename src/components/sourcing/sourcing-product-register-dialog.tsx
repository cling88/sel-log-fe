"use client";

import { useEffect, useRef, useState } from "react";
import { ImageUploadModal } from "@/components/common/image-upload-modal";
import { ProductImageField } from "@/components/common/product-image-field";
import { SourcingChannelSelectField } from "@/components/sourcing/sourcing-channel-select-field";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import { MODAL_DIALOG_FOOTER_CLASS } from "@/components/common/modal-footer-classes";
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
import {
  deriveTotalFromUnit,
  deriveUnitFromTotal,
  formatMoneyInputValue,
  syncSourcingPriceFields,
  type MoneyField,
  type SourcingPriceEditMode,
} from "@/lib/sourcing-price-fields";
import { isHttpUrl } from "@/lib/vendor-label";
import type { SourcingProduct, SourcingProductInput } from "@/types/sourcing";

type SourcingProductForm = {
  channelId: string | null;
  name: string;
  imageUrl: string;
  productUrl: string;
  quantity: number;
  totalPrice: MoneyField;
  unitPrice: MoneyField;
  memo: string;
};

const EMPTY_FORM: SourcingProductForm = {
  channelId: null,
  name: "",
  imageUrl: "",
  productUrl: "",
  quantity: 1,
  totalPrice: "",
  unitPrice: "",
  memo: "",
};

function toMoneyField(value: number): MoneyField {
  return value > 0 ? value : "";
}

interface SourcingProductRegisterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editProduct?: SourcingProduct | null;
  saving?: boolean;
  onSave: (input: SourcingProductInput) => void | Promise<void>;
}

export function SourcingProductRegisterDialog({
  open,
  onOpenChange,
  editProduct,
  saving: savingProp = false,
  onSave,
}: SourcingProductRegisterDialogProps) {
  const { alert } = useAppDialog();
  const isEdit = !!editProduct;
  const [form, setForm] = useState<SourcingProductForm>(EMPTY_FORM);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const priceEditModeRef = useRef<SourcingPriceEditMode>("auto");
  const isBusy = savingProp || submitting;

  useEffect(() => {
    if (!open) return;
    if (editProduct) {
      setForm({
        channelId: editProduct.channelId,
        name: editProduct.name,
        imageUrl: editProduct.imageUrl ?? "",
        productUrl: editProduct.productUrl ?? "",
        quantity: editProduct.quantity,
        totalPrice: toMoneyField(editProduct.totalPrice),
        unitPrice: toMoneyField(editProduct.unitPrice),
        memo: editProduct.memo,
      });
      const { quantity, unitPrice, totalPrice } = editProduct;
      priceEditModeRef.current =
        totalPrice !== unitPrice * quantity ? "manual" : "auto";
    } else {
      setForm(EMPTY_FORM);
      priceEditModeRef.current = "auto";
    }
    setImageModalOpen(false);
  }, [open, editProduct]);

  const patch = (p: Partial<SourcingProductForm>) => {
    setForm((prev) => ({ ...prev, ...p }));
  };

  const applyPriceEdit = (
    field: "quantity" | "totalPrice" | "unitPrice",
    rawValue: number | "",
  ) => {
    setForm((prev) => {
      const { fields, mode } = syncSourcingPriceFields(
        {
          quantity: prev.quantity,
          totalPrice: prev.totalPrice,
          unitPrice: prev.unitPrice,
        },
        { field, value: rawValue },
        priceEditModeRef.current,
      );
      priceEditModeRef.current = mode;
      return { ...prev, ...fields };
    });
  };

  const submit = async () => {
    const name = form.name.trim();
    if (!name) {
      await alert("상품명을 입력해 주세요.", "오류");
      return;
    }
    const quantity = Math.max(1, Math.floor(form.quantity) || 1);
    const totalNum = form.totalPrice === "" ? 0 : form.totalPrice;
    const unitNum = form.unitPrice === "" ? 0 : form.unitPrice;

    // 한쪽만 비었을 때만 편의용 보완. 둘 다 있으면 사용자 입력 그대로 전송
    let resolvedTotal = totalNum;
    let resolvedUnit = unitNum;
    if (resolvedTotal <= 0 && resolvedUnit > 0) {
      const derived = deriveTotalFromUnit(resolvedUnit, quantity);
      resolvedTotal = derived === "" ? 0 : derived;
    } else if (resolvedUnit <= 0 && resolvedTotal > 0) {
      const derived = deriveUnitFromTotal(resolvedTotal, quantity);
      resolvedUnit = derived === "" ? 0 : derived;
    }
    const productUrl = form.productUrl?.trim() ?? "";
    if (productUrl && !isHttpUrl(productUrl)) {
      await alert("URL은 http:// 또는 https:// 로 시작해야 합니다.", "오류");
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        channelId: form.channelId ?? null,
        name,
        imageUrl: form.imageUrl?.trim() ?? "",
        productUrl,
        quantity,
        totalPrice: resolvedTotal,
        unitPrice: resolvedUnit,
        memo: form.memo?.trim() ?? "",
      });
      onOpenChange(false);
      await alert(isEdit ? "저장되었습니다." : "등록되었습니다.");
    } catch {
      // 오류 alert는 mutation onError 또는 호출측에서 처리
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(85vh,680px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-[var(--color-border)] px-5 py-4">
          <DialogTitle>{isEdit ? "제품소싱 수정" : "제품소싱 등록"}</DialogTitle>
          <DialogDescription>
            후보 상품 정보를 저장합니다. 총 금액과 개별 단가는 서로 연동되며,
            금액은 KRW 기준입니다.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid gap-4">
            <SourcingChannelSelectField
              channelId={form.channelId ?? null}
              onChannelIdChange={(id) => patch({ channelId: id })}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>
                  상품명 <span className="text-[var(--color-danger)]">*</span>
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) => patch({ name: e.target.value })}
                  placeholder="상품명"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sourcing-moq">최소주문수량</Label>
                <Input
                  id="sourcing-moq"
                  type="number"
                  min={1}
                  value={form.quantity}
                  onChange={(e) =>
                    applyPriceEdit(
                      "quantity",
                      Math.max(1, Number(e.target.value) || 1),
                    )
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sourcing-total">총 금액 (원)</Label>
                <Input
                  id="sourcing-total"
                  type="number"
                  min={0}
                  value={formatMoneyInputValue(form.totalPrice)}
                  placeholder="0"
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      applyPriceEdit("totalPrice", "");
                      return;
                    }
                    const n = Number(raw);
                    if (!Number.isFinite(n)) return;
                    applyPriceEdit("totalPrice", Math.max(0, Math.floor(n)));
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sourcing-unit">개별 단가 (원)</Label>
                <Input
                  id="sourcing-unit"
                  type="number"
                  min={0}
                  value={formatMoneyInputValue(form.unitPrice)}
                  placeholder="0"
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      applyPriceEdit("unitPrice", "");
                      return;
                    }
                    const n = Number(raw);
                    if (!Number.isFinite(n)) return;
                    applyPriceEdit("unitPrice", Math.max(0, Math.floor(n)));
                  }}
                />
              </div>

              <p className="text-xs text-[var(--color-text-muted)] sm:col-span-2">
                최소주문수량·총 금액 입력 시 개별 단가가 자동 계산됩니다. 개별
                단가를 직접 수정하면 자동 계산이 멈춥니다.
              </p>

              <div className="space-y-1.5">
                <Label htmlFor="sourcing-url">상품 URL</Label>
                <Input
                  id="sourcing-url"
                  value={form.productUrl ?? ""}
                  onChange={(e) => patch({ productUrl: e.target.value })}
                  placeholder="https://"
                />
              </div>

              <div className="space-y-1.5">
                <Label>상품 이미지</Label>
                <ProductImageField
                  displayUrl={form.imageUrl ?? ""}
                  onOpenUpload={() => setImageModalOpen(true)}
                  onClear={() => patch({ imageUrl: "" })}
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="sourcing-memo">메모</Label>
                <Textarea
                  id="sourcing-memo"
                  rows={3}
                  value={form.memo ?? ""}
                  onChange={(e) => patch({ memo: e.target.value })}
                  placeholder="배송비, 환율 참고 등"
                  className="resize-y"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className={MODAL_DIALOG_FOOTER_CLASS}>
          <Button
            type="button"
            variant="outline"
            disabled={isBusy}
            onClick={() => onOpenChange(false)}
          >
            취소
          </Button>
          <Button type="button" disabled={isBusy} onClick={() => void submit()}>
            {isBusy ? "저장 중..." : isEdit ? "저장" : "등록"}
          </Button>
        </DialogFooter>
      </DialogContent>

      <ImageUploadModal
        open={imageModalOpen}
        onOpenChange={setImageModalOpen}
        initialImageUrl={form.imageUrl ?? ""}
        confirmMode="immediate"
        onComplete={(result) => {
          if (result.type === "url") patch({ imageUrl: result.url });
        }}
      />
    </Dialog>
  );
}
