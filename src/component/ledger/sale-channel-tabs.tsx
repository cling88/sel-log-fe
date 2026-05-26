"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { SaleChannelItem } from "@/types/sale-channel";

export type SaleChannelFilter = "all" | string;

interface SaleChannelTabsProps {
  channels: SaleChannelItem[];
  activeFilter: SaleChannelFilter;
  onFilterChange: (filter: SaleChannelFilter) => void;
  onChannelsChange: (channels: SaleChannelItem[]) => void;
  orderCountByChannel: (channelId: string) => number;
  totalOrderCount: number;
}

function slugChannelId(label: string): string {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "");
  return base || `ch-${Date.now()}`;
}

export function SaleChannelTabs({
  channels,
  activeFilter,
  onFilterChange,
  onChannelsChange,
  orderCountByChannel,
  totalOrderCount,
}: SaleChannelTabsProps) {
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState("");

  const submitNewChannel = () => {
    const label = newLabel.trim();
    if (!label) {
      setAdding(false);
      setNewLabel("");
      return;
    }
    let id = slugChannelId(label);
    if (channels.some((c) => c.id === id)) {
      id = `${id}-${channels.length + 1}`;
    }
    onChannelsChange([...channels, { id, label }]);
    onFilterChange(id);
    setNewLabel("");
    setAdding(false);
  };

  return (
    <div className="flex flex-wrap items-end gap-x-6 gap-y-2 border-b border-black/15 pb-0">
      <ChannelTab
        label="전체"
        count={totalOrderCount}
        active={activeFilter === "all"}
        onClick={() => onFilterChange("all")}
      />
      {channels.map((channel) => (
        <ChannelTab
          key={channel.id}
          label={channel.label}
          count={orderCountByChannel(channel.id)}
          active={activeFilter === channel.id}
          onClick={() => onFilterChange(channel.id)}
        />
      ))}
      {adding ? (
        <form
          className="mb-1 flex items-center gap-1.5"
          onSubmit={(e) => {
            e.preventDefault();
            submitNewChannel();
          }}
        >
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="채널명"
            autoFocus
            className="h-8 w-28 rounded-md border border-black/15 px-2 text-sm outline-none focus:border-black"
          />
          <button
            type="submit"
            className="h-8 rounded-md bg-black px-2.5 text-xs font-medium text-white"
          >
            추가
          </button>
          <button
            type="button"
            onClick={() => {
              setAdding(false);
              setNewLabel("");
            }}
            className="h-8 rounded-md px-2 text-xs text-black/60 hover:text-black"
          >
            취소
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="relative mb-2.5 text-sm font-medium text-black/50 hover:text-black"
        >
          + 채널 추가
        </button>
      )}
    </div>
  );
}

function ChannelTab({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex items-center gap-1.5 pb-2.5 text-sm font-medium transition-colors",
        active ? "text-black" : "text-black/50 hover:text-black/80",
      )}
    >
      {label}
      <span className="tabular-nums text-xs text-black/50">{count}</span>
      {active ? (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-black" />
      ) : null}
    </button>
  );
}
