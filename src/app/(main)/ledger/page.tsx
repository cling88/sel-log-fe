import { Suspense } from "react";
import { LedgerHeader } from "@/components/ledger/ledger-header";
import { LedgerTabContent } from "@/components/ledger/ledger-tab-content";

export default function LedgerPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
        장부
      </h1>
      <Suspense fallback={<div className="text-sm text-[var(--color-text-muted)]">로딩 중...</div>}>
        <LedgerHeader />
        <LedgerTabContent />
      </Suspense>
    </div>
  );
}
