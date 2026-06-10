"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { useAppDialog } from "@/components/common/app-dialog-provider";
import { Button } from "@/components/ui/button";
import { PurchaseListToolbar } from "@/components/ledger/purchase/purchase-list-toolbar";
import { PurchaseListPagination } from "@/components/ledger/purchase/purchase-list-pagination";
import { LedgerEmptyState } from "@/components/ledger/empty-state";
import {
  LedgerListShell,
  ledgerListBodyClass,
  ledgerListFooterClass,
} from "@/components/ledger/ledger-list-shell";
import { SourcingExcelDownloadButton } from "@/components/sourcing/sourcing-excel-download-button";
import { SourcingFavoriteToggle } from "@/components/sourcing/sourcing-favorite-toggle";
import { SourcingProductDetailDialog } from "@/components/sourcing/sourcing-product-detail-dialog";
import { SourcingProductFavoritesBar } from "@/components/sourcing/sourcing-product-favorites-bar";
import { SourcingProductRegisterDialog } from "@/components/sourcing/sourcing-product-register-dialog";
import { SourcingExternalLink } from "@/components/sourcing/sourcing-external-link";
import {
  useSourcingProductMutations,
  useSourcingProductsList,
} from "@/hooks/use-sourcing-products";
import { useSourcingProductFavorites } from "@/hooks/use-sourcing-product-favorites";
import { useSourcingUrlSearch } from "@/hooks/use-sourcing-url-search";
import { formatAmount } from "@/lib/purchase-product-calc";
import { parseSourcingPage, replaceSourcingQuery } from "@/lib/sourcing-url";
import { cn } from "@/lib/utils";
import type { CreateSourcingProductBody, SourcingProduct } from "@/types/sourcing";

