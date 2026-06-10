"use client";

import { SourcingChannelPanel } from "@/components/sourcing/sourcing-channel-panel";
import { SourcingProductPanel } from "@/components/sourcing/sourcing-product-panel";
import { SourcingTabs, useSourcingTab } from "@/components/sourcing/sourcing-tabs";

function SourcingTabPanels() {
  const tab = useSourcingTab();

  return (
    <div className="mt-4">
      {tab === "channels" ? <SourcingChannelPanel /> : <SourcingProductPanel />}
    </div>
  );
}

export function SourcingPageContent() {
  return (
    <div className="flex flex-col gap-4">
      <SourcingTabs />
      <SourcingTabPanels />
    </div>
  );
}
