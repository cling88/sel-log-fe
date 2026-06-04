"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth";

const navItems = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/ledger", label: "장부" },
  { href: "/settings", label: "설정" },
] as const;

export function Gnb() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 hidden border-b border-[var(--color-border-dark)] bg-[var(--primary-900)] md:block">
      <div className="mx-auto flex h-[60px] max-w-[1400px] items-center justify-between px-4 lg:px-8">
        <Link
          href="/dashboard"
          className="text-lg font-semibold text-[var(--color-text-inverse)]"
        >
          Sellog
        </Link>
        <nav className="flex items-center gap-6">
          {navItems.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors",
                  active
                    ? "text-white"
                    : "text-white/70 hover:text-white",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={logout}
          className="text-sm text-white/70 transition-colors hover:text-white"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