export function SourcingProductPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const { alert, confirm } = useAppDialog();
  const searchParams = useSearchParams();
  const page = parseSourcingPage(searchParams.get("page"));
  const { search, committedSearch, setSearch, applySearch, clearSearch } =
    useSourcingUrlSearch();

  const {
    products,
    meta,
    totalPages,
    safePage,
    isLoading,
    isError,
    errorMessage,
  } = useSourcingProductsList(committedSearch, page);

  const {
    createProduct,
    updateProduct,
    deleteProduct,
    isCreating,
    isUpdating,
  } = useSourcingProductMutations();

  const {
    favorites: favoriteProducts,
    isFavorite,
    toggleFavorite,
    isToggling: isFavoriteToggling,
    togglingId: favoriteTogglingId,
  } = useSourcingProductFavorites();

  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<SourcingProduct | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState<SourcingProduct | null>(null);

  const saving = isCreating || isUpdating;
  const isEmpty = !isLoading && (meta?.total ?? 0) === 0 && !committedSearch;
  const isSearchEmpty =
    !isLoading && (meta?.total ?? 0) === 0 && !!committedSearch;

  const openCreate = () => {
    setEditProduct(null);
    setFormOpen(true);
  };

  const openDetail = (product: SourcingProduct) => {
    setDetailProduct(product);
    setDetailOpen(true);
  };

  const openEdit = (product: SourcingProduct) => {
    setEditProduct(product);
    setFormOpen(true);
  };

  const handleSave = async (input: CreateSourcingProductBody) => {
    if (editProduct) {
      await updateProduct(editProduct.id, input);
    } else {
      await createProduct(input);
    }
  };

  const handleDelete = async (product: SourcingProduct) => {
    const ok = await confirm({
      title: "제품소싱 삭제",
      message: `"${product.name}" 항목을 삭제할까요?`,
      confirmLabel: "삭제",
      destructive: true,
    });
    if (!ok) return;
    await deleteProduct(product.id);
    setDetailOpen(false);
    setDetailProduct(null);
    await alert("삭제되었습니다.");
  };

  return (
    <>
      <LedgerListShell>
        <PurchaseListToolbar
          embedded
          search={search}
          searchSubmitMode
          onSearchChange={setSearch}
          onSearchSubmit={() => applySearch(search)}
          onSearchClear={clearSearch}
          searchPlaceholder="상품명, 채널명, 가격 검색"
          registerLabel="+ 제품 등록"
          onRegister={openCreate}
          endContent={<SourcingExcelDownloadButton kind="products" />}
        />

        <SourcingProductFavoritesBar
          favorites={favoriteProducts}
          togglingId={favoriteTogglingId}
          onSelect={openDetail}
          onToggleFavorite={(product) =>
            void toggleFavorite(product.id, true)
          }
        />

        {isError ? (
          <div className={ledgerListBodyClass}>
            <p className="py-8 text-center text-sm text-[var(--color-danger)]">
              {errorMessage ?? "목록을 불러오지 못했습니다."}
            </p>
          </div>
        ) : isLoading ? (
          <div className={ledgerListBodyClass}>
            <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
              불러오는 중…
            </p>
          </div>
        ) : isEmpty ? (
          <div className={ledgerListBodyClass}>
            <LedgerEmptyState
              title="등록된 제품소싱이 없습니다"
              description="후보 상품을 이미지·가격과 함께 등록해 보세요."
              actionLabel="+ 제품 등록"
              onAction={openCreate}
            />
          </div>
        ) : isSearchEmpty ? (
          <div className={ledgerListBodyClass}>
            <p className="py-8 text-center text-sm text-[var(--color-text-muted)]">
              검색 결과가 없습니다.
            </p>
          </div>
        ) : (
          <div
            className={cn(
              ledgerListBodyClass,
              "grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3",
            )}
          >
            {products.map((product) => (
              <article
                key={product.id}
                role="button"
                tabIndex={0}
                className="relative flex h-[90px] cursor-pointer gap-3 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white p-2.5 pr-10 shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--color-bg)]/40"
                onClick={() => openDetail(product)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openDetail(product);
                  }
                }}
              >
                <div
                  className="absolute right-1 top-1 z-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <SourcingFavoriteToggle
                    active={isFavorite(product.id)}
                    loading={
                      isFavoriteToggling && favoriteTogglingId === product.id
                    }
                    label={product.name}
                    className="size-7"
                    onToggle={() =>
                      void toggleFavorite(product.id, isFavorite(product.id))
                    }
                  />
                </div>

                <div className="relative size-[72px] shrink-0 overflow-hidden rounded-lg bg-[var(--color-bg)]">
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center px-1 text-center text-[10px] leading-tight text-[var(--color-text-muted)]">
                      이미지 없음
                    </div>
                  )}
                </div>

                <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5 overflow-hidden">
                  <h3
                    className="line-clamp-1 h-5 shrink-0 text-sm font-semibold leading-5 text-[var(--color-text-primary)]"
                    title={
                      product.channel?.name
                        ? `${product.channel.name} · ${product.name}`
                        : product.name
                    }
                  >
                    {product.channel?.name ? (
                      <>
                        <span className="font-medium text-[var(--color-text-secondary)]">
                          {product.channel.name}
                        </span>
                        <span className="text-[var(--color-text-muted)]"> · </span>
                      </>
                    ) : null}
                    {product.name}
                  </h3>
                  <p
                    className="line-clamp-1 h-4 shrink-0 text-xs tabular-nums leading-4 text-[var(--color-text-secondary)]"
                    title={`MOQ ${product.quantity} · 총 ${formatAmount(product.totalPrice)}원 (개당 ${formatAmount(product.unitPrice)}원)`}
                  >
                    MOQ {product.quantity} · 총{" "}
                    {formatAmount(product.totalPrice)}원
                    <span className="text-[var(--color-text-muted)]">
                      {" "}
                      (개당 {formatAmount(product.unitPrice)}원)
                    </span>
                  </p>
                  <div
                    className="flex h-[18px] shrink-0 items-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <SourcingExternalLink href={product.productUrl ?? ""} />
                  </div>
                </div>

                <div
                  className="absolute bottom-1 right-1 z-10 flex items-center gap-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="size-7"
                    onClick={() => openEdit(product)}
                    aria-label="수정"
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="size-7 text-[var(--color-danger)]"
                    onClick={() => void handleDelete(product)}
                    aria-label="삭제"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className={ledgerListFooterClass}>
          <PurchaseListPagination
            page={safePage}
            totalPages={totalPages}
            onPageChange={(next) => {
              replaceSourcingQuery(router, pathname, searchParams, (params) => {
                if (next <= 1) params.delete("page");
                else params.set("page", String(next));
              });
            }}
          />
        </div>
      </LedgerListShell>

      <SourcingProductDetailDialog
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setDetailProduct(null);
        }}
        product={detailProduct}
        isFavorite={detailProduct ? isFavorite(detailProduct.id) : false}
        favoriteLoading={
          detailProduct != null &&
          isFavoriteToggling &&
          favoriteTogglingId === detailProduct.id
        }
        onToggleFavorite={
          detailProduct
            ? () =>
                void toggleFavorite(
                  detailProduct.id,
                  isFavorite(detailProduct.id),
                )
            : undefined
        }
        onEdit={openEdit}
        onDelete={(product) => void handleDelete(product)}
      />

      <SourcingProductRegisterDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editProduct={editProduct}
        saving={saving}
        onSave={handleSave}
      />
    </>
  );
}
