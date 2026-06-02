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
  const showActions = showExcelActions || (registerLabel && onRegister);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] px-4 py-3 shadow-[var(--shadow-sm)] sm:flex-row sm:items-center sm:gap-3">
      <Input
        type="search"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder={searchPlaceholder}
        className="h-9 min-w-0 flex-1 border-[var(--color-border)] bg-white shadow-none sm:max-w-md"
      />
      {showActions ? (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {showExcelActions ? (
            <>
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
            </>
          ) : null}
          {registerLabel && onRegister ? (
            <Button type="button" className="h-9 shrink-0" onClick={onRegister}>
              {registerLabel}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
