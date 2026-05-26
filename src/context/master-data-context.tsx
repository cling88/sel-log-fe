"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getCategoryLabel, getCategorySkuCode } from "@/lib/category";
import { INITIAL_CATEGORIES, INITIAL_VENDORS } from "@/lib/pub-seed";
import type { ProductCategoryItem } from "@/types/master-data";

interface MasterDataContextValue {
  categories: ProductCategoryItem[];
  vendors: string[];
  getCategoryLabel: (categoryId: string) => string;
  getCategorySkuCode: (categoryId: string) => string;
  addCategory: (payload: { label: string; skuCode: string }) => ProductCategoryItem;
  updateCategory: (
    id: string,
    patch: { label?: string; skuCode?: string },
  ) => void;
  removeCategory: (id: string) => void;
  addVendor: (name: string) => void;
  updateVendor: (oldName: string, newName: string) => void;
  removeVendor: (name: string) => void;
}

const MasterDataContext = createContext<MasterDataContextValue | null>(null);

function normalizeSkuCode(code: string): string {
  return code.trim().toUpperCase().slice(0, 1);
}

function normalizeVendorName(name: string): string {
  return name.trim();
}

export function MasterDataProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] =
    useState<ProductCategoryItem[]>(INITIAL_CATEGORIES);
  const [vendors, setVendors] = useState<string[]>(INITIAL_VENDORS);

  const addCategory = useCallback(
    (payload: { label: string; skuCode: string }) => {
      const label = payload.label.trim();
      const skuCode = normalizeSkuCode(payload.skuCode);
      if (!label || !skuCode) {
        throw new Error("카테고리명과 SKU 코드를 입력해 주세요.");
      }
      if (categories.some((c) => c.skuCode === skuCode)) {
        throw new Error(`SKU 코드 "${skuCode}"는 이미 사용 중입니다.`);
      }
      const created: ProductCategoryItem = {
        id: `cat-${Date.now()}`,
        label,
        skuCode,
      };
      setCategories((prev) => [...prev, created]);
      return created;
    },
    [categories],
  );

  const updateCategory = useCallback(
    (id: string, patch: { label?: string; skuCode?: string }) => {
      setCategories((prev) =>
        prev.map((c) => {
          if (c.id !== id) return c;
          const nextSkuCode =
            patch.skuCode != null ? normalizeSkuCode(patch.skuCode) : c.skuCode;
          if (
            patch.skuCode != null &&
            prev.some((x) => x.id !== id && x.skuCode === nextSkuCode)
          ) {
            throw new Error(`SKU 코드 "${nextSkuCode}"는 이미 사용 중입니다.`);
          }
          return {
            ...c,
            label: patch.label?.trim() || c.label,
            skuCode: nextSkuCode,
          };
        }),
      );
    },
    [],
  );

  const removeCategory = useCallback((id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const addVendor = useCallback((name: string) => {
    const normalized = normalizeVendorName(name);
    if (!normalized) return;
    setVendors((prev) =>
      prev.some((v) => v === normalized) ? prev : [...prev, normalized],
    );
  }, []);

  const updateVendor = useCallback((oldName: string, newName: string) => {
    const normalized = normalizeVendorName(newName);
    if (!normalized) return;
    setVendors((prev) => {
      if (prev.some((v) => v === normalized && v !== oldName)) {
        throw new Error("이미 등록된 구매처입니다.");
      }
      return prev.map((v) => (v === oldName ? normalized : v));
    });
  }, []);

  const removeVendor = useCallback((name: string) => {
    setVendors((prev) => prev.filter((v) => v !== name));
  }, []);

  const value = useMemo<MasterDataContextValue>(
    () => ({
      categories,
      vendors,
      getCategoryLabel: (id) => getCategoryLabel(categories, id),
      getCategorySkuCode: (id) => getCategorySkuCode(categories, id),
      addCategory,
      updateCategory,
      removeCategory,
      addVendor,
      updateVendor,
      removeVendor,
    }),
    [
      categories,
      vendors,
      addCategory,
      updateCategory,
      removeCategory,
      addVendor,
      updateVendor,
      removeVendor,
    ],
  );

  return (
    <MasterDataContext.Provider value={value}>
      {children}
    </MasterDataContext.Provider>
  );
}

export function useMasterData() {
  const ctx = useContext(MasterDataContext);
  if (!ctx) {
    throw new Error("useMasterData는 MasterDataProvider 안에서 사용해야 합니다.");
  }
  return ctx;
}
