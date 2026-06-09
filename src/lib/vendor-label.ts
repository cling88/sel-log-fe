import type { VendorSummary } from "@/types/vendor";

export function formatVendorLabel(
  vendor: Pick<VendorSummary, "name" | "link">,
): string {
  return vendor.name;
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
