"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MODAL_DIALOG_FOOTER_CLASS } from "@/components/common/modal-footer-classes";
import { SourcingExternalLink } from "@/components/sourcing/sourcing-external-link";
import { SourcingFavoriteToggle } from "@/components/sourcing/sourcing-favorite-toggle";
import { formatAmount } from "@/lib/purchase-product-calc";
import { cn } from "@/lib/utils";
import type { SourcingProduct } from "@/types/sourcing";

function formatRegisteredAt(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString("ko-KR");
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[88px_1fr] sm:gap-3">
      <dt className="text-xs text-[var(--color-text-muted)]">{label}</dt>
      <dd className="min-w-0 text-sm text-[var(--color-text-primary)]">
        {children}
      </dd>
    </div>
  );
}

interface SourcingProductDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: SourcingProduct | null;
  isFavorite?: boolean;
  favoriteLoading?: boolean;
  onToggleFavorite?: () => void | Promise<void>;
  onEdit: (product: SourcingProduct) => void;
  onDelete: (product: SourcingProduct) => void;
}

export function SourcingProductDetailDialog({
  open,
  onOpenChange,
  product,
  isFavorite = false,
  favoriteLoading = false,
  onToggleFavorite,
  onEdit,
  onDelete,
}: SourcingProductDetailDialogProps) {
  if (!product) return null;

  const hasPrice = product.totalPrice > 0 || product.unitPrice > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="border-b border-[var(--color-border)] px-5 py-4">
          <DialogTitle>제품소싱 상세</DialogTitle>
        </DialogHeader>

        <div className="max-h-[min(70vh,520px)] overflow-y-auto px-5 py-4">
          <div className="flex gap-4">
            <div className="size-24 shrink-0 overflow-hidden rounded-lg bg-[var(--color-bg)]">
              {product.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.imageUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center px-2 text-center text-xs text-[var(--color-text-muted)]">
                  이미지 없음
                </div>
              )}
            </div>

            <dl className="min-w-0 flex-1 space-y-3">
              <DetailRow label="소싱 채널">
                {product.channel?.name ?? "—"}
              </DetailRow>
              <DetailRow label="상품명">
                <span className="break-words font-medium">{product.name}</span>
              </DetailRow>
            </dl>
          </div>

          <dl className="mt-4 space-y-3 border-t border-[var(--color-border)] pt-4">
            <DetailRow label="최소주문수량">
              {product.quantity > 0 ? `${product.quantity}개` : "—"}
            </DetailRow>
            <DetailRow label="총 금액">
              {hasPrice ? (
                <span className="tabular-nums">
                  {formatAmount(product.totalPrice)}원
                </span>
              ) : (
                "—"
              )}
            </DetailRow>
            <DetailRow label="개별 단가">
              {hasPrice ? (
                <span className="tabular-nums">
                  {formatAmount(product.unitPrice)}원
                </span>
              ) : (
                "—"
              )}
            </DetailRow>
            <DetailRow label="상품 URL">
              {product.productUrl ? (
                <SourcingExternalLink href={product.productUrl} />
              ) : (
                "—"
              )}
            </DetailRow>
            <DetailRow label="메모">
              {product.memo ? (
                <p className="whitespace-pre-wrap break-words">{product.memo}</p>
              ) : (
                "—"
              )}
            </DetailRow>
            <DetailRow label="등록일">
              {formatRegisteredAt(product.createdAtIso)}
            </DetailRow>
          </dl>
        </div>

        <DialogFooter
          className={cn(
            MODAL_DIALOG_FOOTER_CLASS,
            "!flex-row flex-wrap items-center justify-between gap-2",
          )}
        >
          {onToggleFavorite ? (
            <SourcingFavoriteToggle
              active={isFavorite}
              loading={favoriteLoading}
              label={product.name}
              className="-ml-1"
              onToggle={onToggleFavorite}
            />
          ) : (
            <span />
          )}
          <div className="flex flex-row flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              닫기
            </Button>
            <Button
              type="button"
              variant="outline"
              className="text-[var(--color-danger)]"
              onClick={() => {
                onOpenChange(false);
                onDelete(product);
              }}
            >
              삭제
            </Button>
            <Button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onEdit(product);
              }}
            >
              수정
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
