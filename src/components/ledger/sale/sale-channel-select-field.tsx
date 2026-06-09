"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SaleChannelManageDialog } from "@/components/ledger/sale/sale-channel-manage-dialog";
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
      <div className={cn("space-y-1.5", className)}>
        <div className="flex items-center justify-between gap-2">
          <Label className={labelClassName}>판매채널</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 whitespace-nowrap"
            disabled={disabled}
            onClick={() => setDialogOpen(true)}
          >
            선택
          </Button>
        </div>
        <div
          className={cn(
            "flex min-h-9 items-center rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm",
            displayLabel !== "선택"
              ? "text-[var(--color-text-primary)]"
              : "text-[var(--color-text-muted)]",
          )}
        >
          <span className="min-w-0 truncate">{displayLabel}</span>
        </div>
        {channels.length === 0 && !isLoading ? (
          <p className="text-xs text-[var(--color-text-muted)]">
            판매채널이 없습니다. 선택 버튼에서 추가해 주세요.
          </p>
        ) : null}
      </div>

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
