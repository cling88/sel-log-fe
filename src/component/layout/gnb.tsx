import Link from "next/link";

const navItems = [
  { href: "/dashboard", label: "대시보드" },
  { href: "/ledger?tab=purchase", label: "장부" },
  { href: "/products", label: "상품관리" },
  { href: "/settings", label: "설정" },
] as const;

export function Gnb() {
  return (
    <header className="sticky top-0 z-50 h-[60px] border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-full max-w-[1280px] items-center justify-between px-4 md:px-6">
        <Link href="/dashboard" className="text-lg font-semibold text-zinc-900">
          sel-log
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          className="hidden text-sm text-zinc-500 hover:text-zinc-900 md:block"
        >
          로그아웃
        </button>
      </div>
    </header>
  );
}
