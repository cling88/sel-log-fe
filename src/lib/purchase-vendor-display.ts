import { formatVendorLabel } from "@/lib/vendor-label";
import type { PurchaseLineVendorFields } from "@/types/vendor";

export function formatPurchaseLineVendorLabel(
  line: Pick<PurchaseLineVendorFields, "vendorId" | "vendorSnapshot"> & {
    /** API·폼 전송용 구매처명 */
    vendor?: string;
  },
  deletedLabel = "삭제된 구매처",
): string {
  if (line.vendorSnapshot) return formatVendorLabel(line.vendorSnapshot);
  const legacy = line.vendor?.trim();
  if (legacy) return legacy;
  if (line.vendorId) return deletedLabel;
  return "—";
}

export function purchaseVendorLink(
  line: Pick<PurchaseLineVendorFields, "vendorSnapshot">,
): string | null {
  const link = line.vendorSnapshot?.link?.trim();
  if (link && (link.startsWith("http://") || link.startsWith("https://"))) {
    return link;
  }
  return null;
}

export function purchaseVendorIdForApi(
  vendorId: string | null | undefined,
): string | null {
  const trimmed = vendorId?.trim();
  return trimmed || null;
}
