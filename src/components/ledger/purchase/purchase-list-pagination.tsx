"use client";

import { Button } from "@/components/ui/button";

interface PurchaseListPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PurchaseListPagination({
  page,
  totalPages,
  onPageChange,
}: PurchaseListPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 py-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        이전
      </Button>
      <span className="text-sm tabular-nums text-[var(--color-text-secondary)]">
        {page} / {totalPages}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        다음
      </Button>
    </div>
  );
}
