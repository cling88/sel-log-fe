import { Suspense } from "react";
import { LedgerHeader } from "@/components/ledger/ledger-header";
import { LedgerTabContent } from "@/components/ledger/ledger-tab-content";

export default function LedgerPage() {
  return (
    <div className="flex flex-col gap-6 pb-[150px]">
      <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
        장부
      </h1>
      <Suspense fallback={<div className="text-sm text-[var(--color-text-muted)]">로딩 중...</div>}>
        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-[var(--shadow-md)]">
            <LedgerHeader />
          </div>
          <LedgerTabContent />
        </div>
      </Suspense>
    </div>
  );
}
