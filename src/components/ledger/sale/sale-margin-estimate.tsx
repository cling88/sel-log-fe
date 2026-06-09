"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatAmount } from "@/lib/purchase-product-calc";
import type { SaleMarginEstimate } from "@/types/sale";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

function formatSignedProfit(value: number): string {
  if (value > 0) return `+${formatAmount(value)}원`;
  return `${formatAmount(value)}원`;
}

function profitColorClass(value: number): string {
  if (value > 0) return "text-emerald-700";
  if (value < 0) return "text-[var(--color-danger)]";
  return "text-[var(--color-text-secondary)]";
}

interface SaleMarginEstimateDisplayProps {
  margin: SaleMarginEstimate | null | undefined;
  loading?: boolean;
  className?: string;
}

export function SaleMarginEstimateDisplay({
  margin,
  loading = false,
  className,
}: SaleMarginEstimateDisplayProps) {
  if (loading) {
    return (
      <p
        className={cn(
          "text-[11px] text-[var(--color-text-muted)]",
          className,
        )}
      >
        추정 순익 계산 중…
      </p>
    );
  }

  if (!margin) return null;

  const gross = margin.estimatedGrossProfit;
  const net = margin.estimatedNetProfit;
  const tooltipLines = [
    margin.assumptions?.vatNote,
    margin.assumptions?.platformFeeNote,
  ].filter(Boolean);
  const tooltipText =
    tooltipLines.length > 0
      ? tooltipLines.join("\n")
      : "부가세·수수료 반영";

  return (
    <div
      className={cn(
        "border-t border-[var(--color-border)]/80 pt-2 text-xs tabular-nums",
        className,
      )}
    >
      <div className="flex flex-wrap items-center gap-1">
        <span className="text-[var(--color-text-secondary)]">추정 순수익</span>
        <span className={cn("font-semibold", profitColorClass(gross))}>
          {formatSignedProfit(gross)}
        </span>
        <span className={cn("font-medium", profitColorClass(net))}>
          ({formatSignedProfit(net)})
        </span>
        <Tooltip>
          <TooltipTrigger
            delay={200}
            render={
              <button
                type="button"
                className="inline-flex size-4 items-center justify-center rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                aria-label="부가세·수수료 반영 안내"
              >
                <Info className="size-3" />
              </button>
            }
          />
          <TooltipContent side="top" className="max-w-xs whitespace-pre-line">
            {tooltipText}
          </TooltipContent>
        </Tooltip>
      </div>
      {margin.hasUnknownCost ? (
        <p className="mt-0.5 text-[10px] font-medium text-amber-700">
          ※ 일부 품목 원가 미확인
        </p>
      ) : null}
    </div>
  );
}
