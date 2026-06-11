"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listYearOptions } from "@/lib/ledger-period";
import { cn } from "@/lib/utils";

interface LedgerYearSelectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  yearOptions?: number[];
  onSelectYear: (year: number) => void;
}

export function LedgerYearSelectDialog({
  open,
  onOpenChange,
  year,
  yearOptions: yearOptionsProp,
  onSelectYear,
}: LedgerYearSelectDialogProps) {
  const yearOptions = yearOptionsProp ?? listYearOptions();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>년도 선택</DialogTitle>
          <DialogDescription>조회할 년도를 선택하세요.</DialogDescription>
        </DialogHeader>
        <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto py-1">
          {yearOptions.map((optionYear) => {
            const selected = optionYear === year;
            return (
              <button
                key={optionYear}
                type="button"
                className={cn(
                  "rounded-md border px-2 py-2 text-sm tabular-nums transition-colors",
                  selected
                    ? "border-[var(--primary-500)] bg-[var(--primary-50)] font-semibold text-[var(--primary-600)]"
                    : "border-[var(--color-border)] bg-white hover:bg-[var(--primary-50)]/40",
                )}
                onClick={() => {
                  onSelectYear(optionYear);
                  onOpenChange(false);
                }}
              >
                {optionYear}년
              </button>
            );
          })}
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            닫기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
