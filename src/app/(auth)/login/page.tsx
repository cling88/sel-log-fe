"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginDevBypass } from "@/lib/auth";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/dashboard";

  const handleLogin = () => {
    loginDevBypass();
    router.replace(from.startsWith("/") ? from : "/dashboard");
  };

  return (
    <div className="mt-8 flex max-w-[400px] flex-col gap-4">
      <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        개발 중: 로그인 버튼만 누르면 메인으로 이동합니다. (BE 연동 후 실제 인증으로
        교체 예정)
      </p>

      <button
        type="button"
        onClick={handleLogin}
        className="flex h-10 items-center justify-center rounded-lg bg-[var(--primary-500)] text-sm font-medium text-white transition-colors hover:bg-[var(--primary-600)]"
      >
        로그인
      </button>
    </div>
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
        <Suspense>
          <LoginForm />
        </Suspense>
      </section>
    </div>
  );
}
