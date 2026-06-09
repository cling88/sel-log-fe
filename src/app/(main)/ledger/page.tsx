import { Suspense } from "react";
import { LedgerHeader } from "@/components/ledger/ledger-header";
import { LedgerTabContent } from "@/components/ledger/ledger-tab-content";

/** 쿼리(tab·month 등) 기반 UI — 정적 프리렌더 시 프로덕션에서 searchParams 갱신이 끊길 수 있음 */
export const dynamic = "force-dynamic";

function LedgerSuspenseFallback() {
  return (
    <div className="text-sm text-[var(--color-text-muted)]">로딩 중...</div>
  );
}

export default function LedgerPage() {
  return (
    <div className="flex flex-col gap-6 pb-[150px]">
      <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
        장부
      </h1>
      <div className="flex flex-col gap-4">
        <Suspense fallback={<LedgerSuspenseFallback />}>
          <div className="relative z-20 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-md)]">
            <LedgerHeader />
          </div>
        </Suspense>
        <Suspense fallback={<LedgerSuspenseFallback />}>
          <LedgerTabContent />
        </Suspense>
      </div>
    </div>
  );
}
