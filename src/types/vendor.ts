export type Vendor = {
  id: string;
  name: string;
  link: string;
  createdAtIso: string;
  updatedAtIso: string;
};

export type VendorSummary = Pick<Vendor, "id" | "name" | "link">;

export type VendorInput = {
  name: string;
  link?: string;
};

/** 매입 라인 — 구매처 (BE 연동 후 스냅샷). `vendor` 문자열 필드와 구분 */
export type PurchaseLineVendorFields = {
  vendorId: string | null;
  vendorSnapshot: VendorSummary | null;
};
