import { Suspense } from "react";
import { LedgerView } from "@/component/ledger/ledger-view";

export default function LedgerPage() {
  return (
    <Suspense fallback={<div className="text-sm text-zinc-500">로딩 중...</div>}>
      <LedgerView />
    </Suspense>
  );
}
