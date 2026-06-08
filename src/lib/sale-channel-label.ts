import type { SalesChannelSummary } from "@/types/sale-channel";

export function formatSaleChannelLabel(
  channelId: string | null,
  channel: SalesChannelSummary | null,
): string {
  if (channel?.name) return channel.name;
  if (channelId) return "삭제된 판매채널 (재선택 권장)";
  return "선택";
}
