"use client";

import { useMemo, useState } from "react";
import { SaleChannelManageDialog } from "@/components/ledger/sale/sale-channel-manage-dialog";
import { LedgerPickerTrigger } from "@/components/ledger/ledger-picker-trigger";
import { useSalesChannels } from "@/hooks/use-sales-channels";
import { formatSaleChannelLabel } from "@/lib/sale-channel-label";
import { cn } from "@/lib/utils";
import type { SalesChannelSummary } from "@/types/sale-channel";

interface SaleChannelSelectFieldProps {
  channelId: string | null;
  onChannelIdChange: (channelId: string | null) => void;
  /** API `channel` 스냅샷 (목록에 없을 때 표시용) */
  channelSnapshot?: SalesChannelSummary | null;
  className?: string;
  labelClassName?: string;
  disabled?: boolean;
}

export function SaleChannelSelectField({
  channelId,
  onChannelIdChange,
  channelSnapshot,
  className,
  labelClassName,
  disabled = false,
}: SaleChannelSelectFieldProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const {
    channels,
    isLoading,
    errorMessage,
    createChannel,
    updateChannel,
    deleteChannel,
    isCreating,
    isUpdating,
    isDeleting,
  } = useSalesChannels();

  const selectedFromList = useMemo(
    () => channels.find((c) => c.id === channelId) ?? null,
    [channels, channelId],
  );

  const displayLabel = useMemo(() => {
    if (selectedFromList) return selectedFromList.name;
    if (channelSnapshot && channelSnapshot.id === channelId) {
      return channelSnapshot.name;
    }
    return formatSaleChannelLabel(channelId, channelSnapshot ?? null);
  }, [channelId, channelSnapshot, selectedFromList]);

  const mutating = isCreating || isUpdating || isDeleting;

  return (
    <>
      <LedgerPickerTrigger
        className={cn(className)}
        labelClassName={labelClassName}
        label="판매채널"
        displayValue={displayLabel}
        isEmpty={displayLabel === "선택"}
        disabled={disabled}
        onOpen={() => setDialogOpen(true)}
        emptyHint={
          channels.length === 0 && !isLoading
            ? "판매채널이 없습니다. 클릭하여 추가해 주세요."
            : undefined
        }
      />

      <SaleChannelManageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        channels={channels}
        selectedChannelId={channelId}
        loading={isLoading}
        loadError={errorMessage}
        mutating={mutating}
        onSelect={async (id) => {
          onChannelIdChange(id);
          setDialogOpen(false);
        }}
        onClear={
          channelId
            ? async () => {
                onChannelIdChange(null);
                setDialogOpen(false);
              }
            : undefined
        }
        onCreate={async (body) => {
          const created = await createChannel(body);
          onChannelIdChange(created.id);
          setDialogOpen(false);
        }}
        onUpdate={async (id, body) => {
          await updateChannel(id, body);
        }}
        onDelete={async (id) => {
          await deleteChannel(id);
          if (channelId === id) onChannelIdChange(null);
        }}
      />
    </>
  );
}
