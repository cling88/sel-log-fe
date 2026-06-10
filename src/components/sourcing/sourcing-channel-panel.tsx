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
import { SourcingChannelDeleteBlockedDialog } from "@/components/sourcing/sourcing-channel-delete-blocked-dialog";
import { SourcingChannelFavoritesBar } from "@/components/sourcing/sourcing-channel-favorites-bar";
import { SourcingChannelFormDialog } from "@/components/sourcing/sourcing-channel-form-dialog";
import { SourcingExcelDownloadButton } from "@/components/sourcing/sourcing-excel-download-button";
import { SourcingExternalLink } from "@/components/sourcing/sourcing-external-link";
import { SourcingFavoriteToggle } from "@/components/sourcing/sourcing-favorite-toggle";
import {
  useSourcingChannelMutations,
  useSourcingChannelsList,
} from "@/hooks/use-sourcing-channels";
import { useSourcingChannelFavorites } from "@/hooks/use-sourcing-channel-favorites";
import { useSourcingUrlSearch } from "@/hooks/use-sourcing-url-search";
import { parseChannelHasProductsFromError } from "@/lib/sourcing-channel-delete";
import { parseSourcingPage, replaceSourcingQuery } from "@/lib/sourcing-url";
import type { CreateSourcingChannelBody, SourcingChannel, SourcingProduct } from "@/types/sourcing";

export function SourcingChannelPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const { alert, confirm } = useAppDialog();
  const searchParams = useSearchParams();
  const page = parseSourcingPage(searchParams.get("page"));
  const { search, committedSearch, setSearch, applySearch, clearSearch } =
    useSourcingUrlSearch();

  const {
    channels,
    meta,
    totalPages,
    safePage,
    isLoading,
    isError,
    errorMessage,
  } = useSourcingChannelsList(committedSearch, page);

  const {
    createChannel,
    updateChannel,
    deleteChannel,
    isCreating,
    isUpdating,
  } = useSourcingChannelMutations();

  const {
    favorites: favoriteChannels,
    isFavorite,
    toggleFavorite,
    isToggling: isFavoriteToggling,
    togglingId: favoriteTogglingId,
  } = useSourcingChannelFavorites();

  const [formOpen, setFormOpen] = useState(false);
  const [editChannel, setEditChannel] = useState<SourcingChannel | null>(null);
  const [blockedDialog, setBlockedDialog] = useState<{
    channelName: string;
    products: SourcingProduct[];
  } | null>(null);

  const saving = isCreating || isUpdating;
  const isEmpty = !isLoading && (meta?.total ?? 0) === 0 && !committedSearch;
  const isSearchEmpty =
    !isLoading && (meta?.total ?? 0) === 0 && !!committedSearch;

  const openCreate = () => {
    setEditChannel(null);
    setFormOpen(true);
  };

  const openEdit = (channel: SourcingChannel) => {
    setEditChannel(channel);
    setFormOpen(true);
  };

  const handleSave = async (input: CreateSourcingChannelBody) => {
    if (editChannel) {
      await updateChannel(editChannel.id, input);
      await alert("저장되었습니다.");
    } else {
      await createChannel(input);
      await alert("등록되었습니다.");
    }
  };

  const handleDelete = async (channel: SourcingChannel) => {
    const ok = await confirm({
      title: "소싱 채널 삭제",
      message: `"${channel.name}" 채널을 삭제할까요?`,
      confirmLabel: "삭제",
      destructive: true,
    });
    if (!ok) return;

    try {
      await deleteChannel(channel.id);
      await alert("삭제되었습니다.");
    } catch (error) {
      const products = parseChannelHasProductsFromError(error);
      if (products) {
        setBlockedDialog({
          channelName: channel.name,
          products,
        });
      }
    }
  };

  const handleFavoriteChannelSelect = (channel: SourcingChannel) => {
    setSearch(channel.name);
    applySearch(channel.name);
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
          searchPlaceholder="상호명, URL, 메모 검색"
          registerLabel="+ 채널 등록"
          onRegister={openCreate}
          endContent={<SourcingExcelDownloadButton kind="channels" />}
        />

        <SourcingChannelFavoritesBar
          favorites={favoriteChannels}
          togglingId={favoriteTogglingId}
          onSelect={handleFavoriteChannelSelect}
          onToggleFavorite={(channel) =>
            void toggleFavorite(channel.id, true)
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
              title="등록된 소싱 채널이 없습니다"
              description="도매몰·공장 등 소싱처를 등록해 보세요."
              actionLabel="+ 채널 등록"
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 text-xs text-[var(--color-text-muted)]">
                  <th className="w-10 px-2 py-2.5 font-medium" aria-label="즐겨찾기" />
                  <th className="px-4 py-2.5 font-medium">상호명</th>
                  <th className="px-4 py-2.5 font-medium">링크</th>
                  <th className="px-4 py-2.5 font-medium">메모</th>
                  <th className="px-4 py-2.5 font-medium text-center">제품</th>
                  <th className="px-4 py-2.5 font-medium text-right">관리</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((channel) => (
                  <tr
                    key={channel.id}
                    className="border-b border-[var(--color-border)] last:border-b-0"
                  >
                    <td className="px-2 py-3">
                      <SourcingFavoriteToggle
                        active={isFavorite(channel.id)}
                        loading={
                          isFavoriteToggling && favoriteTogglingId === channel.id
                        }
                        label={channel.name}
                        onToggle={() =>
                          void toggleFavorite(channel.id, isFavorite(channel.id))
                        }
                      />
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">
                      {channel.name}
                    </td>
                    <td className="px-4 py-3">
                      {channel.url ? (
                        <SourcingExternalLink href={channel.url} />
                      ) : (
                        <span className="text-xs text-[var(--color-text-muted)]">
                          —
                        </span>
                      )}
                    </td>
                    <td className="max-w-[200px] px-4 py-3 text-[var(--color-text-secondary)]">
                      {channel.memo ? (
                        <span className="line-clamp-2" title={channel.memo}>
                          {channel.memo}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--color-text-muted)]">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-[var(--color-text-secondary)]">
                      {channel.productCount ?? 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="size-8"
                          onClick={() => openEdit(channel)}
                          aria-label="수정"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="size-8 text-[var(--color-danger)]"
                          onClick={() => void handleDelete(channel)}
                          aria-label="삭제"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      <SourcingChannelFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editChannel={editChannel}
        saving={saving}
        onSave={handleSave}
      />

      <SourcingChannelDeleteBlockedDialog
        open={blockedDialog != null}
        onOpenChange={(open) => {
          if (!open) setBlockedDialog(null);
        }}
        channelName={blockedDialog?.channelName ?? ""}
        products={blockedDialog?.products ?? []}
      />
    </>
  );
}
