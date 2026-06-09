"use client";

import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PurchaseListToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  /** true: Enter·검색 버튼으로만 onSearchSubmit 호출 */
  searchSubmitMode?: boolean;
  onSearchSubmit?: () => void;
  /** type=search X(지우기) 클릭 시 — 전체 목록 등 빈 검색 조회 */
  onSearchClear?: () => void;
  searchPlaceholder?: string;
  registerLabel?: string;
  onRegister?: () => void;
  /** 목록 카드 상단에 붙일 때 true */
  embedded?: boolean;
}

export function PurchaseListToolbar({
  search,
  onSearchChange,
  searchSubmitMode = false,
  onSearchSubmit,
  onSearchClear,
  searchPlaceholder = "그룹명, 항목명, 구매처 검색",
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
      <div
        className={cn(
          "flex h-9 min-w-0 w-full flex-1 items-stretch overflow-hidden rounded-lg border border-[var(--color-border)] bg-white",
          "focus-within:border-[var(--primary-400)] focus-within:ring-3 focus-within:ring-[var(--primary-200)]/60",
        )}
      >
        <Input
          type="search"
          value={search}
          onChange={(e) => {
            const value = e.target.value;
            onSearchChange(value);
            if (searchSubmitMode && value === "" && onSearchClear) {
              onSearchClear();
            }
          }}
          onKeyDown={(e) => {
            if (!searchSubmitMode || !onSearchSubmit) return;
            if (e.key === "Enter") {
              e.preventDefault();
              onSearchSubmit();
            }
          }}
          placeholder={searchPlaceholder}
          className={cn(
            "h-full min-w-0 flex-1 rounded-none border-0 bg-transparent px-2.5 shadow-none",
            "focus-visible:border-0 focus-visible:ring-0",
            searchSubmitMode && onSearchSubmit ? "pr-1" : undefined,
          )}
        />
        {searchSubmitMode && onSearchSubmit ? (
          <button
            type="button"
            className="flex size-9 shrink-0 items-center justify-center border-0 bg-transparent text-[var(--color-text-muted)] transition-colors hover:bg-[var(--primary-50)] hover:text-[var(--primary-600)]"
            aria-label="검색"
            onClick={onSearchSubmit}
          >
            <Search className="size-4" />
          </button>
        ) : null}
      </div>
      <div className="flex w-full flex-wrap items-center gap-2 sm:ml-auto sm:w-auto sm:shrink-0 sm:justify-end">
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
