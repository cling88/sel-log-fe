"use client";

import { useState } from "react";
import { IncomeDepositLineList } from "@/components/ledger/income/income-deposit-line-list";
import {
  purchaseGroupBodyClass,
  purchaseGroupCardClass,
  purchaseGroupHeaderClass,
} from "@/components/ledger/purchase/purchase-ui";
import { formatDisplayDate } from "@/lib/date";
import { formatWon } from "@/lib/utils";
import type { IncomeDepositLine } from "@/types/income";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface IncomeDepositGroupListProps {
  groups: { depositDate: string; lines: IncomeDepositLine[] }[];
  onLineClick: (lineId: string) => void;
}

export function IncomeDepositGroupList({
  groups,
  onLineClick,
}: IncomeDepositGroupListProps) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(
    () => new Set(groups.map((g) => g.depositDate)),
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
        const expanded = expandedDates.has(group.depositDate);
        const totalAmount = group.lines.reduce((sum, line) => sum + line.amount, 0);

        return (
          <div key={group.depositDate} className={purchaseGroupCardClass()}>
            <button
              type="button"
              onClick={() => toggle(group.depositDate)}
              className={cn(purchaseGroupHeaderClass, "w-full justify-between")}
            >
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[var(--color-income)]",
                    expanded && "bg-emerald-100",
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
                    {formatDisplayDate(group.depositDate)}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {group.lines.length}건
                  </p>
                </div>
              </div>
              <p className="shrink-0 text-base font-semibold tabular-nums tracking-tight text-[var(--color-income)]">
                +{formatWon(totalAmount)}
              </p>
            </button>

            {expanded ? (
              <div className={purchaseGroupBodyClass}>
                <IncomeDepositLineList lines={group.lines} onLineClick={onLineClick} />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
