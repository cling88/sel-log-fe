"use client";

import { useState } from "react";
import { OtherExpenseLineList } from "@/components/ledger/purchase/other/other-expense-line-list";
import {
  purchaseGroupBodyClass,
  purchaseGroupCardClass,
  purchaseGroupFooterClass,
  purchaseGroupHeaderClass,
} from "@/components/ledger/purchase/purchase-ui";
import { Button } from "@/components/ui/button";
import { formatDisplayDate } from "@/lib/date";
import { formatWon } from "@/lib/utils";
import type { OtherExpenseLine } from "@/types/purchase-other";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface OtherExpenseGroupListProps {
  groups: { paymentDate: string; lines: OtherExpenseLine[] }[];
  onAddToGroup: (paymentDate: string) => void;
  onLineClick: (lineId: string) => void;
}

export function OtherExpenseGroupList({
  groups,
  onAddToGroup,
  onLineClick,
}: OtherExpenseGroupListProps) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(
    () => new Set(groups.map((g) => g.paymentDate)),
  );

  const toggle = (date: string) => {
    setExpandedDates((prev) => {
      const next = new Set(prev);
      if (next.has(date)) next.delete(date);
      else next.add(date);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {groups.map((group) => {
        const expanded = expandedDates.has(group.paymentDate);
        const totalPayment = group.lines.reduce(
          (sum, line) => sum + line.paymentAmount,
          0,
        );

        return (
          <div key={group.paymentDate} className={purchaseGroupCardClass()}>
            <button
              type="button"
              onClick={() => toggle(group.paymentDate)}
              className={cn(
                purchaseGroupHeaderClass,
                "w-full justify-between",
              )}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary-50)] text-[var(--primary-600)]",
                    expanded && "bg-[var(--primary-100)]",
                  )}
                >
                  <ChevronDown
                    className={cn(
                      "size-4 transition-transform duration-200",
                      expanded && "rotate-180",
                    )}
                  />
                </span>
                <div className="min-w-0 text-left">
                  <p className="font-semibold text-[var(--color-text-primary)]">
                    {formatDisplayDate(group.paymentDate)}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {group.lines.length}건
                  </p>
                </div>
              </div>
              <p className="shrink-0 text-base font-semibold tabular-nums tracking-tight text-[var(--color-expense)]">
                -{formatWon(totalPayment)}
              </p>
            </button>

            {expanded ? (
              <div className={purchaseGroupBodyClass}>
                <OtherExpenseLineList
                  lines={group.lines}
                  onLineClick={onLineClick}
                />
                <div className={purchaseGroupFooterClass}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 border-[var(--color-border)] bg-white text-xs shadow-none hover:bg-[var(--primary-50)]/40"
                    onClick={() => onAddToGroup(group.paymentDate)}
                  >
                    + 내역 추가
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
