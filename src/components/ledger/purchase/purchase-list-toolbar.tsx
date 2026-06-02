"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface PurchaseListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  showExcelActions?: boolean;
  registerLabel?: string;
  onRegister?: () => void;
}

export function PurchaseListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "그룹명, 항목명, 구매처 검색",
  showExcelActions = false,
  registerLabel,
  onRegister,
}: PurchaseListToolbarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 shadow-[var(--shadow-sm)] sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <Input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        className="h-9 min-w-0 w-full border-[var(--color-border)] bg-white shadow-none sm:max-w-md sm:flex-none"
      />
      <div className="flex min-w-0 w-full flex-1 flex-wrap items-center gap-2 sm:w-auto">
        {showExcelActions ? (
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              title="퍼블"
              className="h-8 border-[var(--color-border)] bg-white text-xs shadow-none"
            >
              샘플다운로드
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              title="퍼블"
              className="h-8 border-[var(--color-border)] bg-white text-xs shadow-none"
            >
              엑셀업로드
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled
              title="퍼블"
              className="h-8 border-[var(--color-border)] bg-white text-xs shadow-none"
            >
              엑셀다운로드
            </Button>
          </div>
        ) : null}
        {registerLabel && onRegister ? (
          <Button
            type="button"
            className="ml-auto h-9 shrink-0"
            onClick={onRegister}
          >
            {registerLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
