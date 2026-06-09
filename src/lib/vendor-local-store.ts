import type { Vendor, VendorInput } from "@/types/vendor";

let vendors: Vendor[] = [];
let version = 0;
const listeners = new Set<() => void>();

function emit() {
  version += 1;
  listeners.forEach((listener) => listener());
}

export function subscribeVendors(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getVendorsSnapshot(): Vendor[] {
  return vendors;
}

export function getVendorsVersion(): number {
  return version;
}

function normalizeName(name: string): string {
  return name.trim();
}

export function localFindVendorByName(name: string): Vendor | undefined {
  const key = normalizeName(name);
  return vendors.find((v) => normalizeName(v.name) === key);
}

export function localCreateVendor(input: VendorInput): Vendor {
  const name = normalizeName(input.name);
  if (!name) {
    throw new Error("구매처명을 입력해 주세요.");
  }
  if (localFindVendorByName(name)) {
    throw new Error("이미 등록된 구매처입니다.");
  }
  const now = new Date().toISOString();
  const link = input.link?.trim() ?? "";
  const vendor: Vendor = {
    id: crypto.randomUUID(),
    name,
    link,
    createdAtIso: now,
    updatedAtIso: now,
  };
  vendors = [...vendors, vendor];
  emit();
  return vendor;
}

export function localUpdateVendor(id: string, input: VendorInput): Vendor {
  const name = normalizeName(input.name);
  if (!name) {
    throw new Error("구매처명을 입력해 주세요.");
  }
  const duplicate = localFindVendorByName(name);
  if (duplicate && duplicate.id !== id) {
    throw new Error("이미 등록된 구매처입니다.");
  }
  const link = input.link?.trim() ?? "";
  let updated: Vendor | null = null;
  vendors = vendors.map((v) => {
    if (v.id !== id) return v;
    updated = {
      ...v,
      name,
      link,
      updatedAtIso: new Date().toISOString(),
    };
    return updated;
  });
  if (!updated) {
    throw new Error("구매처를 찾을 수 없습니다.");
  }
  emit();
  return updated;
}

export function localDeleteVendor(id: string): void {
  const next = vendors.filter((v) => v.id !== id);
  if (next.length === vendors.length) {
    throw new Error("구매처를 찾을 수 없습니다.");
  }
  vendors = next;
  emit();
}
