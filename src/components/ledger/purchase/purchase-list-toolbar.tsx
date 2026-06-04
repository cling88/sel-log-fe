"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PurchaseListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  showExcelActions?: boolean;
  registerLabel?: string;
  onRegister?: () => void;
  /** 목록 카드 상단에 붙일 때 true */
  embedded?: boolean;
}

export function PurchaseListToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "그룹명, 항목명, 구매처 검색",
  showExcelActions = false,
  registerLabel,
  onRegister,
  embedded = false,
}: PurchaseListToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:gap-3",
        embedded
          ? "border-b border-[var(--color-border)] bg-[var(--color-bg-card)]"
          : "rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-sm)]",
      )}
    >
      <Input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        className="h-9 min-w-0 w-full flex-1 border-[var(--color-border)] bg-white shadow-none"
      />
      <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto sm:shrink-0 sm:justify-end">
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
