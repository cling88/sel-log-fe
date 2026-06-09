import { formatAmount } from "@/lib/purchase-product-calc";
import { showAmended } from "@/lib/amended-amount";
import { cn } from "@/lib/utils";

interface AmendedAmountProps {
  current: number;
  previous?: number | null;
  suffix?: string;
  className?: string;
  currentClassName?: string;
  previousClassName?: string;
}

/** ~~이전금액~~ 신규금액 (BE previous* 필드) */
export function AmendedAmount({
  current,
  previous,
  suffix = "원",
  className,
  currentClassName,
  previousClassName,
}: AmendedAmountProps) {
  if (!showAmended(previous, current)) {
    return (
      <span className={cn("tabular-nums", currentClassName, className)}>
        {formatAmount(current)}
        {suffix}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center justify-end gap-1 tabular-nums",
        className,
      )}
    >
      <s
        className={cn(
          "text-[var(--color-text-muted)] decoration-[var(--color-text-muted)]",
          previousClassName,
        )}
      >
        {formatAmount(previous!)}
        {suffix}
      </s>
      <span className={currentClassName}>
        {formatAmount(current)}
        {suffix}
      </span>
    </span>
  );
}
