import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <section className="hidden flex-1 flex-col justify-center bg-[var(--primary-900)] px-10 py-12 text-[var(--color-text-inverse)] md:flex">
        <p className="text-2xl font-semibold">Sellog</p>
        <p className="mt-6 text-lg font-medium">셀러를 위한</p>
        <p className="text-lg font-medium">스마트한 장부</p>
      </section>
      <section className="flex flex-1 flex-col justify-center px-6 py-12">
        <p className="text-xl font-semibold text-[var(--color-text-primary)] md:hidden">
          Sellog
        </p>
        <h1 className="mt-4 text-2xl font-semibold text-[var(--color-text-primary)] md:mt-0">
          로그인
        </h1>
        <form className="mt-8 flex max-w-[400px] flex-col gap-4">
          <label className="block text-sm">
            <span className="text-[var(--color-text-secondary)]">이메일</span>
            <input
              type="email"
              className="mt-1 h-10 w-full rounded-lg border border-[var(--color-border)] px-3 outline-none focus:ring-2 focus:ring-[var(--primary-300)]"
            />
          </label>
          <label className="block text-sm">
            <span className="text-[var(--color-text-secondary)]">비밀번호</span>
            <input
              type="password"
              className="mt-1 h-10 w-full rounded-lg border border-[var(--color-border)] px-3 outline-none focus:ring-2 focus:ring-[var(--primary-300)]"
            />
          </label>
          <Link
            href="/dashboard"
            className="mt-2 flex h-10 items-center justify-center rounded-lg bg-[var(--primary-500)] text-sm font-medium text-white hover:bg-[var(--primary-600)]"
          >
            로그인
          </Link>
        </form>
      </section>
    </div>
  );
}
