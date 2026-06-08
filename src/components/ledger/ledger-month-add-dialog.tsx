"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTodayYearMonth, toYearMonthParam } from "@/lib/ledger-period";

interface LedgerMonthAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  existingValues: ReadonlySet<string>;
  onAdd: (value: string) => void;
}

export function LedgerMonthAddDialog({
  open,
  onOpenChange,
  year,
  existingValues,
  onAdd,
}: LedgerMonthAddDialogProps) {
  const { year: currentYear, month: currentMonth } = getTodayYearMonth();
  const maxMonth = year === currentYear ? currentMonth : 12;

  const availableMonths = useMemo(() => {
    const months: number[] = [];
    for (let month = 1; month <= maxMonth; month += 1) {
      const value = toYearMonthParam(year, month);
      if (!existingValues.has(value)) months.push(month);
    }
    return months;
  }, [year, maxMonth, existingValues]);

  const [month, setMonth] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setMonth(availableMonths[0] != null ? String(availableMonths[0]) : "");
  }, [open, availableMonths]);

  const handleAdd = () => {
    const parsed = Number(month);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > maxMonth) return;
    const value = toYearMonthParam(year, parsed);
    if (existingValues.has(value)) return;
    onAdd(value);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>월 탭 추가</DialogTitle>
          <DialogDescription>
            {year}년에 표시할 월을 선택하세요. 해당 월에 데이터를 등록하면 목록에
            나타납니다.
          </DialogDescription>
        </DialogHeader>

        {availableMonths.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">
            추가할 수 있는 월이 없습니다.
          </p>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="ledger-add-month">월</Label>
            <Select
              value={month}
              onValueChange={(value) => setMonth(value ?? "")}
            >
              <SelectTrigger id="ledger-add-month" className="w-full">
                <SelectValue placeholder="월 선택" />
              </SelectTrigger>
              <SelectContent>
                {availableMonths.map((m) => (
                  <SelectItem key={m} value={String(m)}>
                    {m}월
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button
            type="button"
            disabled={availableMonths.length === 0 || !month}
            onClick={handleAdd}
          >
            추가
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
