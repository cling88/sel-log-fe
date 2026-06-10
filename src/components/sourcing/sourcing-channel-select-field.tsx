"use client";

import { useMemo, useState } from "react";
import { SourcingChannelDeleteBlockedDialog } from "@/components/sourcing/sourcing-channel-delete-blocked-dialog";
import { SourcingChannelManageDialog } from "@/components/sourcing/sourcing-channel-manage-dialog";
import { useSourcingChannelsPicker } from "@/hooks/use-sourcing-channels";
import { LedgerPickerTrigger } from "@/components/ledger/ledger-picker-trigger";
import { parseChannelHasProductsFromError } from "@/lib/sourcing-channel-delete";
import { cn } from "@/lib/utils";
import type { CreateSourcingChannelBody, SourcingProduct } from "@/types/sourcing";

interface SourcingChannelSelectFieldProps {
  channelId: string | null;
  onChannelIdChange: (channelId: string | null) => void;
  className?: string;
  labelClassName?: string;
  disabled?: boolean;
}

export function SourcingChannelSelectField({
  channelId,
  onChannelIdChange,
  className,
  labelClassName,
  disabled = false,
}: SourcingChannelSelectFieldProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [blockedDialog, setBlockedDialog] = useState<{
    channelName: string;
    products: SourcingProduct[];
  } | null>(null);

  const {
    channels,
    createChannel,
    updateChannel,
    deleteChannel,
    productCountByChannelId,
  } = useSourcingChannelsPicker();

  const selected = useMemo(
    () => channels.find((ch) => ch.id === channelId) ?? null,
    [channels, channelId],
  );

  const displayLabel = selected?.name ?? "선택";

  const handleCreate = async (body: CreateSourcingChannelBody) => {
    const created = await createChannel(body);
    onChannelIdChange(created.id);
    setDialogOpen(false);
  };

  const handleUpdate = async (id: string, body: CreateSourcingChannelBody) => {
    await updateChannel(id, body);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteChannel(id);
      if (channelId === id) onChannelIdChange(null);
    } catch (error) {
      const products = parseChannelHasProductsFromError(error);
      if (products) {
        const channel = channels.find((ch) => ch.id === id);
        setBlockedDialog({
          channelName: channel?.name ?? "채널",
          products,
        });
      }
    }
  };

  return (
    <>
      <LedgerPickerTrigger
        className={cn(className)}
        labelClassName={labelClassName}
        label="소싱 채널"
        displayValue={displayLabel}
        isEmpty={!selected}
        disabled={disabled}
        onOpen={() => setDialogOpen(true)}
        emptyHint={
          channels.length === 0
            ? "소싱 채널이 없습니다. 클릭하여 추가해 주세요."
            : undefined
        }
      />

      <SourcingChannelManageDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        channels={channels}
        selectedChannelId={channelId}
        productCountByChannelId={productCountByChannelId}
        onSelect={(id) => {
          onChannelIdChange(id);
          setDialogOpen(false);
        }}
        onClear={
          channelId
            ? () => {
                onChannelIdChange(null);
                setDialogOpen(false);
              }
            : undefined
        }
        onCreate={handleCreate}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
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
