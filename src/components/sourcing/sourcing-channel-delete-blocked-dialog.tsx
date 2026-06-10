"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MODAL_DIALOG_FOOTER_CLASS } from "@/components/common/modal-footer-classes";
import { formatSourcingProductPriceLine } from "@/lib/sourcing-format";
import type { SourcingProduct } from "@/types/sourcing";

interface SourcingChannelDeleteBlockedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  channelName: string;
  products: SourcingProduct[];
}

export function SourcingChannelDeleteBlockedDialog({
  open,
  onOpenChange,
  channelName,
  products,
}: SourcingChannelDeleteBlockedDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b border-[var(--color-border)] px-5 py-4">
          <DialogTitle>채널을 삭제할 수 없습니다</DialogTitle>
          <DialogDescription className="leading-relaxed">
            「{channelName}」에 연결된 제품소싱 {products.length}건이 있습니다.
            아래 상품을 모두 삭제하거나 다른 채널로 변경한 뒤 다시 시도해
            주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[min(50vh,280px)] overflow-y-auto px-5 py-4">
          <ul className="space-y-2">
            {products.map((product) => (
              <li
                key={product.id}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)]/50 px-3 py-2"
              >
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {product.name}
                </p>
                <p className="mt-0.5 text-xs tabular-nums text-[var(--color-text-secondary)]">
                  {formatSourcingProductPriceLine(product)}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <DialogFooter className={MODAL_DIALOG_FOOTER_CLASS}>
          <Button type="button" onClick={() => onOpenChange(false)}>
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
