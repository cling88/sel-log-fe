"use client";

import { ExternalLink } from "lucide-react";
import {
  formatPurchaseLineVendorLabel,
  purchaseVendorLink,
} from "@/lib/purchase-vendor-display";
import type { PurchaseLineVendorFields } from "@/types/vendor";

type PurchaseVendorLabelProps = Pick<
  PurchaseLineVendorFields,
  "vendorId" | "vendorSnapshot"
> & {
  vendor?: string;
  className?: string;
};

export function PurchaseVendorLabel({
  vendorId,
  vendorSnapshot,
  vendor,
  className,
}: PurchaseVendorLabelProps) {
  const label = formatPurchaseLineVendorLabel({
    vendorId,
    vendorSnapshot,
    vendor,
  });
  const link = purchaseVendorLink({ vendorSnapshot });

  if (link) {
    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="inline-flex max-w-full items-center gap-1 truncate hover:underline">
          {label}
          <ExternalLink className="size-3 shrink-0 opacity-70" />
        </span>
      </a>
    );
  }

  return <span className={className}>{label}</span>;
}
