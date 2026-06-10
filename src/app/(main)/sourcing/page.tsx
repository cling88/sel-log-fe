import { Suspense } from "react";
import { SourcingPageContent } from "@/components/sourcing/sourcing-page-content";

function SourcingFallback() {
  return (
    <p className="text-sm text-[var(--color-text-muted)]">로딩 중...</p>
  );
}

export default function SourcingPage() {
  return (
    <div className="flex flex-col gap-6 pb-[150px] md:pb-8">
      <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
        소싱
      </h1>
      <Suspense fallback={<SourcingFallback />}>
        <SourcingPageContent />
      </Suspense>
    </div>
  );
}
