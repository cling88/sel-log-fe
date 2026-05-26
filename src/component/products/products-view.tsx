"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ProductListPanel } from "@/component/products/product-list-panel";
import { ProductModal } from "@/component/products/product-modal";
import { ProductSidePanel } from "@/component/products/product-side-panel";
import { createProduct } from "@/lib/product-factory";
import { useMasterData } from "@/context/master-data-context";
import {
  getProductHistory,
  INITIAL_PRODUCTS,
  INITIAL_PRODUCT_PURCHASE_HISTORY,
  INITIAL_PRODUCT_SALE_HISTORY,
} from "@/lib/pub-seed";
import type { Product } from "@/types/product";

type ModalState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "edit"; product: Product };

export function ProductsView() {
  const { categories } = useMasterData();
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [selectedId, setSelectedId] = useState(INITIAL_PRODUCTS[0]?.id ?? "");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.mainVendor.toLowerCase().includes(q),
    );
  }, [products, search]);

  const selected =
    products.find((p) => p.id === selectedId) ?? filtered[0] ?? null;

  useEffect(() => {
    if (filtered.length === 0) return;
    const stillVisible = filtered.some((p) => p.id === selectedId);
    if (!stillVisible) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const purchaseHistory = useMemo(
    () =>
      selected
        ? getProductHistory(
            selected.id,
            "purchase",
            INITIAL_PRODUCT_PURCHASE_HISTORY,
          )
        : [],
    [selected],
  );

  const saleHistory = useMemo(
    () =>
      selected
        ? getProductHistory(selected.id, "sale", INITIAL_PRODUCT_SALE_HISTORY)
        : [],
    [selected],
  );

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
    setMobileShowDetail(true);
  }, []);

  const handleDelete = useCallback(
    (product: Product) => {
      if (
        !window.confirm(`"${product.name}" 상품을 삭제할까요? (퍼블용 로컬 상태)`)
      ) {
        return;
      }
      setProducts((prev) => {
        const next = prev.filter((p) => p.id !== product.id);
        if (selectedId === product.id && next.length > 0) {
          setSelectedId(next[0].id);
        } else if (next.length === 0) {
          setSelectedId("");
          setMobileShowDetail(false);
        }
        return next;
      });
    },
    [selectedId],
  );

  const saveProduct = (payload: {
    name: string;
    category: string;
    mainVendor: string;
    memo: string;
  }) => {
    if (modal.open && modal.mode === "edit") {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === modal.product.id
            ? {
                ...p,
                name: payload.name,
                category: payload.category,
                mainVendor: payload.mainVendor,
                memo: payload.memo,
              }
            : p,
        ),
      );
      setModal({ open: false });
      return;
    }

    const created = createProduct(products, categories, {
      name: payload.name,
      category: payload.category,
      mainVendor: payload.mainVendor,
      memo: payload.memo,
    });
    setProducts((prev) => [...prev, created]);
    setSelectedId(created.id);
    setMobileShowDetail(true);
    setModal({ open: false });
  };

  const modalInitial =
    modal.open && modal.mode === "edit" ? modal.product : undefined;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight text-black">
        상품관리
      </h1>

      <div className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-black/15 bg-white lg:flex-row">
        <div
          className={
            mobileShowDetail && selected ? "hidden lg:contents" : "contents"
          }
        >
          <ProductListPanel
            products={filtered}
            selectedId={selected?.id ?? ""}
            search={search}
            onSearchChange={setSearch}
            onSelect={handleSelect}
            onRegister={() => setModal({ open: true, mode: "create" })}
            onEdit={(product) =>
              setModal({ open: true, mode: "edit", product })
            }
            onDelete={handleDelete}
          />
        </div>

        {selected ? (
          <div
            className={
              mobileShowDetail
                ? "flex min-h-[480px] flex-1 flex-col lg:flex"
                : "hidden min-h-[480px] flex-1 flex-col lg:flex"
            }
          >
            <ProductSidePanel
              product={selected}
              purchaseHistory={purchaseHistory}
              saleHistory={saleHistory}
              onEdit={() =>
                setModal({ open: true, mode: "edit", product: selected })
              }
              onDelete={() => handleDelete(selected)}
              onBack={() => setMobileShowDetail(false)}
            />
          </div>
        ) : (
          <div className="hidden flex-1 items-center justify-center p-8 text-sm text-black/50 lg:flex">
            상품을 선택하거나 등록해 주세요.
          </div>
        )}
      </div>

      <ProductModal
        open={modal.open}
        mode={modal.open ? modal.mode : "create"}
        initial={modalInitial}
        existingProducts={products}
        onClose={() => setModal({ open: false })}
        onSave={saveProduct}
      />
    </div>
  );
}
