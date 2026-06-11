"use client";

import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProductImageFieldProps {
  displayUrl: string;
  disabled?: boolean;
  uploading?: boolean;
  error?: string | null;
  onOpenUpload: () => void;
  onClear: () => void;
}

export function ProductImageField({
  displayUrl,
  disabled = false,
  uploading = false,
  error = null,
  onOpenUpload,
  onClear,
}: ProductImageFieldProps) {
  return (
    <div className="space-y-2">
      {uploading ? (
        <div className="flex size-24 shrink-0 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] text-xs text-[var(--color-text-muted)]">
          업로드 중...
        </div>
      ) : displayUrl ? (
        <div
          className={cn(
            "relative size-24 shrink-0 overflow-hidden rounded-lg",
            "border border-[var(--color-border)] bg-[var(--color-bg)]",
          )}
        >
          <button
            type="button"
            onClick={onOpenUpload}
            disabled={disabled}
            className={cn(
              "block size-full transition-opacity hover:opacity-90",
              "disabled:cursor-not-allowed disabled:opacity-60",
            )}
            aria-label="이미지 변경"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayUrl}
              alt="상품 미리보기"
              className="size-full object-cover"
            />
          </button>
          {!disabled ? (
            <button
              type="button"
              onClick={onClear}
              className={cn(
                "absolute top-1 right-1 flex size-6 items-center justify-center",
                "rounded-full border border-[var(--color-border)] bg-white/95 shadow-sm",
                "text-[var(--color-text-secondary)] transition-colors",
                "hover:bg-white hover:text-[var(--color-text-primary)]",
              )}
              aria-label="이미지 삭제"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>
      ) : disabled ? (
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
          onClick={onOpenUpload}
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

      {error && (
        <p className="text-xs text-[var(--color-danger)]">{error}</p>
      )}
    </div>
  );
}
