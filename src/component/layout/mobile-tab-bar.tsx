"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/dashboard", label: "대시보드", match: (p: string) => p === "/dashboard" },
  {
    href: "/ledger?tab=purchase",
    label: "장부",
    match: (p: string) => p.startsWith("/ledger") || p.startsWith("/purchases"),
  },
  { href: "/products", label: "상품", match: (p: string) => p.startsWith("/products") },
  { href: "/settings", label: "설정", match: (p: string) => p === "/settings" },
] as const;

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-black/15 bg-white md:hidden">
      <ul className="flex h-14">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={`flex h-full items-center justify-center text-xs font-medium ${
                  active ? "text-black" : "text-black/50"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
