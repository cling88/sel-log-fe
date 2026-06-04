"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/lib/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/dashboard";

  const emailRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    setError(null);
    setLoading(true);

    const result = await login(trimmedEmail, password);

    if (!result.ok) {
      setError(result.message);
      setLoading(false);
      return;
    }

    router.replace(from.startsWith("/") ? from : "/dashboard");
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="mt-8 flex max-w-[400px] flex-col gap-4"
    >
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <label className="block text-sm">
        <span className="text-[var(--color-text-secondary)]">이메일</span>
        <input
          ref={emailRef}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="mt-1 h-10 w-full rounded-lg border border-[var(--color-border)] px-3 outline-none transition-shadow focus:ring-2 focus:ring-[var(--primary-300)] disabled:opacity-60"
        />
      </label>

      <label className="block text-sm">
        <span className="text-[var(--color-text-secondary)]">비밀번호</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          className="mt-1 h-10 w-full rounded-lg border border-[var(--color-border)] px-3 outline-none transition-shadow focus:ring-2 focus:ring-[var(--primary-300)] disabled:opacity-60"
        />
      </label>

      <button
        type="submit"
        disabled={loading}
        className="mt-2 flex h-10 items-center justify-center rounded-lg bg-[var(--primary-500)] text-sm font-medium text-white transition-colors hover:bg-[var(--primary-600)] disabled:opacity-60"
      >
        {loading ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}

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
        <Suspense fallback={<p className="mt-8 text-sm text-[var(--color-text-muted)]">로딩 중...</p>}>
          <LoginForm />
        </Suspense>
      </section>
    </div>
  );
}
