import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface LedgerListShellProps {
  children: ReactNode;
  className?: string;
}

/** 검색 툴바 + 목록을 하나의 카드로 묶을 때 사용 */
export function LedgerListShell({ children, className }: LedgerListShellProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] shadow-[var(--shadow-sm)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export const ledgerListBodyClass = "space-y-3 p-3 sm:p-4";

export const ledgerListFooterClass =
  "border-t border-[var(--color-border)] px-4 py-2";
