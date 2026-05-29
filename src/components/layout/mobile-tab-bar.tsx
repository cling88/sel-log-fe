"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/ledger", label: "장부" },
  { href: "/settings", label: "설정" },
] as const;

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex h-16 border-t border-[var(--color-border)] bg-white md:hidden">
      {tabs.map((tab) => {
        const active =
          pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-1 flex-col items-center justify-center text-xs font-medium",
              active
                ? "text-[var(--primary-500)]"
                : "text-[var(--color-text-muted)]",
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
