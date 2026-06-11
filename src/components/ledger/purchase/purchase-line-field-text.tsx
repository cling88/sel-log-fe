import { cn } from "@/lib/utils";

export const PURCHASE_LINE_FIELD_TEXT_DESKTOP_MAX = 30;

export function truncatePurchaseLineFieldTextDesktop(
  text: string,
  max = PURCHASE_LINE_FIELD_TEXT_DESKTOP_MAX,
): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}...`;
}

interface PurchaseLineFieldTextProps {
  text: string;
  empty?: string;
  className?: string;
}

export function PurchaseLineFieldTextDesktop({
  text,
  empty = "—",
  className,
}: PurchaseLineFieldTextProps) {
  const raw = text.trim();
  if (!raw) {
    return (
      <span className={cn("text-[var(--color-text-muted)]", className)}>
        {empty}
      </span>
    );
  }

  const display = truncatePurchaseLineFieldTextDesktop(raw);
  return (
    <span className={cn("block min-w-0 w-full truncate", className)} title={raw}>
      {display}
    </span>
  );
}

export function PurchaseLineFieldTextMobile({
  text,
  empty = "—",
  className,
}: PurchaseLineFieldTextProps) {
  const raw = text.trim();
  if (!raw) {
    return (
      <span className={cn("text-[var(--color-text-muted)]", className)}>
        {empty}
      </span>
    );
  }

  return (
    <span className={cn("line-clamp-2 break-words", className)} title={raw}>
      {raw}
    </span>
  );
}

/** 모바일 카드 — 2줄 말줄임이 필요한 행(항목명·비고 등) */
export function isPurchaseLineMultilineMobileLabel(label: string): boolean {
  return label === "항목명" || label === "비고";
}
