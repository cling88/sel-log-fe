export interface SaleChannelItem {
  id: string;
  label: string;
}

/** 주문·매출에 저장되는 채널 ID */
export type SaleChannelId = string;

export function getSaleChannelLabel(
  channels: SaleChannelItem[],
  channelId: SaleChannelId,
): string {
  return channels.find((c) => c.id === channelId)?.label ?? channelId;
}
